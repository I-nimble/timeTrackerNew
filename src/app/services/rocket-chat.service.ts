import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {
  BehaviorSubject,
  Observable,
  Subject,
  map,
  of,
  catchError,
  switchMap,
  forkJoin,
  filter,
  firstValueFrom,
  throwError
} from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  RocketChatCredentials,
  RocketChatUser,
  RocketChatRoom,
  RocketChatMessage,
  RocketChatTeam,
  RocketChatUserResponse,
  RocketChatMessageAttachment
} from '../models/rocketChat.model';
import { AnyCatcher } from 'rxjs/internal/AnyCatcher';
import { C } from '@angular/cdk/keycodes';

@Injectable({
  providedIn: 'root',
})
export class RocketChatService {
  private CHAT_API_URI = `${environment.rocketChatUrl}/api/v1/`;
  private API_URI = `${environment.apiUrl}/rocket-chat/`;
  private socket: WebSocket | null = null;

  private connectionSubject = new BehaviorSubject<boolean>(false);
  private credentialsSubject =
    new BehaviorSubject<RocketChatCredentials | null>(null);
  private messageStreamSubject = new Subject<RocketChatMessage>();
  private roomUpdateSubject = new Subject<any>();
  private userNotifySubject = new Subject<any>();
  private activeRoomSubject = new Subject<string | null>();
  private unreadMap: Record<string, number> = {};
  private unreadMapSubject = new BehaviorSubject<Record<string, number>>({});
  private activeJitsiSubject = new BehaviorSubject<any | null>(null);
  private currentActiveRoom: string | null = null;

  private credentials: RocketChatCredentials | null = null;
  private activeSubscriptions = new Map<string, string>();
  private messageId = 0;
  private subscriptionId = 0;

  private typingUsers = new Map<string, Set<string>>(); // roomId -> Set of usernames
  private typingTimeout = new Map<string, NodeJS.Timeout>(); // userId -> timeout
  private typingSubject = new Subject<{
    roomId: string;
    username: string;
    isTyping: boolean;
  }>();
  public typing$ = this.typingSubject.asObservable();

  loggedInUser: RocketChatUser | null = null;
  defaultAvatarUrl = environment.assets + '/default-profile-pic.png';
  defaultGroupPicUrl = environment.assets + '/group-icon.webp';

  constructor(private http: HttpClient) {
    this.loadCredentials();
  }

  public loadCredentials(): void {
    const stored = localStorage.getItem('rocketChatCredentials');
    if (stored) {
      try {
        this.credentials = JSON.parse(stored);
        this.credentialsSubject.next(this.credentials);
        this.connectionSubject.next(true);
        this.connectWebSocket();
      } catch (error) {
        console.error('Error loading Rocket.Chat credentials:', error);
        this.clearCredentials();
      }
    }
  }

  startTyping(roomId: string): void {
    if (!this.loggedInUser) return;
    console.log('Start typing');

    const username = this.loggedInUser.username || this.loggedInUser.name;
    if (!username) return;

    this.sendTypingNotification(roomId, username, true);

    // Clear existing timeout
    if (this.typingTimeout.has(this.loggedInUser._id)) {
      clearTimeout(this.typingTimeout.get(this.loggedInUser._id));
    }

    // Set timeout to stop typing after 3 seconds
    const timeout = setTimeout(() => {
      console.log('Stop typing timeout');
      this.stopTyping(roomId);
    }, 3000);

    this.typingTimeout.set(this.loggedInUser._id, timeout);
  }

  /**
   * Notify room that user stopped typing
   */
  stopTyping(roomId: string): void {
    if (!this.loggedInUser) return;
    console.log('Stop typing');

    const username = this.loggedInUser.username || this.loggedInUser.name;
    if (!username) return;

    this.sendTypingNotification(roomId, username, false);

    // Clear timeout
    if (this.typingTimeout.has(this.loggedInUser._id)) {
      clearTimeout(this.typingTimeout.get(this.loggedInUser._id));
      this.typingTimeout.delete(this.loggedInUser._id);
    }
  }

  private sendTypingNotification(
    roomId: string,
    username: string,
    isTyping: boolean
  ): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;

    // Use the simpler /typing method as per documentation
    // const message = {
    //   msg: 'method',
    //   method: 'stream-notify-room',
    //   id: this.generateMessageId(),
    //   params: [`${roomId}/typing`, username, ["user-typing"], {}],
    // };
    const message = {
      msg: 'method',
      method: 'stream-notify-room',
      id: this.generateMessageId(),
      params: [`${roomId}/typing`, username, isTyping],
    };

