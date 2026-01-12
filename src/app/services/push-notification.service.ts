import { Injectable, NgZone } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { RocketChatService } from './rocket-chat.service';
import { Observable, of, map, catchError } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class PushNotificationService {
  token: string | null = null;

  constructor(
    private snackBar: MatSnackBar,
    private router: Router,
    private ngZone: NgZone,
    private rocketChatService: RocketChatService,
    private http: HttpClient
  ) { }

  async initialize(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      await PushNotifications.createChannel({
        id: 'inimble_general',
        name: 'Inimble Notifications',
        description: 'General notifications for messages and updates',
        importance: 5,
        visibility: 1,
        vibration: true,
      });

      const permission = await PushNotifications.requestPermissions();
      if (permission.receive === 'granted') {
        const isAuthenticated = await this.rocketChatService.isAuthenticated();
        try {
          await PushNotifications.register();
        } catch (e) {
          console.warn('PushNotifications.register() failed or not supported:', e);
        }
      } else {
        console.warn('Notifications permission denied');
      }

      PushNotifications.addListener('registration', (token) => {
        const value = (token && (token as any).value) ? (token as any).value : (typeof token === 'string' ? token : null);
        try {
          if (value) {
            this.setToken(value);
            try { localStorage.setItem('pushToken', value); } catch (e) {}
          } else {
            console.warn('Registration listener did not receive a usable token value:', token);
          }
        } catch (err) {
          console.error('Error in registration listener while setting token:', err);
        }
      });

      PushNotifications.addListener('registrationError', (error) => {
        console.error('Push notifications registration error:', error);
      });

      PushNotifications.addListener('pushNotificationReceived', async (notification) => {
        const title = notification.title || 'New Notification';
        const body = notification.body || '';
        const id = new Date().getTime() % 2147483647;

        try {
          await LocalNotifications.schedule({
            notifications: [{
              title,
              body,
              id,
              extra: notification.data,
              channelId: 'inimble_general'
            }]
          });
        } catch (err) {
          console.error('Error showing local notification for push:', err);
        }
      });

      PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        const data = notification.notification.data;
        let roomId = data?.roomId || data?.rid;
        if (data?.ejson) {
           try {
             const ejson = JSON.parse(data.ejson);
             roomId = ejson?.rid || roomId;
           } catch(e) {}
        }
        if (roomId) {
            this.ngZone.run(() => {
                this.router.navigate(['/apps/chat', roomId]);
            });
        }
      });

    } catch (e) {
      console.error('Push notifications init failed:', e);
    }
  }

  registerPushToken(token: string): Observable<any> {
    try {
      const currentOwner = this.rocketChatService.credentials?.userId || localStorage.getItem('id');
      const lastOwner = localStorage.getItem('pushTokenUserId');
      if (lastOwner && currentOwner && lastOwner !== currentOwner) {
        console.warn('Detected push token owned by another user (', lastOwner, '). Cleaning up before registering for', currentOwner);
        if (this.token) {
          this.deletePushToken().toPromise()
            .catch((e) => {
              console.warn('Could not delete old push token on server:', e);
            });
        }
        localStorage.removeItem('pushTokenUserId');
        this.token = null;
      }
    } catch (e) {
      console.warn('Error while checking push token ownership:', e);
    }

    if (!this.rocketChatService.credentials) {
      return of(null);
    }
    const body = {
      type: 'gcm',
      value: token,
      appName: 'com.inimbleapp.timetracker'
    };
    return this.http.post(`${this.rocketChatService.CHAT_API_URI}push.token`, body, {
      headers: this.rocketChatService.getAuthHeaders(true)
    }).pipe(
      map((response: any) => {
        this.token = token;
        try {
          localStorage.setItem('pushToken', token);
        } catch (e) {
          console.warn('Could not persist push token:', e);
        }
        try {
          const owner = this.rocketChatService.credentials?.userId || localStorage.getItem('id');
          if (owner) {
            localStorage.setItem('pushTokenUserId', owner);
          }
        } catch (e) {
          console.warn('Could not save pushTokenUserId:', e);
        }
        return response;
      }),
      catchError((err:any) => {
        console.error('Error registering push token:', err);
        return of(null);
      })
    );
  }

  async ensureToken(): Promise<string | null> {
    if (this.token) {
      return this.token;
    }
    try {
      const persisted = localStorage.getItem('pushToken');
      if (persisted) {
        this.token = persisted;
        return this.token;
      }
    } catch (e) {
      console.warn('Could not read persisted push token:', e);
    }
    try {
      const result = await (PushNotifications as any).getRegistrationToken?.() ?? await (PushNotifications as any).getToken?.();
      const token = result?.value || result || null;
      if (typeof token === 'string') {
        this.setToken(token);
        try { localStorage.setItem('pushToken', token); } catch (e) {}
        return token;
      } else {
        console.warn('ensureToken: No valid push token received:', token);
        return null;
      }
    } catch (e) {
      console.warn('ensureToken: Could not get push token:', e);
      try {
        try {
          await PushNotifications.register();
        } catch (regErr) {
          console.warn('ensureToken: PushNotifications.register() fallback failed:', regErr);
        }

        const waitForPersisted = async (timeoutMs = 8000): Promise<string | null> => {
          const interval = 200;
          const attempts = Math.ceil(timeoutMs / interval);
          for (let i = 0; i < attempts; i++) {
            try {
              const persisted = localStorage.getItem('pushToken');
              if (persisted) {
                this.setToken(persisted);
                return persisted;
              }
            } catch (readErr) {
              console.warn('ensureToken: Error reading persisted pushToken during fallback wait:', readErr);
            }
            await new Promise((r) => setTimeout(r, interval));
          }
          return null;
        };

        const fallbackToken = await waitForPersisted(8000);
        if (fallbackToken) {
          return fallbackToken;
        }
      } catch (fallbackErr) {
        console.warn('ensureToken fallback failed:', fallbackErr);
      }

      return null;
    }
  }

  deletePushToken(): Observable<any> {
    const url = `${this.rocketChatService.CHAT_API_URI}push.token`;
    return this.http.delete(url, {
      headers: this.rocketChatService.getAuthHeaders(true),
      body: { token: this.token }
    });
  }

  async cleanupPush(): Promise<void> {
    try {
      const token = this.token || (() => { try { return localStorage.getItem('pushToken'); } catch(e){ return null;} })();
      if (token) {
        try {
          await this.deletePushToken().toPromise();
        } catch (e) {
          console.warn('Could not delete push token from server during cleanup:', e);
        }
      }

      this.token = null;
      try { localStorage.removeItem('pushTokenUserId'); } catch (e) {}

      await PushNotifications.removeAllListeners();
      try { await PushNotifications.unregister(); } catch (e) { console.warn('PushNotifications.unregister failed:', e); }
    } catch (error) {
      console.error('Error during push cleanup:', error);
    }
  }

  getCurrentToken(): Promise<string | null> {
    return Promise.resolve(this.token);
  }

  async registerCurrentPushTokenIfNeeded(): Promise<void> {
    await this.ensureToken();
    if (!this.token) {
      return;
    }

    try {
      const currentOwner = this.rocketChatService.credentials?.userId || localStorage.getItem('id');
      const lastOwner = localStorage.getItem('pushTokenUserId');
      if (lastOwner && currentOwner && lastOwner !== currentOwner) {
        console.warn('Ownership mismatch detected before registering current token. Cleaning up old token.');
        try {
          await this.deletePushToken().toPromise();
        } catch (e) {
          console.warn('Could not delete old push token on server:', e);
        }
        localStorage.removeItem('pushTokenUserId');
        await this.ensureToken();
        if (!this.token) {
          return;
        }
      }
    } catch (e) {
      console.warn('Error during ownership verification before registration:', e);
    }

    await this.registerPushToken(this.token).toPromise();
  }

  setToken(token: string | null) {
    if (typeof token === 'string') {
      this.token = token;
    } else {
      this.token = null;
      console.warn('Tried to set invalid token:', token);
    }
  }

  clearToken() {
    this.token = null;
  }
}
