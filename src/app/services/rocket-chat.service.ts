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
  firstValueFrom
} from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  RocketChatCredentials,
  RocketChatUser,
  RocketChatRoom,
  RocketChatMessage,
  RocketChatTeam
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

  private credentials: RocketChatCredentials | null = null;
  private activeSubscriptions = new Map<string, string>();
  private messageId = 0;
  private subscriptionId = 0;

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

  private getAuthHeaders(): HttpHeaders {
    if (!this.credentials) {
      throw new Error('Not authenticated with Rocket.Chat');
    }

    return new HttpHeaders({
      'X-Auth-Token': this.credentials.authToken,
      'X-User-Id': this.credentials.userId,
      'Content-Type': 'application/json',
    });
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

      const latestHistoryTimestamp = history.length > 0 
      ? this.normalizeTimestamp(history[history.length - 1].ts).getTime()
      : 0;

      await this.subscribeToRoomMessages(roomId);

      return {
        history,
        realtimeStream: this.getMessageStream().pipe(
          filter(message => message.rid === roomId),
          filter(message => {
            const messageTimestamp = this.normalizeTimestamp(message.ts).getTime();
            return messageTimestamp > latestHistoryTimestamp;
          })
        )
      };
    } catch (error) {
      console.error('Error loading room history:', error);
      throw error;
    }
  }

  private handleWebSocketMessage(message: any): void {
    if (message.msg === 'connected') {
      this.connectionSubject.next(true);

      this.resubscribeToActiveRooms();
    }

    if (
      message.msg === 'changed' &&
      message.collection === 'stream-room-messages'
    ) {
      if (message.fields?.args?.[0]) {
        const messageData: RocketChatMessage = message.fields.args[0];
        this.messageStreamSubject.next(messageData);
      }
    }

    if (
      message.msg === 'changed' &&
      message.collection === 'stream-notify-room'
    ) {
      this.roomUpdateSubject.next(message);
    }

    if (message.msg === 'ping') {
      this.sendWebSocketMessage({ msg: 'pong' });
    }
  }

  private resubscribeToActiveRooms(): void {
    if (this.activeSubscriptions.size > 0) {
      this.activeSubscriptions.forEach((subscriptionId, roomId) => {
        this.subscribeToRoomMessages(roomId).catch((error) => {
          console.error(`Failed to resubscribe to room ${roomId}:`, error);
        });
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
            observer.next({ success: false, error: wsMessage.error.message });
          } else {
            observer.next({ success: true, message: wsMessage.result });
          }
          observer.complete();
        }
      };

      this.socket.addEventListener('message', handleConfirmation);

      this.sendWebSocketMessage({
        msg: 'method',
        method: 'sendMessage',
        id: tempMessageId,
        params: [
          {
            _id: this.generateMessageId(),
            rid: roomId,
            msg: message,
          },
        ],
      });

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

  getRooms(): Observable<any> {
    return this.http
      .get<any>(`${this.CHAT_API_URI}rooms.get`, {
        headers: this.getAuthHeaders(),
      })
      .pipe(map((res: any) => res.update as RocketChatRoom[]));
  }
  
  createRoom(name: string, type: 'c' | 'p', members?: string[]): Observable<RocketChatRoom> {
    const headers = this.getAuthHeaders();
    const safeName = String(name || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9_\-]/g, '')
      .replace(/^-+|-+$/g, '');

    if (!safeName) {
      return new Observable<RocketChatRoom>((observer) => {
        observer.error(new Error('Invalid room name'));
      });
    }

    if (type === 'c') {
      return this.http.post<any>(`${this.CHAT_API_URI}channels.create`, { name: safeName }, { headers }).pipe(
        switchMap(res => {
          const channel = res?.channel as RocketChatRoom;
          if (members?.length) {
            const roomId = channel._id;
            return forkJoin(members.map(userId =>
              this.http.post(`${this.CHAT_API_URI}channels.invite`, { roomId, userId }, { headers })
            )).pipe(map(() => channel));
          }
          return of(channel);
        }),
        catchError(err => {
          throw err;
        })
      );
    } else {
      const body: any = { name: safeName };
      if (members?.length) body.members = members;

      return this.http.post<any>(`${this.CHAT_API_URI}groups.create`, body, { headers }).pipe(
        switchMap(res => {
          const group = res?.group as RocketChatRoom;
          if (members?.length) {
            return of(group);
          }
          return of(group);
        }),
        catchError(err => { throw err; })
      );
    }
  }

  createTeam(name: string, owner: string, members?: string[]): Observable<RocketChatTeam> {
    const headers = this.getAuthHeaders();
    const body: any = { name, type: 1, owner };
    if (members?.length) body.members = members;

    return this.http.post<any>(`${this.CHAT_API_URI}teams.create`, body, { headers }).pipe(
      map(res => res.team as RocketChatTeam)
    );
  }

  sendMessage(roomId: string, message: string): Observable<any> {
    return this.http.post(
      `${this.CHAT_API_URI}chat.postMessage`,
      {
        channel: roomId,
        text: message,
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
}
