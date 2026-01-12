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

  constructor() {
    this.initializeSocket();
  }

  private initializeSocket() {

    this.socket = io(this.API_URI, {
      withCredentials: true,  
      transports: ['websocket', 'polling'],  
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
    });

    this.socket.on('connect_error', (err) => {
      console.error('Error de conexión:', err.message);
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
  }

  getNotifications() {
    return this.notificationsSubject.asObservable();
  }

  joinRoom(roomId: string) {
    try {
      if (!roomId) return;
      this.socket.emit('client:joinChatRoom', roomId);
    } catch (err) {
      console.error('Failed to request join chat room', err, roomId);
    }
  }

  emitTyping(roomId: string, username: string, isTyping: boolean) {
    try {
      this.socket.emit('client:typing', { roomId, username, isTyping });
    } catch (err) {
      console.error('Failed to emit typing event', err);
    }
  }

  getTypingStream() {
    return this.typingSubject.asObservable();
  }

  requestGeolocation(targetUserId: number) {
    try {
      this.socket.emit('client:requestGeolocation', { targetUserId });
    } catch (err) {
      console.error('Failed to request geolocation', err);
    }
  }

  sendLocationUpdate(data: GeolocationData) {
    try {
      this.socket.emit('client:updateLocation', {
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
      this.socket.emit('client:geolocationDenied', { requesterId });
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
}