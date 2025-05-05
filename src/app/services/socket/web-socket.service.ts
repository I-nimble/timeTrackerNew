import { Injectable } from '@angular/core';
import { local } from 'd3';
import { Socket, io } from 'socket.io-client';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  socket: Socket;
  API_URI = environment.socket;

  constructor() {
    this.socket = io(this.API_URI, { query: {userId: localStorage.getItem('email'), jwt: localStorage.getItem('jwt')} });

  }

}
