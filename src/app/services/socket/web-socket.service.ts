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
  
  API_URI = environment.socket;
  private sendQueue: Array<{ event: string; data: any }> = [];
  private reconnectionAttempts = 0;
  private readonly maxReconnectionAttempts = 10;

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
      auth: {
        jwt: localStorage.getItem('jwt'),
        userId: localStorage.getItem('email')
      },
      extraHeaders: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.socket.on('connect', () => {
      this.reconnectionAttempts = 0;
      this.flushQueue();
      try {
        const jwt = localStorage.getItem('jwt');
        if (jwt) {
          this.safeEmit('client:joinRoom', jwt);
        }
      } catch (e) {}
    });

    this.socket.on('connect_error', (err) => {
      console.error('WebSocket connect_error:', err?.message ?? err);
      this.tryReconnect();
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
        if (data && data.targetUserId && String(data.targetUserId) !== String(myId)) {
          return;
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
      if (reason !== 'io client disconnect') {
        this.tryReconnect();
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

  isConnected(): boolean {
    return this.socket && this.socket.connected;
  }

  private safeEmit(event: string, data: any) {
    try {
      if (this.socket && this.socket.connected) {
        this.socket.emit(event, data);
      } else {
        this.sendQueue.push({ event, data });
        this.tryReconnect();
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

  private tryReconnect() {
    if (!this.socket) return;
    if (this.socket.connected) return;
    if (this.reconnectionAttempts >= this.maxReconnectionAttempts) return;
    const delay = Math.min(5000, 1000 * Math.pow(2, this.reconnectionAttempts));
    this.reconnectionAttempts++;
    setTimeout(() => {
      try {
        if (this.socket && !this.socket.connected) {
          console.log('Attempting WebSocket reconnect, attempt', this.reconnectionAttempts);
          this.socket.connect();
        }
      } catch (err) {
        console.error('tryReconnect error', err);
      }
    }, delay);
  }
}