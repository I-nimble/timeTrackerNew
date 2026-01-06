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
import { WebSocketService } from './socket/web-socket.service';
import {
  RocketChatCredentials,
  RocketChatUser,
  RocketChatRoom,
  RocketChatMessage,
  RocketChatTeam,
  RocketChatUserResponse,
  RocketChatMessageResponse,
  RocketChatApiResponse,
  RocketChatMessageAttachment
} from '../models/rocketChat.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PlatformPermissionsService } from './permissions.service';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Router } from '@angular/router';

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

  private serverUpdatedSubject = new Subject<any>();


  private credentials: RocketChatCredentials | null = null;
  private activeSubscriptions = new Map<string, string>();
  private messageId = 0;
  private subscriptionId = 0;

  private wsMethodHandlers = new Map<string, { resolve: (v: any) => void; reject: (err: any) => void; timeout?: any; method?: string; params?: any[] }>();

  private typingUsers = new Map<string, Set<string>>();
  private typingTimeout = new Map<string, ReturnType<typeof setTimeout>>();
  private typingSubject = new Subject<{
    roomId: string;
    username: string;
    isTyping: boolean;
  }>();
  public typing$ = this.typingSubject.asObservable();
  private notificationAudio: HTMLAudioElement | null = null;
  private callAudio: HTMLAudioElement | null = null;

  loggedInUser: RocketChatUser | null = null;
  defaultAvatarUrl = environment.assets + '/default-profile-pic.png';
  defaultGroupPicUrl = environment.assets + '/group-icon.webp';

  isChatAvailable: boolean = false;
  callsAvailable: boolean = false;
  private connectionInProgress = false;
  private loginResolver: { resolve: () => void; reject: (err: any) => void } | null = null;

  constructor(private http: HttpClient, private webSocketService: WebSocketService, private snackBar: MatSnackBar, private platformPermissionsService: PlatformPermissionsService, private router: Router) {
    this.loadCredentials();
    this.initNotificationSounds();

    try {
      this.webSocketService.getTypingStream().subscribe((evt) => {
        try {
          if (!evt || !evt.roomId) return;

          if (this.loggedInUser && evt.username === this.loggedInUser.username) return;

          this.typingSubject.next({
            roomId: evt.roomId,
            username: evt.username,
            isTyping: !!evt.isTyping,
          });
        } catch (err) {
          console.error('Error forwarding external typing event into RocketChatService', err, evt);
        }
      });
    } catch (err) {
      console.error('Failed to subscribe to WebSocketService typing stream', err);
    }
  }

  private notificationsInitialized = false;

  public async initLocalNotifications() {
    if (Capacitor.isNativePlatform()) {
      try {
        await LocalNotifications.createChannel({
          id: 'inimble_general',
          name: 'Inimble Notifications',
          description: 'General notifications for messages and updates',
          importance: 5,
          visibility: 1,
          vibration: true,
        });

        if (!this.notificationsInitialized) {
          LocalNotifications.addListener('localNotificationActionPerformed', (event: any) => {
            const extra = event.notification.extra;
            if (extra?.roomId) {
              this.router.navigate(['/apps/chat']);
            }
          });
          this.notificationsInitialized = true;
        }
      } catch (err) {
        console.error('Failed to init local notifications:', err);
      }
    }
  }

  private initNotificationSounds() {
    try {
      if (!this.notificationAudio) {
        this.notificationAudio = new Audio(`${environment.mp3}/message.mp3`);
        this.notificationAudio.preload = 'auto';
        this.notificationAudio.load();
        this.notificationAudio.muted = false;
        this.notificationAudio.volume = 1.0;
      }

      if (!this.callAudio) {
        this.callAudio = new Audio(`${environment.mp3}/ringtone.mp3`);
        this.callAudio.preload = 'auto';
        this.callAudio.load();
        this.callAudio.muted = false;
        this.callAudio.volume = 1.0;
      }
      try {
        if (this.notificationAudio) {
          const na = this.notificationAudio;
          const p: any = na.play();
          if (p && typeof p.then === 'function') {
            p.then(() => { try { na.pause(); na.currentTime = 0; } catch (e) {} }).catch(() => {});
          }
        }
        if (this.callAudio) {
          const ca = this.callAudio;
          const p2: any = ca.play();
          if (p2 && typeof p2.then === 'function') {
            p2.then(() => { try { ca.pause(); ca.currentTime = 0; } catch (e) {} }).catch(() => {});
          }
        }
      } catch (e) {
      }
    } catch (err) {
      console.error('Failed to init notification sounds:', err);
    }
  }

   async initializeRocketChat(chatCredentials?: any): Promise<void> {
    try {
      await this.loginWithCredentials(chatCredentials);
      this.isChatAvailable = true;

      const permissionGranted = await this.requestMediaPermissions();
      this.callsAvailable = permissionGranted;
    } catch (error) {
      console.error("Initialization failed with error:", error);
    }
  }

  private async requestMediaPermissions(): Promise<boolean> {
    try {
      const granted = await this.platformPermissionsService.requestMediaPermissions(true);
      
      if (!granted) {
        this.openSnackBar('Camera/microphone permissions are required for video calls.', 'Close');
        return false;
      }
      return true;
    } catch (error) {
      console.error("Media permission error:", error);
      return false;
    }
  }

  openSnackBar(message: string, action: string): void {
    this.snackBar.open(message, action, {
      duration: 2000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }

  public loadCredentials(): void {
    const stored = localStorage.getItem('rocketChatCredentials');
    if (stored) {
      try {
        this.credentials = JSON.parse(stored);
        this.initializeRocketChat(this.credentials);
        this.credentialsSubject.next(this.credentials);
        this.connectionSubject.next(true);
      } catch (error) {
        console.error('Error loading Rocket.Chat credentials:', error);
        this.clearCredentials();
      }
    }
  }

  startTyping(roomId: string): void {
    if (!this.loggedInUser) return;

    const username = this.loggedInUser.username || this.loggedInUser.name;
    if (!username) return;

    try {
      this.webSocketService.emitTyping(roomId, username, true);
    } catch (err) {
      console.error('Failed to emit typing via WebSocketService', err);
    }

    if (this.typingTimeout.has(this.loggedInUser._id)) {
      const existingTimeout = this.typingTimeout.get(this.loggedInUser._id);
      if (existingTimeout !== undefined) {
        clearTimeout(existingTimeout as ReturnType<typeof setTimeout>);
      }
    }

    const timeout = setTimeout(() => {
      this.stopTyping(roomId);
    }, 3000);

    this.typingTimeout.set(this.loggedInUser._id, timeout);
  }

  stopTyping(roomId: string): void {
    if (!this.loggedInUser) return;

    const username = this.loggedInUser.username || this.loggedInUser.name;
    if (!username) return;

    try {
      this.webSocketService.emitTyping(roomId, username, false);
    } catch (err) {
      console.error('Failed to emit stop-typing via WebSocketService', err);
    }

    if (this.typingTimeout.has(this.loggedInUser._id)) {
      const existingTimeout = this.typingTimeout.get(this.loggedInUser._id);
      if (existingTimeout !== undefined) {
        clearTimeout(existingTimeout as ReturnType<typeof setTimeout>);
      }
      this.typingTimeout.delete(this.loggedInUser._id);
    }
  }

  subscribeToTypingEvents(roomId: string): void {
    try {
      this.unsubscribeFromTypingEvents(roomId);

      this.activeSubscriptions.set(`typing-${roomId}`, `fallback-${roomId}`);
    } catch (err) {
      console.error('Error while registering fallback typing subscription:', err);
    }
  }

  unsubscribeFromTypingEvents(roomId: string): void {
    const subscriptionKey = `typing-${roomId}`;
    const subscriptionId = this.activeSubscriptions.get(subscriptionKey);
    if (!subscriptionId) return;

    this.activeSubscriptions.delete(subscriptionKey);
  }

  private saveCredentials(credentials: RocketChatCredentials): void {
    this.credentials = credentials;
    localStorage.setItem('rocketChatCredentials', JSON.stringify(credentials));
    this.credentialsSubject.next(credentials);
    this.connectionSubject.next(true);

    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      this.connectWebSocket().catch(error => {
        console.error('Failed to connect WebSocket:', error);
      });
    }
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

    if (this.connectionInProgress) {
      // console.log('WebSocket connection already in progress, skipping...');
      return;
    }

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      // console.log('WebSocket already connected, skipping...');
      return;
    }

    this.connectionInProgress = true;

    return new Promise((resolve, reject) => {
      try {
        if (this.socket && this.socket.readyState !== WebSocket.CLOSED) {
            this.socket.close(1000, 'Reconnecting');
        }

        const wsUrl = environment.rocketChatWebSocketUrl;
        this.socket = new WebSocket(wsUrl);

        let connectionTimeout: NodeJS.Timeout;

        this.socket.onopen = () => {
            clearTimeout(connectionTimeout);
            
            this.sendWebSocketMessage({
                msg: 'connect',
                version: '1',
                support: ['1'],
            });

            const loginMsgId = this.generateMessageId();
            this.sendWebSocketMessage({
                msg: 'method',
                method: 'login',
                id: loginMsgId,
                params: [
                    {
                        resume: this.credentials!.authToken,
                    },
                ],
            });

            this.loginResolver = { resolve, reject };
        };

        this.socket.onmessage = (event) => {
            this.handleWebSocketMessage(JSON.parse(event.data));
        };

        this.socket.onerror = (errorEvent: Event) => {
            console.error('WebSocket error details:', errorEvent);
            clearTimeout(connectionTimeout);
            this.connectionInProgress = false;
            
            reject(new Error(
                (errorEvent instanceof ErrorEvent && errorEvent.message)
                    ? errorEvent.message
                    : 'WebSocket connection failed'
            ));
        };

        this.socket.onclose = (event) => {            
            clearTimeout(connectionTimeout);
            this.connectionInProgress = false;
            this.connectionSubject.next(false);

            if (this.credentials && event.code !== 1000) {
              setTimeout(() => {
                this.connectWebSocket().catch(err => {
                  console.error('Reconnection failed:', err);
                });
              }, 5000);
            }
        };

        connectionTimeout = setTimeout(() => {
            if (this.socket && this.socket.readyState !== WebSocket.OPEN) {
                console.error('WebSocket connection timeout');
                this.socket.close();
                this.connectionInProgress = false;
                reject(new Error('WebSocket connection timeout'));
            }
        }, 10000);

    } catch (error) {
        this.connectionInProgress = false;
        reject(error);
    }
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
     this.subscribeToTypingEvents(roomId);

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

    if (message && message.msg === 'result' && this.loginResolver) {
      if (message.error) {
        console.error('WebSocket login failed:', message.error);
        this.connectionInProgress = false;
        this.loginResolver.reject(message.error);
        this.loginResolver = null;
      } else if (message.result && message.result.id) {
        this.connectionInProgress = false;
        this.loginResolver.resolve();
        this.loginResolver = null;
      }
    }
    
    try {
      if (message && message.msg === 'result') {
        const id = message.id;
        if (id && this.wsMethodHandlers.has(id)) {
          const handler = this.wsMethodHandlers.get(id)!;
          try { if (handler.timeout) clearTimeout(handler.timeout); } catch (e) {}
          this.wsMethodHandlers.delete(id);
          if (message.error) {
            handler.reject(message.error);
          } else {
            handler.resolve(message.result);
          }

          try {
            const methodName = handler.method;
            const handlerParams = handler.params;
            if (methodName === 'pinMessage' || methodName === 'unpinMessage') {
              const paramMsg = handlerParams && handlerParams[0];
              if (paramMsg && paramMsg._id) {
                const update: any = { _id: paramMsg._id, rid: paramMsg.rid, pinned: methodName === 'pinMessage' };
                this.messageStreamSubject.next(update as any);
              }
            }
          } catch (e) {
            console.error('Error emitting pin/unpin message update:', e);
          }

          return;
        }
      }
    } catch (e) {
      console.error('Error routing websocket method response:', e, message);
    }


    if (message.msg === 'nosub') {
      const err = message.error;
      if (err && err.error === 'not-allowed') {
        console.warn('⚠️ Subscription rejected (not-allowed):', message);
      } else {
        console.error('❌ Subscription rejected:', message);
      }

      if (err) {
        if (err.error === 'not-allowed') {
          console.warn('❌ Error details:', { error: err.error, message: err.message });
        } else {
          console.error('❌ Error details:', {
            error: err.error,
            reason: err.reason,
            message: err.message,
          });
        }
      }

      let found = false;
      this.activeSubscriptions.forEach((value, key) => {
        if (value === message.id) {
          found = true;
          try {
            if (err && err.error === 'not-allowed' && (key.startsWith('typing-') || key.startsWith('user:'))) {
              console.warn(`⚠️ Subscription not allowed for ${key}. Removing local subscription and relying on fallback if available.`);
              this.activeSubscriptions.delete(key);
            } else {
              console.error(`❌ Subscription failed for: ${key}`);
              this.activeSubscriptions.delete(key);
            }
          } catch (e) {
            console.error('Error handling nosub for subscription key:', key, e);
            this.activeSubscriptions.delete(key);
          }
        }
      });

      if (!found && err && err.error === 'not-allowed') {
        console.warn('⚠️ Received not-allowed nosub for unknown subscription id:', message.id);
      }
    }

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

    if (message.msg === 'connected') {
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

    if (
      message.msg === 'changed' &&
      message.collection === 'stream-room-messages'
    ) {
      if (message.fields?.args?.[0]) {
        const messageData: RocketChatMessage = message.fields.args[0];
        this.messageStreamSubject.next(messageData);
        try {
          const fromUserId = messageData.u?._id;
          const isFromCurrentUser = !!(
            fromUserId && this.loggedInUser && fromUserId === this.loggedInUser._id
          );
          if (!isFromCurrentUser && messageData.rid !== this.currentActiveRoom) {
            const icon = messageData.u?.username ? this.getUserAvatarUrl(messageData.u.username) : undefined;
            const text = (messageData.msg && String(messageData.msg).slice(0, 200)) || '';

            const isCallMessage =
              messageData.t === 'videoconf' ||
              (typeof text === 'string' && /jitsi|call/i.test(text)) ||
              (!!messageData.attachments && messageData.attachments.some((a: any) => (a.title || '').toLowerCase().includes('call')));

            if (!isCallMessage) {
              try { this.incrementUnreadForRoom(messageData.rid); } catch (e) {}
            }
          }
        } catch (err) {
          console.error('Error showing push for room message:', err);
        }
      }
    }

    if (message.msg === 'changed' && message.collection === 'stream-notify-room') {
      const args = message.fields?.args ?? [];
      const event = args[0];

      if (event?.type === 'call' || event === 'call') {
        const callData = args[1];
        this.userNotifySubject.next({
          type: 'call-started',
          roomId: message.roomId,
          callData
        });
        try {
          const title = 'Call ongoing';
          const caller = callData?.from || callData?.callerName || '';
          const body = caller ? `${caller} is calling` : 'Call ongoing';
          this.showPushNotification(title, 'Call ongoing', undefined, { roomId: message.roomId, callData });
          try { this.playCallSound(); } catch (e) {}
        } catch (err) {
          console.error('Error showing push for call-started:', err);
        }
      }
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
              this.getRoomLastMessage(payload.rid, payload.t).subscribe({
                next: (lastMessage: any) => {
                  if (!lastMessage) return;
                  const fromUserId = lastMessage.u?._id;
                  const isFromCurrentUser = !!(fromUserId && this.loggedInUser && fromUserId === this.loggedInUser._id);
                  if (!isFromCurrentUser && payload.rid !== this.currentActiveRoom) {
                    const text = (lastMessage.msg && String(lastMessage.msg).slice(0, 200)) || '';
                    const isCallMessage = lastMessage.t === 'videoconf' || (typeof text === 'string' && /jitsi|call/i.test(text));
                    const icon = lastMessage.u?.username ? this.getUserAvatarUrl(lastMessage.u.username) : undefined;
                      if (isCallMessage) {
                        try { this.incrementUnreadForRoom(payload.rid); } catch (e) {}
                        try { this.playCallSound(); } catch (e) {}
                        try {
                          this.showPushNotification('Call ongoing', 'Call ongoing', icon, { roomId: payload.rid, messageId: lastMessage._id });
                        } catch (err) {
                          console.debug('Error showing push for call user notify message:', err);
                        }
                      } else {
                        try { this.incrementUnreadForRoom(payload.rid); } catch (e) {}
                        try { this.playNotificationSound(); } catch (e) {}
                        try {
                          const title = lastMessage.u?.name || lastMessage.u?.username || 'New message';
                          const body = text || 'New message';
                          this.showPushNotification(title, body, icon, { roomId: payload.rid, messageId: lastMessage._id });
                        } catch (err) {
                          console.debug('Error showing push for user notify message:', err);
                        }
                      }
                  }
              }});
          } catch (err) {
            console.debug('Error while handling user notify payload for audio:', err);
          }
        } 
      } catch (err) {
        console.error('Error handling stream-notify-user message:', err, message);
        this.userNotifySubject.next(message);
      }
    }

    if (message.msg === 'ping') {
      this.sendWebSocketMessage({ msg: 'pong' });
    }
    if (message.msg === 'updated' && Array.isArray(message.methods)) {
      this.serverUpdatedSubject.next(message.methods);
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
          if (typeof key === 'string' && key.startsWith('typing-')) {
            return;
          }

          if (typeof key === 'string' && key.startsWith('user:')) {
            const event = key.slice(5);
            this.subscribeToUserNotifications(event).catch((error) => {
              console.error(`Failed to resubscribe to user event ${event}:`, error);
            });
            return;
          }
    
          if (typeof key === 'string' && key.includes(':notify:')) {
            const parts = key.split(':notify:');
            const parsedRoomId = parts[0];
            const eventName = parts[1];
            if (parsedRoomId && eventName) {
              this.subscribeToRoomNotifications(parsedRoomId, eventName).catch(() => {});
              return;
            }
          }

          const roomId = key;
          this.subscribeToRoomMessages(roomId);
          try {
            this.joinTypingRoom(roomId);
          } catch (err) {
            console.error('Failed to join typing room via WebSocketService:', err);
          }
          this.subscribeToRoomMessages(roomId).catch((error) => {
            console.error(`Failed to resubscribe to room ${roomId}:`, error);
          });
        } catch (err) {
          console.error('Error while resubscribing active subscriptions:', err);
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
    
    await this.subscribeToRoomNotifications(roomId, 'deleteMessage');
  }

  async subscribeToRoomNotifications(roomId: string, eventName: string): Promise<void> {
    if (!roomId || !eventName) return;

    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      await this.connectWebSocket();
    }

    const subscriptionId = this.generateSubscriptionId();
    const param = `${roomId}/${eventName}`;

    this.sendWebSocketMessage({
      msg: 'sub',
      id: subscriptionId,
      name: 'stream-notify-room',
      params: [param, false],
    });
    
    this.activeSubscriptions.set(`${roomId}:notify:${eventName}`, subscriptionId);
  }

  public joinTypingRoom(roomId: string): void {
    try {
      if (!roomId) return;
      this.webSocketService.joinRoom(roomId);
    } catch (err) {
      console.error('Error requesting joinTypingRoom:', err, roomId);
    }
  }

  async subscribeToUserNotifications(event: string): Promise<void> {
    if (!this.credentials) {
      throw new Error('Not authenticated');
    }

    const subKey = `user:${event}`;
    if (this.activeSubscriptions.has(subKey)) {
      return;
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

    this.activeSubscriptions.set(subKey, subscriptionId);
  }

  subscribeToCallEvents(roomId: string): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected yet, cannot subscribe to calls');
      return;
    }
    const subscriptionId = this.generateSubscriptionId();
    this.sendWebSocketMessage({
      msg: 'sub',
      id: subscriptionId,
      name: 'stream-notify-room',
      params: [`${roomId}/call`, false],
    });
    this.activeSubscriptions.set(`room-call:${roomId}`, subscriptionId);
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

  getRoomUpdateStream(): Observable<any> {
    return this.roomUpdateSubject.asObservable();
  }

  getServerUpdatedStream(): Observable<any> {
    return this.serverUpdatedSubject.asObservable();
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
    
    try {
      Array.from(this.activeSubscriptions.keys()).forEach((key) => {
        if (typeof key === 'string' && key.startsWith(`${roomId}:notify:`)) {
          const subId = this.activeSubscriptions.get(key);
          if (subId && this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.sendWebSocketMessage({ msg: 'unsub', id: subId });
          }
          this.activeSubscriptions.delete(key);
        }
      });
    } catch (err) {
      console.error('Error while unsubscribing from room notifications:', err);
    }
  }

  sendMessageWithConfirmation(
    roomId: string,
    message: string,
    tmid?: string
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
            observer.next({ success: true, message: wsMessage.result });
          }
          observer.complete();
        }
      };

      this.socket.addEventListener('message', handleConfirmation);
      const messageId = this.generateProperMessageId();

      const messageData = {
        _id: messageId,
        rid: roomId,
        msg: message,
        ...(tmid && { tmid, tshow: true })
        
      };

      const websocketMessage = {
        msg: 'method',
        method: 'sendMessage',
        id: tempMessageId,
        params: [messageData],
        ts: Date.now(),
      };

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

  callWebSocketMethod(method: string, params: any[] = [], timeoutMs: number = 10000): Observable<any> {
    return new Observable((observer) => {
      (async () => {
        try {
          
          if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            try {
              await this.connectWebSocket();
            } catch (connectErr) {
              observer.error('WebSocket not connected: ' + String(connectErr));
              observer.complete();
              return;
            }
          }

          const id = this.generateMessageId();

          const timeout = setTimeout(() => {
            if (this.wsMethodHandlers.has(id)) {
              const h = this.wsMethodHandlers.get(id)!;
              this.wsMethodHandlers.delete(id);
              try { h.reject({ error: 'timeout' }); } catch (e) {}
            }
            observer.error('WebSocket method timeout');
            observer.complete();
          }, timeoutMs);

          this.wsMethodHandlers.set(id, {
            resolve: (res: any) => {
              observer.next(res);
              observer.complete();
            },
            reject: (err: any) => {
              observer.error(err);
              observer.complete();
            },
            timeout,
            method,
            params,
          });

          try {
            this.sendWebSocketMessage({ msg: 'method', method, id, params });
          } catch (err) {
            if (this.wsMethodHandlers.has(id)) {
              const h = this.wsMethodHandlers.get(id)!;
              clearTimeout(h.timeout);
              this.wsMethodHandlers.delete(id);
            }
            observer.error(err);
            observer.complete();
          }
        } catch (err) {
          observer.error(err);
          observer.complete();
        }
      })();
    });
  }

  private generateProperMessageId(): string {
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
        const enhancedRooms: any[] = rooms.map((room: RocketChatRoom) =>
          this.getRoomLastMessage(room._id, room.t).pipe(
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
    roomId: string,
    roomType?: string
  ): Observable<RocketChatMessage | null> {
    let historyObs: Observable<RocketChatMessage[]>;
    if (roomType === 'p') {
      historyObs = this.getGroupMessagesHistory(roomId, 1);
    } else if (roomType === 'd') {
      historyObs = this.loadDirectMessagesHistory(roomId, 1);
    } else {
      historyObs = this.loadChannelMessagesHistory(roomId, 1);
    }
    return historyObs.pipe(
      map((messages) => (messages.length > 0 ? messages[0] : null)),
      catchError(() => of(null))
    );
  }

  playNotificationSound() {
    try {
      if (this.notificationAudio) {
        try { this.notificationAudio.currentTime = 0; } catch (e) {}
        const p = this.notificationAudio.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      } else {
        const audio = new Audio(`${environment.mp3}/message.mp3`);
        audio.play().catch(() => {});
      }
    } catch (err) {
      console.debug('playNotificationSound error:', err);
    }
  }

  playCallSound() {
    try {
      if (this.callAudio) {
        try { this.callAudio.currentTime = 0; } catch (e) {}
        const p = this.callAudio.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      } else {
        const audio = new Audio(`${environment.mp3}/ringtone.mp3`);
        audio.play().catch(() => {});
      }
    } catch (err) {
      console.debug('playCallSound error:', err);
    }
  }

  async requestNotificationPermission(): Promise<boolean> {
    try {
      if (!('Notification' in window)) return false;
      if (Notification.permission === 'granted') return true;
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (err) {
      console.error('Notification permission error:', err);
      return false;
    }
  }

  public async showPushNotification(title: string, body: string, icon?: string, data?: any) {
    try {
      if (Capacitor.isNativePlatform()) {
        const granted = await this.platformPermissionsService.requestNotificationPermissions();
        if (!granted) {
          this.openSnackBar('Enable notifications to receive push notifications.', 'Close');
          return;
        };

        await this.initLocalNotifications();

        const notificationId = Date.now() % 2147483647;

        try {
          await LocalNotifications.schedule({
            notifications: [{
              title,
              body,
              id: notificationId,
              extra: data,
              channelId: 'inimble_general',
            }]
          });
        } catch (scheduleError) {
          console.error('Error scheduling notification', scheduleError);
        }
      } else {
        if (!('Notification' in window)) return;
        const granted = Notification.permission === 'granted' || (await this.requestNotificationPermission());
        if (!granted) {
          this.openSnackBar('Enable notifications to receive push notifications.', 'Close');
          return;
        };

        const options: any = { body };
        if (icon) options.icon = icon;
        if (data) options.data = data;

        const notif = new Notification(title, options);

        notif.onclick = (ev: any) => {
          try {
            if (window && (window as any).focus) (window as any).focus();
          } catch (e) {}
          if (typeof ev?.target?.close === 'function') ev.target.close();
        };
        setTimeout(() => {
          try {
            notif.close();
          } catch (e) {}
        }, 8000);
      }
    } catch (err) {
      console.error('Failed to show push notification:', err);
    }
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
    return this.http.get<RocketChatUser[]>(`${this.CHAT_API_URI}users.list?count=0`, { headers }).pipe(
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
        ? `channels.members?roomId=${roomId}&count=0`
        : `groups.members?roomId=${roomId}&count=0`;

    return this.http.get<{ members: RocketChatUser[] }>(
      `${this.CHAT_API_URI}${endpoint}`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(res => res.members)
    );
  }

  getTeams(): Observable<RocketChatTeam[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(`${this.CHAT_API_URI}teams.list?count=0`, { headers }).pipe(
      map(res => res.teams as RocketChatTeam[])
    );
  }

  getAllTeams(): Observable<RocketChatTeam[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(`${this.CHAT_API_URI}teams.listAll?count=0`, { headers }).pipe(
      map(res => res.teams as RocketChatTeam[])
    );
  }

  getTeamMembers(teamId: string): Observable<RocketChatUser[]> {
    const headers = this.getAuthHeaders();

    return this.http.get<{ members: any[] }>(
      `${this.CHAT_API_URI}teams.members?teamId=${teamId}&count=0`,
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
  
  leaveRoom(roomId: string): Observable<boolean> {
    const headers = this.getAuthHeaders();

    return this.http.post<any>(
      `${this.CHAT_API_URI}rooms.leave`,
      { roomId },
      { headers }
    ).pipe(
      map(res => !!res.success)
    );
  }

  deleteRoom(roomId: string): Observable<boolean> {
    const headers = this.getAuthHeaders();

    return this.http.post<any>(
      `${this.CHAT_API_URI}rooms.delete`,
      { roomId },
      { headers }
    ).pipe(
      map(res => !!res.success)
    );
  }

  sendMessage(roomId: string, message: string, attachments?: RocketChatMessageAttachment[], tmid?: string): Observable<any> {
    return this.http.post(
      `${this.CHAT_API_URI}chat.postMessage`,
      {
        channel: roomId,
        text: message,
        ...(attachments && { attachments }),
        ...(tmid && { tmid })
      },
      { headers: this.getAuthHeaders() }
    );
  }

  reactToMessage(messageId: string, emoji: string): Observable<RocketChatApiResponse> {
    const body = { messageId, emoji };
    return this.http.post<RocketChatApiResponse>(
      `${this.CHAT_API_URI}chat.react`,
      body,
      { headers: this.getAuthHeaders() }
    );
  }

  editMessage(roomId: string, msgId: string, text: string): Observable<RocketChatMessageResponse> {
    const payload = { _id: msgId, rid: roomId, msg: text };

    return this.callWebSocketMethod('updateMessage', [payload]).pipe(
      map((res: any) => res as RocketChatMessageResponse),
      catchError((err) => {
        
        const body = { roomId, msgId, text };
        return this.http.post<RocketChatMessageResponse>(`${this.CHAT_API_URI}chat.update`, body, { headers: this.getAuthHeaders() });
      })
    );
  }

  deleteMessage(msgId: string, roomId: string): Observable<RocketChatApiResponse> {
    const payload = { _id: msgId, rid: roomId };

    return this.callWebSocketMethod('deleteMessage', [payload]).pipe(
      map((res: any) => res as RocketChatApiResponse),
      catchError((err) => {
        
        const body = { msgId, roomId };
        return this.http.post<RocketChatApiResponse>(`${this.CHAT_API_URI}chat.delete`, body, { headers: this.getAuthHeaders() });
      })
    );
  }

  pinMessage(message: any): Observable<any> {
    const params = Array.isArray(message) ? message : [message];
    return this.callWebSocketMethod('pinMessage', params).pipe(
      map((res: any) => res as RocketChatMessageResponse),
      catchError(() => {
        const messageId = typeof message === 'string' ? message : message && message._id;
        const body = { messageId };
        return this.http.post<RocketChatMessageResponse>(`${this.CHAT_API_URI}chat.pinMessage`, body, { headers: this.getAuthHeaders() });
      })
    );
  }

  unpinMessage(message: any): Observable<any> {
    const params = Array.isArray(message) ? message : [message];
    return this.callWebSocketMethod('unpinMessage', params).pipe(
      map((res: any) => res as any),
      catchError(() => {
        const messageId = typeof message === 'string' ? message : message && message._id;
        const body = { messageId };
        return this.http.post<RocketChatMessageResponse>(`${this.CHAT_API_URI}chat.unPinMessage`, body, { headers: this.getAuthHeaders() });
      })
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
