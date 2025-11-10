import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Socket, io } from 'socket.io-client';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  socket: Socket;
  private notificationsSubject = new Subject<any>();
  private typingSubject = new Subject<{ roomId: string; username: string; isTyping: boolean }>();
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
  }

  getNotifications() {
    return this.notificationsSubject.asObservable();
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
}