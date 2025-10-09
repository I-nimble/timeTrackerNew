import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { Preferences } from '@capacitor/preferences';
import { environment } from 'src/environments/environment';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

export interface PushPermissionStatus {
  granted: boolean;
  denied: boolean;
  prompt: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PushNotificationService {
  private API_URI = `${environment.apiUrl}/push`;
  private isNative = Capacitor.isNativePlatform();
  private currentUserId: string | null = null;

  public permissionStatus = new BehaviorSubject<PushPermissionStatus>({ granted: false, denied: false, prompt: false });
  public notificationReceived = new BehaviorSubject<any>(null);

  constructor(private http: HttpClient) {}

  async initializePushNotifications(userId: string): Promise<boolean> {
    if (!this.isNative) return false;

    this.currentUserId = userId;
    
    try {
      const permission = await PushNotifications.requestPermissions();
      if (permission.receive !== 'granted') {
        console.warn('Push notification permission denied');
        return false;
      }

      await PushNotifications.register();
      
      this.setupPushListeners();
      
      const token = await this.getCurrentToken();
      if (token) {
        await this.sendTokenToBackend(token);
      }

      console.log('Push notifications initialized successfully');
      return true;

    } catch (error) {
      console.error('Error initializing push notifications:', error);
      return false;
    }
  }

  async unsubscribeFromPushNotifications(userId: string): Promise<boolean> {
    if (!this.isNative) return false;

    try {
      const token = await this.getStoredToken();
      
      if (token) {
        await this.http.post(`${this.API_URI}/unsubscribe`, {
          fcmToken: token,
          userId: userId
        }).toPromise().catch(error => {
          console.warn('Backend unsubscribe failed:', error);
        });
      }

      await Preferences.remove({ key: 'fcm_token' });
      await PushNotifications.unregister();
      
      this.currentUserId = null;
      console.log('Push notifications disabled successfully');
      return true;

    } catch (error) {
      console.error('Error disabling push notifications:', error);
      return false;
    }
  }

  async getPushPermissionStatus(): Promise<PushPermissionStatus> {
    if (!this.isNative) {
      return { granted: false, denied: false, prompt: false };
    }

    try {
      const permission = await PushNotifications.checkPermissions();
      const status = {
        granted: permission.receive === 'granted',
        denied: permission.receive === 'denied',
        prompt: permission.receive === 'prompt'
      };

      this.permissionStatus.next(status);
      return status;

    } catch (error) {
      console.error('Error checking permissions:', error);
      return { granted: false, denied: false, prompt: false };
    }
  }

  async isPushEnabledForUser(userId: string): Promise<boolean> {
    try {
      const token = await this.getStoredToken();
      const permission = await this.getPushPermissionStatus();
      
      return !!(token && permission.granted);
    } catch (error) {
      console.error('Error checking push status:', error);
      return false;
    }
  }

  private setupPushListeners(): void {
    if (!this.isNative) return;

    PushNotifications.addListener('registration', (token: Token) => {
      console.log('Push token:', token.value);
      this.handleNewToken(token.value);
    });

    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Push registration error:', error);
    });

    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      console.log('Push received:', notification);
      this.notificationReceived.next(notification);
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
      console.log('Push action:', action);
      this.handleNotificationAction(action);
    });
  }

  private async handleNewToken(token: string): Promise<void> {
    await Preferences.set({ key: 'fcm_token', value: token });
    
    if (this.currentUserId) {
      await this.sendTokenToBackend(token);
    }
  }

  private async sendTokenToBackend(token: string): Promise<void> {
    if (!this.currentUserId) return;

    try {
      await this.http.post(`${this.API_URI}/register`, {
        fcmToken: token,
        userId: this.currentUserId,
        deviceType: 'mobile',
        platform: 'android'
      }).toPromise();

      console.log('FCM token sent to backend');
    } catch (error) {
      console.error('Failed to send FCM token:', error);
    }
  }

  private async getStoredToken(): Promise<string | null> {
    try {
      const { value } = await Preferences.get({ key: 'fcm_token' });
      return value;
    } catch {
      return null;
    }
  }

  private async getCurrentToken(): Promise<string | null> {
    return this.getStoredToken();
  }

  private handleNotificationAction(action: ActionPerformed): void {
    const data = action.notification.data || {};
    
    if (data.notificationId && this.currentUserId) {
      this.http.put(`${environment.apiUrl}/notifications/${data.notificationId}/${this.currentUserId}`, {
        status: 2
      }).subscribe({
        error: (error) => console.error('Error marking as read:', error)
      });
    }
  }
}