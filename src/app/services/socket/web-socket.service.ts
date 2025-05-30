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
  }

  getNotifications() {
    return this.notificationsSubject.asObservable();
  }
}