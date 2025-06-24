import { Injectable } from '@angular/core';
import { UIKitSettingsBuilder } from "@cometchat/uikit-shared";
import { CometChatUIKit } from "@cometchat/chat-uikit-angular";
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { CometChatNotifications } from "@cometchat/chat-sdk-javascript";
import { getToken } from "firebase/messaging";
import { messaging } from '../firebase';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class CometChatService {
  private UIKitSettings!: any;
  API_URI = environment.apiUrl;
  isChatAvailable: boolean = false; 
  isCallOngoing: boolean = false;
  public callObject!: CometChat.Call | null;
  public outGoingCallObject!: CometChat.Call | null;

  constructor(private http: HttpClient, private snackBar: MatSnackBar) { }

  async initializeCometChat(companyId?: number): Promise<void> {
    try {
      const chat_uid = localStorage.getItem('id');
      if (!chat_uid) return;

      const credentials = await this.fetchChatCredentials(companyId);
      if (!credentials) return;

      const initialized = await this.initCometChatUIKit(credentials);
      if (!initialized) return;

      const loggedIn = await this.loginCometChatUser(chat_uid);
      if (!loggedIn) return;

      this.isChatAvailable = true;

      const permissionGranted = await this.requestNotificationPermission();
      if (!permissionGranted) return;

      await this.registerPushToken();

    } catch (error) {
      console.error("Initialization failed with error:", error);
    }
  }

  private async fetchChatCredentials(companyId?: number): Promise<any | null> {
    try {
      const credentials: any = await firstValueFrom(this.getChatCredentials(companyId));
      if (!credentials) {
        console.error("No chat credentials found in the database.");
        return null;
      }
      return credentials;
    } catch (error) {
      console.error("Error fetching chat credentials:", error);
      return null;
    }
  }

  private async initCometChatUIKit(credentials: any): Promise<boolean> {
    try {
      this.UIKitSettings = new UIKitSettingsBuilder()
        .setAppId(credentials.app_id)
        .setRegion("us")
        .setAuthKey(credentials.auth_key)
        .subscribePresenceForAllUsers()
        .build();
      await CometChatUIKit.init(this.UIKitSettings);
      return true;
    } catch (error) {
      console.error("CometChatUIKit initialization failed:", error);
      return false;
    }
  }

  private async loginCometChatUser(uid: string): Promise<boolean> {
    try {
      const user = await CometChatUIKit.getLoggedinUser();
      if (!user) {
        await CometChatUIKit.login({ uid });
      }
      return true;
    } catch (error) {
      console.error("CometChat login failed:", error);
      return false;
    }
  }

  private async requestNotificationPermission(): Promise<boolean> {
    try {
      const permissionResult = await Notification.requestPermission();
      if (permissionResult !== "granted") {
        this.openSnackBar('You have blocked notifications. Please enable them in your browser settings.', 'Close');
        return false;
      }
      return true;
    } catch (error) {
      console.error("Notification permission error:", error);
      return false;
    }
  }

  private async registerPushToken(): Promise<void> {
    try {
      const pushToken = await getToken(
        messaging,
        { vapidKey: environment.vapidKey }
      );
      if (pushToken) {
        await CometChatNotifications.registerPushToken(
          pushToken,
          CometChatNotifications.PushPlatforms.FCM_WEB,
          "chat-notifications"
        );
      }
    } catch (error) {
      console.error('An error occurred while retrieving token. ', error);
    }
  }

  async logout(): Promise<void> {
    try {
      if (!this.isChatAvailable) {
        return;
      }
      const user = await CometChatUIKit.getLoggedinUser();
      if (user) {
        await CometChatNotifications.unregisterPushToken();
        await CometChatUIKit.logout();
      }
      this.isChatAvailable = false;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  public getChatCredentials(companyId?: number): Observable<any[]> {
    if(companyId) return this.http.get<any[]>(`${this.API_URI}/chat/${companyId}`);
    return this.http.get<any[]>(`${this.API_URI}/chat/`);
  }

  public openSnackBar(message: string, action: string) {
    this.snackBar.open(message, action, {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }
}