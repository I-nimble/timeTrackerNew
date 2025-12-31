import { Injectable } from '@angular/core';
import { Platform } from '@angular/cdk/platform';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AndroidSettings, IOSSettings } from 'capacitor-native-settings';
import { VoiceRecorder } from 'capacitor-voice-recorder';
import { Camera } from '@capacitor/camera';
import { LocalNotifications } from '@capacitor/local-notifications';

@Injectable({
  providedIn: 'root'
})
export class PlatformPermissionsService {
  private isNative = false;
  private isAndroid = false;
  private isIOS = false;

  constructor(
    private platform: Platform,
    private snackBar: MatSnackBar,
  ) {
    this.detectPlatform();
  }

  private detectPlatform() {
    this.isNative = !!(window as any).Capacitor;

    if (this.isNative) {
      this.isAndroid = this.platform.ANDROID;
      this.isIOS = this.platform.IOS;
    }
  }

  async requestMediaPermissions(videoRequired = true): Promise<boolean> {
    if (this.isNative) {
      return await this.requestCapacitorPermissions(videoRequired);
    } else {
      return await this.requestWebPermissions(videoRequired);
    }
  }

  private async requestWebPermissions(videoRequired: boolean): Promise<boolean> {
    try {
      const constraints: MediaStreamConstraints = {
        audio: true,
        video: videoRequired
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error: any) {
      console.warn('Web media permissions denied:', error);
      return false;
    }
  }

  private async requestCapacitorPermissions(videoRequired: boolean): Promise<boolean> {
    try {
      const cameraStatus = await Camera.checkPermissions();
      const microphoneStatus = await VoiceRecorder.hasAudioRecordingPermission();

      let cameraGranted: boolean = cameraStatus.camera === 'granted' || cameraStatus.photos === 'granted';
      let microphoneGranted: boolean = microphoneStatus.value; 

      if (!microphoneGranted) {
        const microphoneResult = await VoiceRecorder.requestAudioRecordingPermission();
        microphoneGranted = microphoneResult.value; 
      }

      if (videoRequired && !cameraGranted) {
        const cameraResult = await Camera.requestPermissions({ permissions: ['camera'] });
        cameraGranted = cameraResult.camera === 'granted'; 
      }

      return cameraGranted && microphoneGranted;

    } catch (error) {
      console.warn('Capacitor permissions request failed:', error);
      return false;
    }
  }

  async checkMediaPermissions(): Promise<{ camera: string; microphone: string }> {
    if (this.isNative) {
      return await this.checkCapacitorPermissions();
    } else {
      return await this.checkWebPermissions();
    }
  }

  private async checkWebPermissions(): Promise<{ camera: string; microphone: string }> {
    const result = {
      camera: 'prompt',
      microphone: 'prompt'
    };

    try {
      if ('permissions' in navigator) {
        const cameraPermission = await (navigator as any).permissions.query({ name: 'camera' });
        result.camera = cameraPermission.state;

        const microphonePermission = await (navigator as any).permissions.query({ name: 'microphone' });
        result.microphone = microphonePermission.state;
      }
    } catch (error) {
      console.warn('Permissions API not supported');
    }

    return result;
  }

  private async checkCapacitorPermissions(): Promise<{ camera: string; microphone: string }> {
    try {
      const { Camera } = await import('@capacitor/camera');
      const { VoiceRecorder } = await import('capacitor-voice-recorder');

      let cameraStatus = 'prompt';
      let microphoneStatus = 'prompt';

      try {
        const cameraResult = await Camera.checkPermissions();
        cameraStatus = (cameraResult.camera === 'granted' || cameraResult.photos === 'granted') ? 'granted' : 'denied';
      } catch (e) {
        console.warn('Camera permission check failed:', e);
        cameraStatus = 'prompt';
      }

      try {
        try {
          const voiceRecorderResult = await VoiceRecorder.hasAudioRecordingPermission();
          microphoneStatus = voiceRecorderResult.value ? 'granted' : 'denied';
          
          if (microphoneStatus === 'denied') {
            return { camera: cameraStatus, microphone: microphoneStatus };
          }
        } catch (voiceRecorderError) {
          console.warn('VoiceRecorder permission check failed, falling back to Web API:', voiceRecorderError);
        }

        if (microphoneStatus === 'prompt' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach(track => track.stop());
          microphoneStatus = 'granted';
        } else if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          microphoneStatus = 'unavailable';
        }
      } catch (e) {
        console.warn('Microphone permission check failed:', e);
        microphoneStatus = 'denied';
      }

      return {
        camera: cameraStatus,
        microphone: microphoneStatus
      };
    } catch (error) {
      console.warn('Capacitor permissions check error:', error);
      return {
        camera: 'prompt',
        microphone: 'prompt'
      };
    }
  }

  async requestNotificationPermissions(): Promise<boolean> {
    if (this.isNative) {
      return await this.requestCapacitorNotificationPermissions();
    } else {
      return await this.requestWebNotificationPermissions();
    }
  }

  private async requestWebNotificationPermissions(): Promise<boolean> {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  private async requestCapacitorNotificationPermissions(): Promise<boolean> {
    try {
      if (this.isAndroid && (window as any).cordova?.plugins?.permissions) {
        const permissions = (window as any).cordova.plugins.permissions;
        return new Promise<boolean>((resolve) => {
          permissions.checkPermission('android.permission.POST_NOTIFICATIONS', (status: any) => {
             if (status.hasPermission) {
               resolve(true);
             } else {
               permissions.requestPermission('android.permission.POST_NOTIFICATIONS', (requestStatus: any) => {
                 resolve(!!requestStatus.hasPermission);
               }, (error: any) => {
                 console.warn('Cordova permission request failed:', error);
                 this.fallbackToCapacitorNotifications().then(resolve);
               });
             }
          }, (error: any) => {
             console.warn('Cordova check permission failed:', error);
             this.fallbackToCapacitorNotifications().then(resolve);
          });
        });
      }

      return await this.fallbackToCapacitorNotifications();
    } catch (error) {
      console.warn('Capacitor notification permissions request failed:', error);
      return false;
    }
  }

  private async fallbackToCapacitorNotifications(): Promise<boolean> {
     const result = await LocalNotifications.requestPermissions();
     return result.display === 'granted';
  }

  async checkNotificationPermissions(): Promise<string> {
    if (this.isNative) {
      return await this.checkCapacitorNotificationPermissions();
    } else {
      return await this.checkWebNotificationPermissions();
    }
  }

  private async checkWebNotificationPermissions(): Promise<string> {
    if (!('Notification' in window)) return 'unavailable';
    return Notification.permission;
  }

  private async checkCapacitorNotificationPermissions(): Promise<string> {
    try {
      const result = await LocalNotifications.checkPermissions();
      return result.display;
    } catch (error) {
      console.warn('Capacitor notification permissions check failed:', error);
      return 'prompt';
    }
  }

  openSnackBar(message: string): void {
    this.snackBar.open(message, 'OK', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }
}
