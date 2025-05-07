import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SignupDataService {
  client = {
    firstName: null,
    lastName: null,
    email: '',
    company: null,
    password: null,
    phone: null,
  };

  setEmail(email: string) {
    this.client.email = email;
  }

  getClientData() {
    return this.client;
  }
}