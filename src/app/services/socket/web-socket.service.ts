import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Socket, io } from 'socket.io-client';
import { environment } from 'src/environments/environment';
import { GeolocationData, GeolocationUpdate, GeolocationRequest, GeolocationDenied } from '../../models/geolocation.model';

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  socket: Socket;
  private notificationsSubject = new Subject<any>();
  private typingSubject = new Subject<{ roomId: string; username: string; isTyping: boolean }>();
  
  private geolocationRequestSubject = new Subject<GeolocationRequest>();
  private geolocationUpdateSubject = new Subject<GeolocationUpdate>();
  private geolocationDeniedSubject = new Subject<GeolocationDenied>();
  private closedEntrySubject = new Subject<any>();
  private startedEntrySubject = new Subject<any>();
  
  API_URI = environment.socket;
  private sendQueue: Array<{ event: string; data: any }> = [];
  private pausedByAuthError = false;

  constructor() {
    this.initializeSocket();
  }

  private initializeSocket() {

    this.socket = io(this.API_URI, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
      auth: this.getAuthPayload(),
      extraHeaders: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.socket.on('connect', () => {
      this.pausedByAuthError = false;
      this.flushQueue();
      try {
        const jwt = localStorage.getItem('jwt');
        if (jwt) {
          this.safeEmit('client:joinRoom', jwt);
        }
      } catch (e) {}
    });

    this.socket.on('connect_error', (err) => {
      const message = String(err?.message ?? '').toLowerCase();
      const isAuthError =
        message.includes('jwt expired') ||
        message.includes('unauthorized') ||
        message.includes('invalid token') ||
        message.includes('authentication');

      if (isAuthError) {
        this.pauseReconnectUntilReauthenticated();
        console.warn('WebSocket auth error. Reconnect paused until token is refreshed.');
        return;
      }

      console.error('WebSocket connect_error:', err?.message ?? err);
    });

    this.socket.on('server:notificationsUpdated', () => {
      this.notificationsSubject.next('update');
    });

    this.socket.on('server:newTalentMatch', (data) => {
      this.notificationsSubject.next('new-talent-match');
    });

    this.socket.on('server:typing', (data: any) => {
      try {
        if (data && data.roomId && data.username != null && typeof data.isTyping !== 'undefined') {
          this.typingSubject.next({ roomId: data.roomId, username: data.username, isTyping: !!data.isTyping });
        }
      } catch (err) {
        console.error('Error processing server:typing event', err, data);
      }
    });

    this.socket.on('server:requestGeolocation', (data: GeolocationRequest) => {
      try {
        const myId = localStorage.getItem('id');
        if (data && data.fallback && data.targetUserId) {
          if (myId && String(data.targetUserId) !== String(myId)) {
            return;
          }
        }
        if (data && data.requesterId) {
          this.geolocationRequestSubject.next(data);
        }
      } catch (err) {
        console.error('Error processing server:requestGeolocation event', err, data);
      }
    });

    this.socket.on('server:geolocationUpdate', (data: GeolocationUpdate) => {
      try {
        if (data && data.userId && data.latitude && data.longitude) {
          this.geolocationUpdateSubject.next(data);
        }
      } catch (err) {
        console.error('Error processing server:geolocationUpdate event', err, data);
      }
    });

    this.socket.on('server:geolocationDenied', (data: GeolocationDenied) => {
      try {
        if (data && data.userId) {
          this.geolocationDeniedSubject.next(data);
        }
      } catch (err) {
        console.error('Error processing server:geolocationDenied event', err, data);
      }
    });
    this.socket.on('disconnect', (reason) => {
      console.warn('WebSocket disconnected:', reason);
    });

    this.socket.on('server:closedEntry', (data?: any) => {
      try {
        this.closedEntrySubject.next(data || {});
      } catch (err) {
        console.error('Error processing server:closedEntry event', err, data);
      }
    });

    this.socket.on('server:startedEntry', (data?: any) => {
      try {
        this.startedEntrySubject.next(data || {});
      } catch (err) {
        console.error('Error processing server:startedEntry event', err, data);
      }
    });
  }

  getNotifications() {
    return this.notificationsSubject.asObservable();
  }

  joinRoom(roomId: string) {
    try {
      if (!roomId) return;
      this.safeEmit('client:joinChatRoom', roomId);
    } catch (err) {
      console.error('Failed to request join chat room', err, roomId);
    }
  }

  emitTyping(roomId: string, username: string, isTyping: boolean) {
    try {
      this.safeEmit('client:typing', { roomId, username, isTyping });
    } catch (err) {
      console.error('Failed to emit typing event', err);
    }
  }

  getTypingStream() {
    return this.typingSubject.asObservable();
  }

  requestGeolocation(targetUserId: number) {
    try {
      this.safeEmit('client:requestGeolocation', { targetUserId });
    } catch (err) {
      console.error('Failed to request geolocation', err);
    }
  }

  sendLocationUpdate(data: GeolocationData) {
    try {
      this.safeEmit('client:updateLocation', {
        latitude: data.latitude,
        longitude: data.longitude,
        accuracy: data.accuracy,
        timestamp: data.timestamp || new Date().toISOString(),
        deviceId: data.deviceId,
        userId: data.userId
      });
    } catch (err) {
      console.error('Failed to send geolocation update', err);
    }
  }

  sendGeolocationDenied(requesterId: number) {
    try {
      this.safeEmit('client:geolocationDenied', { requesterId });
    } catch (err) {
      console.error('Failed to send geolocation denied', err);
    }
  }

  getGeolocationRequestStream() {
    return this.geolocationRequestSubject.asObservable();
  }

  getGeolocationUpdateStream() {
    return this.geolocationUpdateSubject.asObservable();
  }

  getGeolocationDeniedStream() {
    return this.geolocationDeniedSubject.asObservable();
  }

  getClosedEntryStream() {
    return this.closedEntrySubject.asObservable();
  }

  getStartedEntryStream() {
    return this.startedEntrySubject.asObservable();
  }

  isConnected(): boolean {
    return this.socket && this.socket.connected;
  }

  joinAuthenticatedRoom(jwt?: string) {
    try {
      const token = jwt || localStorage.getItem('jwt');
      if (!token) return;

      this.pausedByAuthError = false;
      this.socket.io.opts.reconnection = true;
      this.refreshAuthFromStorage();

      if (!this.socket.connected) {
        this.socket.connect();
      }

      this.safeEmit('client:joinRoom', token);
    } catch (err) {
      console.error('Failed to join authenticated room', err);
    }
  }

  disconnectAndPauseReconnect() {
    this.pauseReconnectUntilReauthenticated();
  }

  private safeEmit(event: string, data: any) {
    try {
      if (this.socket && this.socket.connected) {
        this.socket.emit(event, data);
      } else {
        this.sendQueue.push({ event, data });
        if (!this.pausedByAuthError) {
          this.refreshAuthFromStorage();
          this.socket.connect();
        }
      }
    } catch (err) {
      console.error('safeEmit error', err, event, data);
    }
  }

  private flushQueue() {
    if (!this.socket || !this.socket.connected) return;
    while (this.sendQueue.length > 0) {
      const item = this.sendQueue.shift();
      try {
        if (!item) continue;
        this.socket.emit(item.event, item.data);
      } catch (err) {
        console.error('Error flushing sendQueue item', err, item);
      }
    }
  }

  private getAuthPayload() {
    return {
      jwt: localStorage.getItem('jwt'),
      userId: localStorage.getItem('email')
    };
  }

  private refreshAuthFromStorage() {
    if (!this.socket) return;
    this.socket.auth = this.getAuthPayload();
  }

  private pauseReconnectUntilReauthenticated() {
    if (!this.socket) return;
    this.pausedByAuthError = true;
    this.socket.io.opts.reconnection = false;
    this.socket.disconnect();
  }
}