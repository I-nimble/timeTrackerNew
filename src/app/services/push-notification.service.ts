import { Injectable, NgZone } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { RocketChatService } from './rocket-chat.service';

@Injectable({
  providedIn: 'root'
})
export class PushNotificationService {

  constructor(
    private snackBar: MatSnackBar,
    private router: Router,
    private ngZone: NgZone,
    private rocketChatService: RocketChatService
  ) { }

  async initialize(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      const permission = await PushNotifications.requestPermissions();
      
      if (permission.receive === 'granted') {
        await PushNotifications.register();
      } else {
        console.warn('Notifications permission denied');
      }

      PushNotifications.addListener('registration', (token) => {
        this.rocketChatService.registerPushToken(token.value).subscribe();
      });

      PushNotifications.addListener('registrationError', (error) => {
        console.error('Push notifications registration error:', error);
      });

      PushNotifications.addListener('pushNotificationReceived', async (notification) => {
        const title = notification.title || 'New Notification';
        const body = notification.body || '';
        const id = new Date().getTime();

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
}