    console.log('📨 Sending typing notification:', message);
    this.sendWebSocketMessage(message);
  }

  subscribeToTypingEvents(roomId: string): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.error('❌ WebSocket not connected for typing subscription');
      // Try to reconnect and subscribe
      setTimeout(() => {
        this.subscribeToTypingEvents(roomId);
      }, 1000);
      return;
    }

    // Unsubscribe first if already subscribed
    this.unsubscribeFromTypingEvents(roomId);

    const subscriptionId = this.generateSubscriptionId();
    // const subscriptionId =  Math.random().toString(36).substring(2, 6);

    // const message = {
    //   msg: 'sub',
    //   id: subscriptionId,
    //   name: 'stream-notify-room',
    //   params: [`${roomId}/typing`, false],
    // };
    const message = {
      msg: 'sub',
      id: subscriptionId,
      name: 'stream-notify-room',
      params: [`${roomId}/typing`, false],
    };

    console.log('📨 Subscribing to typing events:', message);
    // TODO: This is the root of the error, message has incorrect format
    this.sendWebSocketMessage(message);
    this.activeSubscriptions.set(`typing-${roomId}`, subscriptionId);
    console.log('✅ Typing subscription created for room:', roomId);
  }

  unsubscribeFromTypingEvents(roomId: string): void {
    const subscriptionId = this.activeSubscriptions.get(`typing-${roomId}`);
    if (subscriptionId) {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.sendWebSocketMessage({
          msg: 'unsub',
          id: subscriptionId,
        });
      }
      this.activeSubscriptions.delete(`typing-${roomId}`);
      console.log('✅ Unsubscribed from typing events for room:', roomId);
    }
  }

  private handleTypingEvent(data: any): void {
    console.log('🔧 Handling stream-notify-room event:', data);

    if (data.msg === 'changed' && data.collection === 'stream-notify-room') {
      const args = data.fields?.args;

      if (!args || !Array.isArray(args) || args.length < 3) {
        console.error('❌ Invalid stream-notify-room event format:', args);
        return;
      }

      const [roomPath, username, isTyping] = args;
      console.log('🔧 Typing event args:', { roomPath, username, isTyping });

      // Check if this is a typing event
      if (typeof roomPath === 'string' && roomPath.includes('/typing')) {
        const roomId = roomPath.replace('/typing', '');

        if (roomId && username && typeof isTyping === 'boolean') {
          console.log(
            `⌨️ Typing event: ${username} is ${
              isTyping ? 'typing' : 'not typing'
            } in ${roomId}`
          );

          this.typingSubject.next({
            roomId,
            username,
            isTyping,
          });
        }
      }
    }
  }

  private saveCredentials(credentials: RocketChatCredentials): void {
    this.credentials = credentials;
    localStorage.setItem('rocketChatCredentials', JSON.stringify(credentials));
    this.credentialsSubject.next(credentials);
    this.connectionSubject.next(true);
    this.connectWebSocket();
  }

  private clearCredentials(): void {
    this.credentials = null;
    localStorage.removeItem('rocketChatCredentials');
    this.credentialsSubject.next(null);
    this.connectionSubject.next(false);

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.activeSubscriptions.clear();
  }

  public getAuthHeaders(includeContentType = true): HttpHeaders {
    let headers = new HttpHeaders();

    if(this.credentials) {
      headers = headers.set('X-Auth-Token', this.credentials.authToken);
      headers = headers.set('X-User-Id', this.credentials.userId);
    }

    if (includeContentType) {
      headers = headers.set('Content-Type', 'application/json');
    }
    
    return headers;
  }

  private normalizeTimestamp(ts: string | { $date: string | number }): Date {
    if (typeof ts === 'string') {
      return new Date(ts);
    } else if (ts && typeof ts === 'object' && '$date' in ts) {
      const dateValue = ts.$date;
      if (typeof dateValue === 'number') {
        return new Date(dateValue);
      } else {
        return new Date(dateValue);
      }
    }
    return new Date();
  }

  async connectWebSocket(): Promise<void> {
    if (!this.credentials) {
      throw new Error('Not authenticated');
    }

    return new Promise((resolve, reject) => {
      if (this.socket) {
        this.socket.close();
      }

      const wsUrl = environment.rocketChatWebSocketUrl;
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.sendWebSocketMessage({
          msg: 'connect',
          version: '1',
          support: ['1'],
        });

        this.sendWebSocketMessage({
          msg: 'method',
          method: 'login',
          id: this.generateMessageId(),
          params: [
            {
              resume: this.credentials!.authToken,
            },
          ],
        });

        resolve();
      };

      this.socket.onmessage = (event) => {
        this.handleWebSocketMessage(JSON.parse(event.data));
      };

      this.socket.onerror = (error) => {
        console.error('Rocket.Chat WebSocket error:', error);
        reject(error);
      };

      this.socket.onclose = (event) => {
        this.connectionSubject.next(false);

        if (this.credentials) {
          setTimeout(() => {
            this.connectWebSocket();
          }, 5000);
        }
      };
    });
  }

  private sendWebSocketMessage(message: any): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.error('WebSocket not connected');
    }
  }

  async loadRoomHistoryWithRealtime(
    room: RocketChatRoom,
    limit: number = 50
  ): Promise<{
    history: RocketChatMessage[];
    realtimeStream: Observable<RocketChatMessage>;
    typingStream: Observable<{
      roomId: string;
      username: string;
      isTyping: boolean;
    }>;
  }> {
    try {
      let history: RocketChatMessage[];
      const roomId = room._id;

      if (room.t === 'p') {
        history = await firstValueFrom(
          this.getGroupMessagesHistory(roomId, limit)
        );
      } else if (room.t === 'd') {
        history = await firstValueFrom(
          this.loadDirectMessagesHistory(roomId, limit)
        );
      } else {
        history = await firstValueFrom(
          this.loadChannelMessagesHistory(roomId, limit)
        );
      }

      history.sort((a, b) => {
        const dateA = this.normalizeTimestamp(a.ts).getTime();
        const dateB = this.normalizeTimestamp(b.ts).getTime();
        return dateA - dateB;
      });

      const latestHistoryTimestamp =
        history.length > 0
          ? this.normalizeTimestamp(history[history.length - 1].ts).getTime()
          : 0;

      await this.subscribeToRoomMessages(roomId);
     this.subscribeToTypingEvents(roomId); // THIS is not working

      return {
        history,
        realtimeStream: this.getMessageStream().pipe(
          filter((message) => message.rid === roomId),
          filter((message) => {
            const messageTimestamp = this.normalizeTimestamp(
              message.ts
            ).getTime();
            return messageTimestamp > latestHistoryTimestamp;
          })
        ),
        typingStream: this.typing$.pipe(
          filter((event) => event.roomId === roomId)
        ),
        // typingStream: this.typing$,
      };
    } catch (error) {
      console.error('Error loading room history:', error);
      throw error;
    }
  }

  public uploadFile(file: File, roomId?: string, message: string = ''): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('msg', message);

    return this.http.post(`${this.CHAT_API_URI}rooms.media/${roomId}`, formData, {
      headers: this.getAuthHeaders(false),
    });
  }

  private handleWebSocketMessage(message: any): void {
    console.log('📨 WebSocket message received:', message);

    if (message.msg === 'nosub') {
      console.error('❌ Subscription rejected:', message);
      if (message.error) {
        console.error('❌ Error details:', {
          error: message.error.error,
          reason: message.error.reason,
          message: message.error.message,
        });
      }

      // Check if this is a typing subscription
      this.activeSubscriptions.forEach((value, key) => {
        if (value === message.id) {
          console.error(`❌ Typing subscription failed for: ${key}`);
          this.activeSubscriptions.delete(key);
        }
      });
    }

    // Handle method call errors with more details
    if (message.msg === 'result' && message.error) {
      console.error('❌ Method call failed:', message.id, message.error);
      if (message.error) {
        console.error('❌ Method error details:', {
          error: message.error.error,
          reason: message.error.reason,
          message: message.error.message,
        });
      }
    }

    // Handle connection established
    if (message.msg === 'connected') {
      console.log('✅ Rocket.Chat WebSocket authenticated');
      this.connectionSubject.next(true);

      this.subscribeToUserNotifications('message').catch((err) => {
        console.error('Failed to subscribe to user:message on connect:', err);
      });

      this.getRooms().subscribe({
        next: (rooms: any[]) => {
          if (Array.isArray(rooms)) {
            rooms.forEach((r: any) => {
              const roomId = r && (r._id || r.id || r.roomId);
              if (!roomId) return;
              if (!this.activeSubscriptions.has(roomId)) {
                this.subscribeToRoomMessages(roomId).catch((err) => {
                  console.error(`Failed subscribing to room ${roomId} on connect:`, err);
                });
              }
            });
          }
        },
        error: (err) => console.error('Failed to load rooms on connect:', err),
      });

      this.resubscribeToActiveRooms();
    }

    // Handle subscription ready
    if (message.msg === 'ready') {
      console.log('✅ Subscriptions ready:', message.subs);
      if (message.subs && Array.isArray(message.subs)) {
        message.subs.forEach((subId: string) => {
          console.log('📋 Active subscription ID:', subId);
          // Check if this is one of our typing subscriptions
          this.activeSubscriptions.forEach((value, key) => {
            if (value === subId) {
              console.log(
                `✅ Confirmed active subscription: ${key} = ${subId}`
              );
            }
          });
        });
      }
    }

    // Handle real-time message updates
    if (
      message.msg === 'changed' &&
      message.collection === 'stream-room-messages'
    ) {
      if (message.fields?.args?.[0]) {
        const messageData: RocketChatMessage = message.fields.args[0];
        console.log('💬 New real-time message:', messageData);
        this.messageStreamSubject.next(messageData);
      }
    }

    if (
      message.msg === 'changed' &&
      message.collection === 'stream-notify-room'
    ) {
      this.handleTypingEvent(message);
      this.roomUpdateSubject.next(message);
    }

    if (message.msg === 'changed' && message.collection === 'stream-notify-user') {
      try {
        const args = message.fields?.args;

        let payloadCandidate: any = null;
        if (Array.isArray(args)) {
          payloadCandidate = args[1] ?? args[0] ?? args;
        } else {
          payloadCandidate = args ?? message;
        }

        const looksLikeMessage = !!(
          payloadCandidate &&
          (payloadCandidate.rid || payloadCandidate.msg || payloadCandidate.message) &&
          payloadCandidate.u
        );

        if (looksLikeMessage) {
          const payload = payloadCandidate;
          this.userNotifySubject.next(message);

          try {
            this.getMessage(payload._id).subscribe((message: RocketChatMessage) => {
              const fromUserId = message.u?._id;
              const isFromCurrentUser = !!(fromUserId && this.loggedInUser && fromUserId === this.loggedInUser._id);
  
              if (!isFromCurrentUser && payload.rid !== this.currentActiveRoom) {
                this.playNotificationSound();
              }
            });
          } catch (err) {
            console.debug('Error while handling user notify payload for audio:', err);
          }
        } else {
          this.userNotifySubject.next(message);
        }
      } catch (err) {
        console.error('Error handling stream-notify-user message:', err, message);
        this.userNotifySubject.next(message);
      }
    }

    if (message.msg === 'ping') {
      this.sendWebSocketMessage({ msg: 'pong' });
    }
  }

  private resubscribeToActiveRooms(): void {
    if (!this.activeSubscriptions.has('user:message')) {
      this.subscribeToUserNotifications('message').catch((error) => {
        console.error('Failed to subscribe to user:message notifications:', error);
      });
    }

    if (this.activeSubscriptions.size > 0) {
      this.activeSubscriptions.forEach((subscriptionId, key) => {
        try {
          if (!key.startsWith('typing-')) {
            const roomId = key;
            this.subscribeToRoomMessages(roomId).catch((error) => {
              console.error(`Failed to resubscribe to room ${roomId}:`, error);
            });
          }
          else if (typeof key === 'string' && key.startsWith('user:')) {
            const event = key.slice(5);
            this.subscribeToUserNotifications(event).catch((error) => {
              console.error(`Failed to resubscribe to user event ${event}:`, error);
            });
          } else {
            this.subscribeToRoomMessages(key).catch((error) => {
              console.error(`Failed to resubscribe to room ${key}:`, error);
            });
          }
        } catch (err) {
          console.error('Error while resubscribing active subscriptions:', err);
        }
      });

      this.activeSubscriptions.forEach((subscriptionId, key) => {
        if (key.startsWith('typing-')) {
          const roomId = key.replace('typing-', '');
          setTimeout(() => {
            this.subscribeToTypingEvents(roomId);
          }, 500); // Small delay to ensure room subscription is established first
        }
      });
    }
  }

  async subscribeToRoomMessages(roomId: string): Promise<void> {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      await this.connectWebSocket();
    }

    const subscriptionId = this.generateSubscriptionId();

    this.sendWebSocketMessage({
      msg: 'sub',
      id: subscriptionId,
      name: 'stream-room-messages',
      params: [roomId, false],
    });

    this.activeSubscriptions.set(roomId, subscriptionId);
  }

  async subscribeToUserNotifications(event: string): Promise<void> {
    if (!this.credentials) {
      throw new Error('Not authenticated');
    }

    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      await this.connectWebSocket();
    }

    const subscriptionId = this.generateSubscriptionId();
    const param = `${this.credentials.userId}/${event}`;

    this.sendWebSocketMessage({
      msg: 'sub',
      id: subscriptionId,
      name: 'stream-notify-user',
      params: [param, false],
    });

    this.activeSubscriptions.set(`user:${event}`, subscriptionId);
  }

  unsubscribeUserNotifications(event: string): void {
    const key = `user:${event}`;
    const subscriptionId = this.activeSubscriptions.get(key);
    if (subscriptionId && this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.sendWebSocketMessage({ msg: 'unsub', id: subscriptionId });
      this.activeSubscriptions.delete(key);
    }
  }

  getUserNotifyStream(): Observable<any> {
    return this.userNotifySubject.asObservable();
  }

  private publishUnreadMap() {
    this.unreadMapSubject.next({ ...this.unreadMap });
  }

  getUnreadMapStream(): Observable<Record<string, number>> {
    return this.unreadMapSubject.asObservable();
  }

  getActiveJitsiStream(): Observable<any | null> {
    return this.activeJitsiSubject.asObservable();
  }

  openJitsiMeeting(meetingData: any) {
    this.activeJitsiSubject.next(meetingData || null);
  }

  closeJitsiMeeting() {
    this.activeJitsiSubject.next(null);
  }

  getUnreadForRoom(roomId: string): number {
    return this.unreadMap[roomId] || 0;
  }

  setUnreadForRoom(roomId: string, count: number): void {
    if (!roomId) return;
    this.unreadMap[roomId] = count || 0;
    this.publishUnreadMap();
  }

  incrementUnreadForRoom(roomId: string, by: number = 1): void {
    if (!roomId) return;
    this.unreadMap[roomId] = (this.unreadMap[roomId] || 0) + by;
    this.publishUnreadMap();
  }

  updateUnreadFromSubscriptions(subs: any[] | any): void {
    try {
      const arr = Array.isArray(subs) ? subs : [subs];
      arr.forEach((s: any, idx: number) => {
        const key = s?.rid || s?._id || `sub-${idx}`;
        if (this.currentActiveRoom && key === this.currentActiveRoom) {
          return;
        }
        if ('unread' in s) {
          this.unreadMap[key] = s.unread || 0;
        }
      });
      this.publishUnreadMap();
    } catch (err) {
      console.error('Failed to update unread map from subscriptions:', err, subs);
    }
  }

  setActiveRoom(roomId: string | null): void {
    this.currentActiveRoom = roomId;
    this.activeRoomSubject.next(roomId);
  }

  getActiveRoomStream(): Observable<string | null> {
    return this.activeRoomSubject.asObservable();
  }

  unsubscribeFromRoomMessages(roomId: string): void {
    const subscriptionId = this.activeSubscriptions.get(roomId);
    if (
      subscriptionId &&
      this.socket &&
      this.socket.readyState === WebSocket.OPEN
    ) {
      this.sendWebSocketMessage({
        msg: 'unsub',
        id: subscriptionId,
      });
      this.activeSubscriptions.delete(roomId);
    }
  }

  sendMessageWithConfirmation(
    roomId: string,
    message: string
  ): Observable<{
    success: boolean;
    message?: RocketChatMessage;
    error?: string;
  }> {
    return new Observable((observer) => {
      if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
        observer.next({ success: false, error: 'WebSocket not connected' });
        observer.complete();
        return;
      }

      const tempMessageId = this.generateMessageId();
      let confirmationTimeout: any;

      const handleConfirmation = (event: MessageEvent) => {
        const wsMessage = JSON.parse(event.data);

        if (wsMessage.msg === 'result' && wsMessage.id === tempMessageId) {
          this.socket?.removeEventListener('message', handleConfirmation);
          clearTimeout(confirmationTimeout);

          if (wsMessage.error) {
            console.error('❌ Server returned error:', wsMessage.error);
            observer.next({ success: false, error: wsMessage.error.message });
          } else {
            console.log('✅ Server returned success:', wsMessage.result);
            observer.next({ success: true, message: wsMessage.result });
          }
          observer.complete();
        }
      };

      this.socket.addEventListener('message', handleConfirmation);
      const messageId = this.generateProperMessageId();

      // Create the message object with proper timestamp format
      const messageData = {
        _id: messageId,
        rid: roomId,
        msg: message,
        // Remove the ts field entirely - let Rocket.Chat set it automatically
        ts: Date.now(), // Don't include timestamp, let server set it
      };

      console.log(
        '📨 Sending WebSocket message with exact structure:',
        JSON.stringify(messageData, null, 2)
      );

      const websocketMessage = {
        msg: 'method',
        method: 'sendMessage',
        id: tempMessageId,
        params: [messageData],
        ts: Date.now(),
      };

      console.log(
        '📨 Full WebSocket request:',
        JSON.stringify(websocketMessage, null, 2)
      );

      this.sendWebSocketMessage(websocketMessage);

      confirmationTimeout = setTimeout(() => {
        this.socket?.removeEventListener('message', handleConfirmation);
        observer.next({
          success: false,
          error: 'Message confirmation timeout',
        });
        observer.complete();
      }, 10000);
    });
  }

  private generateProperMessageId(): string {
    // Rocket.Chat uses specific ID format, let's match it
    const chars =
      '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let result = '';
    for (let i = 0; i < 17; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  getRoomsWithLastMessage(): Observable<RocketChatRoom[]> {
    return this.getRooms().pipe(
      switchMap((rooms) => {
        const enhancedRooms: RocketChatRoom[] = rooms.map(
          (room: RocketChatRoom) =>
            this.getRoomLastMessage(room._id).pipe(
              map((lastMessage) => ({
                ...room,
                lastMessage: lastMessage?.msg || 'No messages yet',
                lastMessageTs: lastMessage?.ts || room.ts,
              })),
              catchError(() =>
                of({
                  ...room,
                  lastMessage: 'No messages yet',
                  lastMessageTs: room.ts,
                })
              )
            )
        );
        return forkJoin(enhancedRooms);
      })
    );
  }

  private getRoomLastMessage(
    roomId: string
  ): Observable<RocketChatMessage | null> {
    return this.loadChannelMessagesHistory(roomId, 1).pipe(
      map((messages) => (messages.length > 0 ? messages[0] : null)),
      catchError(() => of(null))
    );
  }

  private setupConnectionMonitoring(): void {
    this.connectionSubject.subscribe((isConnected) => {
      if (isConnected) {
        this.resubscribeToActiveRooms();
      }
    });

    setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.sendWebSocketMessage({ msg: 'ping' });
      }
    }, 30000);
  }

  playNotificationSound() {
    const audio = new Audio(`${environment.mp3}/notification.mp3`);
    audio.play();
  }

  private generateMessageId(): string {
    return `${Date.now()}${++this.messageId}`;
  }

  private generateSubscriptionId(): string {
    return `sub-${++this.subscriptionId}`;
  }

  loadChannelMessagesHistory(
    roomId: string,
    limit: number = 50
  ): Observable<any> {
    return this.http
      .get<any>(
        `${this.CHAT_API_URI}channels.history?roomId=${roomId}&count=${limit}&unreads=true`,
        { headers: this.getAuthHeaders() }
      )
      .pipe(map((res: any) => res.messages as RocketChatMessage[]));
  }

  getGroupMessagesHistory(roomId: string, limit: number = 50): Observable<any> {
    return this.http
      .get<any>(
        `${this.CHAT_API_URI}groups.history?roomId=${roomId}&count=${limit}&unreads=true`,
        { headers: this.getAuthHeaders() }
      )
      .pipe(map((res: any) => res.messages as RocketChatMessage[]));
  }

  loadDirectMessagesHistory(
    roomId: string,
    limit: number = 50
  ): Observable<RocketChatMessage[]> {
    return this.http
      .get<any>(
        `${this.CHAT_API_URI}dm.history?roomId=${roomId}&count=${limit}&unreads=true`,
        { headers: this.getAuthHeaders() }
      )
      .pipe(map((res: any) => res.messages as RocketChatMessage[]));
  }

  async login(email: string, password: string): Promise<RocketChatCredentials> {
    try {
      const loginResponse: any = await this.http
        .post(`${this.CHAT_API_URI}login`, { user: email, password })
        .toPromise();

      if (loginResponse.status === 'success' && loginResponse.data) {
        const credentials = {
          authToken: loginResponse.data.authToken,
          userId: loginResponse.data.userId,
        };

        this.saveCredentials(credentials);
        this.saveUserData();
        return credentials;
      } else {
        throw new Error('Login failed: Invalid response');
      }
    } catch (error: any) {
      this.clearCredentials();
      throw new Error(error.error?.error || 'Login failed');
    }
  }

  async loginWithCredentials(
    credentials: RocketChatCredentials
  ): Promise<void> {
    try {
      const headers = new HttpHeaders({
        'X-Auth-Token': credentials.authToken,
        'X-User-Id': credentials.userId,
        'Content-Type': 'application/json',
      });

      const testResponse: any = await this.http
        .get(`${this.CHAT_API_URI}me`, { headers })
        .toPromise();

      if (testResponse.success) {
        this.saveCredentials(credentials);
        this.saveUserData();
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      console.error('Login with credentials failed:', error);
      this.clearCredentials();
      throw error;
    }
  }

  saveUserData() {
    this.getCurrentUser().subscribe((user: RocketChatUser) => {
      this.loggedInUser = user;
    });
  }

  getCurrentUser(): Observable<RocketChatUser> {
    return this.http.get<RocketChatUser>(`${this.CHAT_API_URI}me`, {
      headers: this.getAuthHeaders(),
    });
  }
  
  getUsers(): Observable<RocketChatUser[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<RocketChatUser[]>(`${this.CHAT_API_URI}users.list`, { headers }).pipe(
      map((res: any) => res.users as RocketChatUser[])
    );
  }

  getUserInfo(username: string): Observable<RocketChatUser> {
    return this.http.get<RocketChatUserResponse>(
      `${this.CHAT_API_URI}users.info?username=${username}&fields={"emails":1,"name":1,"username":1,"utcOffset":1,"createdAt":1,"lastLogin":1}`,
      { headers: this.getAuthHeaders() }
    ).pipe(map(res => res.user));
  }

  getRooms(): Observable<any> {
    return this.http
      .get<any>(`${this.CHAT_API_URI}rooms.get`, {
        headers: this.getAuthHeaders(),
      })
      .pipe(map((res: any) => res.update as RocketChatRoom[]));
  }

  getRoomMembers(
    roomId: string,
    type: 'c' | 'p'
  ): Observable<RocketChatUser[]> {
    const endpoint =
      type === 'c'
        ? `channels.members?roomId=${roomId}`
        : `groups.members?roomId=${roomId}`;

    return this.http.get<{ members: RocketChatUser[] }>(
      `${this.CHAT_API_URI}${endpoint}`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(res => res.members)
    );
  }

  getTeams(): Observable<RocketChatTeam[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(`${this.CHAT_API_URI}teams.list`, { headers }).pipe(
      map(res => res.teams as RocketChatTeam[])
    );
  }

  getTeamMembers(teamId: string): Observable<RocketChatUser[]> {
    const headers = this.getAuthHeaders();

    return this.http.get<{ members: any[] }>(
      `${this.CHAT_API_URI}teams.members?teamId=${teamId}`,
      { headers }
    ).pipe(
      map(res =>
        res.members
          .map(m => m.user)
          .filter(u => !!u)
      )
    );
  }

  createRoom(name: string, type: 'c' | 'p',  members?: string[],  teamId?: string): Observable<RocketChatRoom> {
    const headers = this.getAuthHeaders();
    const safeName = String(name || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9_\-]/g, '')
      .replace(/^-+|-+$/g, '');

    if (!safeName) {
      return of(null as any);
    }
    const endpoint = type === 'c' ? 'channels.create' : 'groups.create';
    const body: any = { name: safeName };

    return this.http.post<any>(`${this.CHAT_API_URI}${endpoint}`, body, { headers }).pipe(
      switchMap(res => {
        const room: RocketChatRoom =
          (res?.channel || res?.group) as RocketChatRoom;
        if (!room || !room._id) {
          return throwError(() => new Error('Room creation failed'));
        }
        const roomId = room._id;
        if (!members?.length) {
          return of(room);
        }
        const inviteEndpoint =
          type === 'c' ? 'channels.invite' : 'groups.invite';
        return forkJoin(
          members.map(userId =>
            this.http.post(
              `${this.CHAT_API_URI}${inviteEndpoint}`,
              { roomId, userId },
              { headers }
            )
          )
        ).pipe(map(() => room));
      }),
      switchMap((room: RocketChatRoom) => {
        if (!teamId) return of(room);

        return this.http.post(
          `${this.CHAT_API_URI}teams.addRooms`,
          {
            teamId: teamId,
            rooms: [room._id]
          },
          { headers }
        ).pipe(
          map(() => room)
        );
      }),
      catchError(err => {
        console.error('Error creating or attaching channel:', err);
        return throwError(() => err);
      })
    );
  }

  createTeam(name: string, owner: string, members?: string[]): Observable<RocketChatTeam> {
    const headers = this.getAuthHeaders();
    const body: any = { name, type: 1, owner };
    if (members?.length) body.members = members;

    return this.http.post<any>(`${this.CHAT_API_URI}teams.create`, body, { headers }).pipe(
      map(res => res.team as RocketChatTeam)
    );
  }

  sendMessage(roomId: string, message: string, attachments?: RocketChatMessageAttachment[]): Observable<any> {
    return this.http.post(
      `${this.CHAT_API_URI}chat.postMessage`,
      {
        channel: roomId,
        text: message,
        ...(attachments && { attachments })
      },
      { headers: this.getAuthHeaders() }
    );
  }

  async createDirectMessage(username: string): Promise<RocketChatRoom> {
    const response: any = await this.http
      .post(
        `${this.CHAT_API_URI}dm.create`,
        { username },
        { headers: this.getAuthHeaders() }
      )
      .toPromise();

    if (response.success) {
      return response.room;
    } else {
      throw new Error(response.error || 'Failed to create direct message');
    }
  }

  async getDirectMessages(): Promise<RocketChatRoom[]> {
    const response: any = await this.http
      .get(`${this.CHAT_API_URI}dm.list`, {
        headers: this.getAuthHeaders(),
      })
      .toPromise();

    if (response.success) {
      return response.ims || [];
    } else {
      throw new Error(response.error || 'Failed to get direct messages');
    }
  }

  async getChannels(): Promise<RocketChatRoom[]> {
    const response: any = await this.http
      .get(`${this.CHAT_API_URI}channels.list`, {
        headers: this.getAuthHeaders(),
      })
      .toPromise();

    if (response.success) {
      return response.channels || [];
    } else {
      throw new Error(response.error || 'Failed to get channels');
    }
  }

  async joinChannel(roomId: string): Promise<void> {
    const response: any = await this.http
      .post(
        `${this.CHAT_API_URI}channels.join`,
        { roomId },
        { headers: this.getAuthHeaders() }
      )
      .toPromise();

    if (!response.success) {
      throw new Error(response.error || 'Failed to join channel');
    }
  }

  async leaveChannel(roomId: string): Promise<void> {
    const response: any = await this.http
      .post(
        `${this.CHAT_API_URI}channels.leave`,
        { roomId },
        { headers: this.getAuthHeaders() }
      )
      .toPromise();

    if (!response.success) {
      throw new Error(response.error || 'Failed to leave channel');
    }
  }

  async logout(): Promise<void> {
    if (this.credentials) {
      try {
        await this.http
          .post(
            `${this.CHAT_API_URI}logout`,
            {},
            { headers: this.getAuthHeaders() }
          )
          .toPromise();
      } catch (error) {
        console.error('Logout error:', error);
      }
    }

    this.clearCredentials();
  }

  isAuthenticated(): boolean {
    return !!this.credentials;
  }

  getCredentials(): RocketChatCredentials | null {
    return this.credentials;
  }

  getConnectionStatus(): Observable<boolean> {
    return this.connectionSubject.asObservable();
  }

  getCredentialsObservable(): Observable<RocketChatCredentials | null> {
    return this.credentialsSubject.asObservable();
  }

  getMessage(messageId: string): Observable<RocketChatMessage> {
    return this.http.get<any>(`${this.CHAT_API_URI}chat.getMessage?msgId=${messageId}`, {
      headers: this.getAuthHeaders(),
    });
  }

  getMessageStream(): Observable<RocketChatMessage> {
    return this.messageStreamSubject.asObservable();
  }

  async apiCall<T>(
    endpoint: string,
    method: string = 'GET',
    data?: any
  ): Promise<T> {
    const url = `${this.CHAT_API_URI}${endpoint}`;

    let request;
    if (method === 'GET') {
      request = this.http.get(url, { headers: this.getAuthHeaders() });
    } else if (method === 'POST') {
      request = this.http.post(url, data, { headers: this.getAuthHeaders() });
    } else if (method === 'PUT') {
      request = this.http.put(url, data, { headers: this.getAuthHeaders() });
    } else if (method === 'DELETE') {
      request = this.http.delete(url, { headers: this.getAuthHeaders() });
    } else {
      throw new Error(`Unsupported HTTP method: ${method}`);
    }

    const response: any = await request.toPromise();

    if (response.success) {
      return response;
    } else {
      throw new Error(response.error || `API call failed: ${endpoint}`);
    }
  }

  initializeJitsiMeeting(roomId: string): Observable<any> {
    return this.http.post(
      `${this.API_URI}commands`,
      {
        roomId,
        command: 'jitsi',
        user: {
          name: this.loggedInUser?.name,
          avatarUrl: this.loggedInUser?.avatarUrl,
          email:
            this.loggedInUser?.emails && this.loggedInUser?.emails.length > 0
              ? this.loggedInUser?.emails[0].address
              : '',
          _id: this.loggedInUser?._id,
        },
      },
      { headers: this.getAuthHeaders() }
    );
  }

  joinJitsiMeeting(message: any): Observable<any> {
    if (!message?.blocks && message?.blocks[0]?.callId) {
      return of(null);
    }

    return this.http.post(
      `${this.API_URI}join-meeting`,
      {
        callId: message?.blocks[0].callId,
        user: {
          name: this.loggedInUser?.name,
          avatarUrl: this.loggedInUser?.avatarUrl,
          email:
            this.loggedInUser?.emails && this.loggedInUser?.emails.length > 0
              ? this.loggedInUser?.emails[0].address
              : '',
          _id: this.loggedInUser?._id,
        },
      },
      { headers: this.getAuthHeaders() }
    );
  }

  getConversationPicture(room: RocketChatRoom): Observable<string> {
    switch (room.t) {
      case 'd': // direct message
      { 
        const username = room.usernames?.find(
          u => u !== this.loggedInUser?.username
        );
        if (!username) {
          return of(this.defaultAvatarUrl);
        }
        return of(`${environment.rocketChatUrl}/avatar/${username}`);
      }

      case 'p': // private chat
      case 'c': // channel
        if (!room._id) {
          return of(this.defaultGroupPicUrl);
        }
        return of(`${environment.rocketChatUrl}/avatar/room/${room._id}`);

      case 'l': // livechat
        return of(this.defaultAvatarUrl);

      default:
        return of(this.defaultAvatarUrl);
    }
  }

  getUserAvatar(userId: string): Observable<any> {
    return this.http.get(`${this.CHAT_API_URI}users.getAvatar`, {
      params: { userId },
    });
  }

  getUserAvatarUrl(username: string): string {
    return `${environment.rocketChatUrl}/avatar/${username}`;
  }

  getAllSubscriptions(): Observable<any> {
    return this.http.get(`${this.CHAT_API_URI}subscriptions.get`, {
      headers: this.getAuthHeaders(),
    });
  }

  markChannelAsRead(roomId: string): Observable<any> {
    return this.http.post(`${this.CHAT_API_URI}subscriptions.read`, { roomId }, {
      headers: this.getAuthHeaders(),
    });
  }
}
