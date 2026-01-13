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
    console.log('[PushNotificationService] Initializing push notifications...');
    if (!Capacitor.isNativePlatform()) {
      console.log('[PushNotificationService] Not running on native platform, skipping push setup.');
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
      console.log('[PushNotificationService] Notification channel created.');

      const permission = await PushNotifications.requestPermissions();
      console.log('[PushNotificationService] Permission result:', permission);
      if (permission.receive === 'granted') {
        const isAuthenticated = await this.rocketChatService.isAuthenticated();
        console.log('[PushNotificationService] Authenticated:', isAuthenticated);
        // Ensure native registration is triggered so listener receives token
        try {
          console.log('[PushNotificationService] Calling PushNotifications.register() to request native token');
          await PushNotifications.register();
        } catch (e) {
          console.warn('[PushNotificationService] PushNotifications.register() failed or not supported:', e);
        }
        // Token will be received via the listener below
      } else {
        console.warn('[PushNotificationService] Notifications permission denied');
      }

      PushNotifications.addListener('registration', (token) => {
        console.log('[PushNotificationService] Registration token received (raw):', token);
        // Normalize token value (some platforms return { value } others return string)
        const value = (token && (token as any).value) ? (token as any).value : (typeof token === 'string' ? token : null);
        console.log('[PushNotificationService] Registration token normalized value:', value);
        // Do NOT register here. Registration is handled after Rocket.Chat credentials are set in login flow.
        try {
          if (value) {
            this.setToken(value);
            try { localStorage.setItem('pushToken', value); console.log('[PushNotificationService] Persisted push token from listener'); } catch (e) {}
            console.log('[PushNotificationService] setToken called from registration listener');
          } else {
            console.warn('[PushNotificationService] Registration listener did not receive a usable token value:', token);
          }
        } catch (err) {
          console.error('[PushNotificationService] Error in registration listener while setting token:', err);
        }
      });

      PushNotifications.addListener('registrationError', (error) => {
        console.error('[PushNotificationService] Push notifications registration error:', error);
      });

      PushNotifications.addListener('pushNotificationReceived', async (notification) => {
        console.log('[PushNotificationService] Push notification received:', notification);
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
          console.log('[PushNotificationService] Local notification scheduled.');
        } catch (err) {
          console.error('[PushNotificationService] Error showing local notification for push:', err);
        }
      });

      PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        console.log('[PushNotificationService] Push notification action performed', notification.actionId, notification.inputValue);

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
      console.error('[PushNotificationService] Push notifications init failed:', e);
    }
  }

  registerPushToken(token: string): Observable<any> {
    // Before registering, ensure token ownership is consistent. If a push token was
    // previously registered for a different user, attempt to remove it first.
    try {
      const currentOwner = this.rocketChatService.credentials?.userId || localStorage.getItem('id');
      const lastOwner = localStorage.getItem('pushTokenUserId');
      if (lastOwner && currentOwner && lastOwner !== currentOwner) {
        console.warn('[PushNotificationService] Detected push token owned by another user (', lastOwner, '). Skipping delete; will re-associate token for', currentOwner);
        // Do NOT delete the token or unregister native push here; instead we'll re-register the
        // existing device token for the current user so the server can reconcile ownership.
        // Keep persisted token value; registration will update `pushTokenUserId` on success.
      }
    } catch (e) {
      console.warn('[PushNotificationService] Error while checking push token ownership:', e);
    }

    if (!this.rocketChatService.credentials) {
      console.log('[PushNotificationService] No Rocket.Chat credentials, not registering token.');
      return of(null);
    }
    const body = {
      type: 'gcm',
      value: token,
      appName: 'com.inimbleapp.timetracker'
    };
    console.log('[PushNotificationService] Registering token with body:', body);
    return this.http.post(`${this.rocketChatService.CHAT_API_URI}push.token`, body, {
      headers: this.rocketChatService.getAuthHeaders(true)
    }).pipe(
      map((response: any) => {
        this.token = token;
        try {
          // Persist token locally so it survives service re-initialization
          localStorage.setItem('pushToken', token);
          console.log('[PushNotificationService] Persisted push token to localStorage.');
        } catch (e) {
          console.warn('[PushNotificationService] Could not persist push token:', e);
        }
        console.log('[PushNotificationService] Token registered successfully:', response);
        try {
          const owner = this.rocketChatService.credentials?.userId || localStorage.getItem('id');
          if (owner) {
            localStorage.setItem('pushTokenUserId', owner);
            console.log('[PushNotificationService] Saved pushTokenUserId:', owner);
          }
        } catch (e) {
          console.warn('[PushNotificationService] Could not save pushTokenUserId:', e);
        }
        return response;
      }),
      catchError((err:any) => {
        console.error('[PushNotificationService] Error registering push token:', err);
        return of(null);
      })
    );
  }

  /**
   * Ensures a push token is available in memory. If not, requests it from the native layer.
   */
  async ensureToken(): Promise<string | null> {
    // Prefer in-memory token
    if (this.token) {
      return this.token;
    }
    // Fallback to persisted token
    try {
      const persisted = localStorage.getItem('pushToken');
      if (persisted) {
        this.token = persisted;
        console.log('[PushNotificationService] Loaded persisted push token from localStorage:', persisted);
        return this.token;
      }
    } catch (e) {
      console.warn('[PushNotificationService] Could not read persisted push token:', e);
    }
    try {
      // Try both APIs for compatibility
      const result = await (PushNotifications as any).getRegistrationToken?.() ?? await (PushNotifications as any).getToken?.();
      const token = result?.value || result || null;
      if (typeof token === 'string') {
        this.setToken(token);
        try { localStorage.setItem('pushToken', token); } catch (e) {}
        console.log('[PushNotificationService] ensureToken: Got new push token:', token);
        return token;
      } else {
        console.warn('[PushNotificationService] ensureToken: No valid push token received:', token);
        return null;
      }
    } catch (e) {
      console.warn('[PushNotificationService] ensureToken: Could not get push token:', e);
      // Fallback: trigger native registration and wait briefly for the registration listener
      try {
        console.log('[PushNotificationService] ensureToken: Triggering PushNotifications.register() fallback.');
        try {
          await PushNotifications.register();
        } catch (regErr) {
          console.warn('[PushNotificationService] ensureToken: PushNotifications.register() fallback failed:', regErr);
        }

        // Wait for the registration listener to persist the token to localStorage (registration listener sets 'pushToken')
        const waitForPersisted = async (timeoutMs = 8000): Promise<string | null> => {
          const interval = 200;
          const attempts = Math.ceil(timeoutMs / interval);
          for (let i = 0; i < attempts; i++) {
            try {
              const persisted = localStorage.getItem('pushToken');
              if (persisted) {
                this.setToken(persisted);
                console.log('[PushNotificationService] ensureToken: Retrieved persisted token after fallback register:', persisted);
                return persisted;
              }
            } catch (readErr) {
              console.warn('[PushNotificationService] ensureToken: Error reading persisted pushToken during fallback wait:', readErr);
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
        console.warn('[PushNotificationService] ensureToken fallback failed:', fallbackErr);
      }

      return null;
    }
  }

  public deletePushToken(): Observable<any> {
    const url = `${this.rocketChatService.CHAT_API_URI}push.token`;
    const token = this.token || localStorage.getItem('pushToken');
    console.log('[PushNotificationService] Deleting push token:', token);
    return this.http.delete(url, {
      headers: this.rocketChatService.getAuthHeaders(true),
      body: { token: token }
    });
  }

  public async cleanupPush(deleteOnServer: boolean = false): Promise<void> {
    try {
      // Only delete server-side registration when explicitly requested (e.g., logout).
      const token = this.token || (() => { try { return localStorage.getItem('pushToken'); } catch(e){ return null; } })();
      if (token && deleteOnServer) {
        try {
          await this.deletePushToken().toPromise();
          console.log('[PushNotificationService] Push token removed from server successfully');
        } catch (e) {
          console.warn('[PushNotificationService] Could not delete push token from server during cleanup:', e);
        }
      } else {
        console.log('[PushNotificationService] No push token to clean up on server.');
      }

      // Keep the native/persisted push token across logouts so the device can re-use it on next login.
      this.token = null;
      try { localStorage.removeItem('pushTokenUserId'); } catch (e) {}

      // Remove listeners; do not call native `unregister()` to avoid invalidating
      // the device token at the native provider when ownership changes.
      await PushNotifications.removeAllListeners();
    } catch (error) {
    }
  }

  public getCurrentToken(): Promise<string | null> {
    console.log('[PushNotificationService] getCurrentToken called, token:', this.token);
    return Promise.resolve(this.token);
  }

  public async registerCurrentPushTokenIfNeeded(): Promise<void> {
    // Ensure a token exists (requests it if missing) before attempting registration
    await this.ensureToken();
    if (!this.token) {
      console.log('[PushNotificationService] No token to register after ensureToken.');
      return;
    }

    // Check ownership again in case things changed between ensureToken and registration
    try {
      const currentOwner = this.rocketChatService.credentials?.userId || localStorage.getItem('id');
      const lastOwner = localStorage.getItem('pushTokenUserId');
      if (lastOwner && currentOwner && lastOwner !== currentOwner) {
        console.warn('[PushNotificationService] Ownership mismatch detected before registering current token. Will re-associate token instead of deleting.');
        try {
          // Attempt to register the existing token for the current user. The server should update ownership.
          if (this.token) {
            await this.registerPushToken(this.token).toPromise();
          }
        } catch (e) {
        }
      }
    } catch (e) {
      console.warn('[PushNotificationService] Error during ownership verification before registration:', e);
    }

    console.log('[PushNotificationService] Registering current push token after login...');
    await this.registerPushToken(this.token).toPromise();
  }

  setToken(token: string | null) {
    if (typeof token === 'string') {
      this.token = token;
      console.log('[PushNotificationService] Token set in memory:', token);
    } else {
      this.token = null;
      console.warn('[PushNotificationService] Tried to set invalid token:', token);
    }
  }

  clearToken() {
    console.log('[PushNotificationService] Clearing in-memory push token.');
    this.token = null;
  }
}
