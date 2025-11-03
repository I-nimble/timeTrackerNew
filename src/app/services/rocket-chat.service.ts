import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  RocketChatCredentials,
  RocketChatUser,
  RocketChatRoom,
  RocketChatMessage,
} from '../models/rocketChat.model';

@Injectable({
  providedIn: 'root',
})
export class RocketChatService {
  private API_URI = `${environment.rocketChatUrl}/api/v1/`;
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

  constructor(private http: HttpClient) {
    this.loadCredentials();
  }

  private loadCredentials(): void {
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
        console.log('Rocket.Chat WebSocket connected');

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
        console.log(
          'Rocket.Chat WebSocket disconnected:',
          event.code,
          event.reason
        );
        this.connectionSubject.next(false);

        if (this.credentials) {
          setTimeout(() => {
            this.connectWebSocket();
          }, 5000);
        }
      };
    });
  }

  private handleWebSocketMessage(message: any): void {
    if (message.msg === 'connected') {
      console.log('Rocket.Chat WebSocket authenticated');
      this.connectionSubject.next(true);
    }

    if (message.msg === 'ready') {
      console.log('Subscriptions ready:', message.subs);
    }

    if (
      message.msg === 'changed' &&
      message.collection === 'stream-room-messages'
    ) {
      if (
        message.fields &&
        message.fields.args &&
        message.fields.args.length > 0
      ) {
        const messageData = message.fields.args[0];
        this.messageStreamSubject.next(messageData);
      }
    }

    if (message.msg === 'result') {
      console.log('Method result:', message);
    }
  }

  private sendWebSocketMessage(message: any): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.error('WebSocket not connected');
    }
  }

  private generateMessageId(): string {
    return `${Date.now()}${++this.messageId}`;
  }

  private generateSubscriptionId(): string {
    return `sub-${++this.subscriptionId}`;
  }

  async loadRoomHistory(
    roomId: string,
    limit: number = 50
  ): Promise<RocketChatMessage[]> {
    if (!this.credentials) {
      throw new Error('Not authenticated');
    }

    try {
      const response: any = await this.http
        .post(
          `${this.API_URI}/channels.history`,
          {
            roomId,
            count: limit,
          },
          { headers: this.getAuthHeaders() }
        )
        .toPromise();

      if (response.success) {
        return response.messages || [];
      } else {
        throw new Error(response.error || 'Failed to load room history');
      }
    } catch (error) {
      console.error(
        'REST history load failed, falling back to WebSocket:',
        error
      );

      return this.loadHistoryViaWebSocket(roomId, limit);
    }
  }

  private async loadHistoryViaWebSocket(
    roomId: string,
    limit: number = 50
  ): Promise<RocketChatMessage[]> {
    return new Promise((resolve, reject) => {
      if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      const messageId = this.generateMessageId();

      const handleResult = (event: MessageEvent) => {
        const message = JSON.parse(event.data);
        if (message.msg === 'result' && message.id === messageId) {
          this.socket!.removeEventListener('message', handleResult);

          if (message.error) {
            reject(new Error(message.error.message || 'Load history failed'));
          } else {
            resolve(message.result.messages || []);
          }
        }
      };

      this.socket.addEventListener('message', handleResult);

      this.sendWebSocketMessage({
        msg: 'method',
        method: 'loadHistory',
        id: messageId,
        params: [roomId, null, limit, null],
      });

      setTimeout(() => {
        this.socket!.removeEventListener('message', handleResult);
        reject(new Error('Load history timeout'));
      }, 10000);
    });
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
    console.log(`Subscribed to room messages: ${roomId}`);
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
      console.log(`Unsubscribed from room messages: ${roomId}`);
    }
  }

  async login(email: string, password: string): Promise<RocketChatCredentials> {
    try {
      const loginResponse: any = await this.http
        .post(`${this.API_URI}login`, { user: email, password })
        .toPromise();

      if (loginResponse.status === 'success' && loginResponse.data) {
        const credentials = {
          authToken: loginResponse.data.authToken,
          userId: loginResponse.data.userId,
        };

        this.saveCredentials(credentials);
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
        .get(`${this.API_URI}me`, { headers })
        .toPromise();

      if (testResponse.success) {
        this.saveCredentials(credentials);
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      console.error('Login with credentials failed:', error);
      this.clearCredentials();
      throw error;
    }
  }

  async getCurrentUser(): Promise<RocketChatUser> {
    const response: any = await this.http
      .get(`${this.API_URI}me`, {
        headers: this.getAuthHeaders(),
      })
      .toPromise();

    if (response.success) {
      return response;
    } else {
      throw new Error(response.error || 'Failed to get user info');
    }
  }

  async getRooms(): Promise<RocketChatRoom[]> {
    const response: any = await this.http
      .get(`${this.API_URI}rooms.get`, {
        headers: this.getAuthHeaders(),
      })
      .toPromise();

    if (response.success) {
      return response.update || [];
    } else {
      throw new Error(response.error || 'Failed to get rooms');
    }
  }

  async sendMessage(
    roomId: string,
    message: string
  ): Promise<RocketChatMessage> {
    const response: any = await this.http
      .post(
        `${this.API_URI}chat.postMessage`,
        {
          channel: roomId,
          text: message,
        },
        { headers: this.getAuthHeaders() }
      )
      .toPromise();

    if (response.success) {
      return response.message;
    } else {
      throw new Error(response.error || 'Failed to send message');
    }
  }

  async createDirectMessage(username: string): Promise<RocketChatRoom> {
    const response: any = await this.http
      .post(
        `${this.API_URI}dm.create`,
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
      .get(`${this.API_URI}dm.list`, {
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
      .get(`${this.API_URI}channels.list`, {
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
        `${this.API_URI}channels.join`,
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
        `${this.API_URI}channels.leave`,
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
          .post(`${this.API_URI}logout`, {}, { headers: this.getAuthHeaders() })
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
    const url = `${this.API_URI}${endpoint}`;

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
}
