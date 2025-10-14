import { Injectable } from '@angular/core';
import { UIKitSettingsBuilder, ContactsConfiguration, UsersConfiguration } from "@cometchat/uikit-shared";
import { CometChatUIKit, CometChatThemeService, CometChatTheme } from "@cometchat/chat-uikit-angular";
import { Observable, firstValueFrom, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { CometChatNotifications } from "@cometchat/chat-sdk-javascript";
import { getToken } from "firebase/messaging";
import { messaging } from '../firebase';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CometChatMessageTemplate, CometChatMessageOption } from "@cometchat/uikit-resources"
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { Capacitor } from '@capacitor/core';
import { PushNotifications, ActionPerformed, PushNotificationSchema } from '@capacitor/push-notifications';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';

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
  templates: CometChatMessageTemplate[] = [];
  public unreadCountUpdated$ = new Subject<void>();
  public contactsConfiguration: ContactsConfiguration;

  constructor(
    private http: HttpClient, 
    private snackBar: MatSnackBar,
    private themeService: CometChatThemeService
  ) { }

  async initializeCometChat(): Promise<void> {
    try {
      const chat_uid = localStorage.getItem('id');
      if (!chat_uid) return;

      const credentials = await this.fetchChatCredentials();
      if (!credentials) return;

      const initialized = await this.initCometChatUIKit(credentials);
      if (!initialized) return;

      const loggedIn = await this.loginCometChatUser(chat_uid);
      if (!loggedIn) return;

      this.createCustomMessageTemplates();

      this.isChatAvailable = true;

      if (Capacitor.isNativePlatform()) {
        await this.initializeAndroidPushNotifications();
      } else {
        await this.initializeWebPushNotifications();
      }

    } catch (error) {
      console.error("Initialization failed with error:", error);
    }
  }

  private async initializeAndroidPushNotifications(): Promise<void> {
    try {      
      const hasPermission = await this.checkAndRequestPermissions();
      if (!hasPermission) {
        return;
      }

      await PushNotifications.register();

      this.setupPushListeners();

      await this.registerFCMWithCometChat();

    } catch (error) {
      console.error('Error initializing Android push notifications:', error);
    }
  }

  private async registerFCMWithCometChat(): Promise<void> {
    try {
      const { token } = await FirebaseMessaging.getToken();
      
      if (token) {
        localStorage.setItem('fcm_token_android', token);
        
        await this.registerPushTokenWithCometChat(token);
        
      }
    } catch (error) {
      console.error('Error getting FCM token:', error);
    }
  }

  private async registerPushTokenWithCometChat(token: string): Promise<void> {
    try {
      
      await CometChatNotifications.registerPushToken(
        token,
        "fcm_android" as any, 
        "chat-notifications" 
      );
      
    } catch (error) {
      console.error('Error registering token with CometChat:', error);
    }
  }

  private async initializeWebPushNotifications(): Promise<void> {
    try {
      const permissionGranted = await this.requestNotificationPermission();
      if (!permissionGranted) return;

      await this.registerPushToken();
      
    } catch (error) {
      console.error("Web push notification error:", error);
    }
  }

  private async checkAndRequestPermissions(): Promise<boolean> {
    try {
      const permStatus = await PushNotifications.checkPermissions();

      if (permStatus.receive !== 'granted') {
        const requestedPerm = await PushNotifications.requestPermissions();
        
        if (requestedPerm.receive !== 'granted') {
          this.openSnackBar('Please enable notifications to receive chat messages', 'Close');
          return false;
        }
      }

      await FirebaseMessaging.requestPermissions();
      
      return true;
    } catch (error) {
      console.error('Error checking permissions:', error);
      return false;
    }
  }

  private setupPushListeners(): void {
    PushNotifications.addListener('pushNotificationReceived', 
      (notification: PushNotificationSchema) => {
        this.handleCometChatNotification(notification);
      }
    );

    FirebaseMessaging.addListener('notificationReceived', (event: any) => {
      this.handleCometChatNotification(event);
    });

    FirebaseMessaging.addListener('tokenReceived', async (event: any) => {
      localStorage.setItem('fcm_token_latest', event.token);

      await this.registerPushTokenWithCometChat(event.token);
    });
  }

  private handleCometChatNotification(notification: any): void {

    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }

    const notificationData = this.extractCometChatData(notification);
  
  }

  private extractCometChatData(notification: any): any {
    const data = notification.data || notification;
    
    if (data['cometchat:message']) {
      try {
        return JSON.parse(data['cometchat:message']);
      } catch (e) {
        return data;
      }
    }
    return data;
  }

  async checkPushStatus(): Promise<void> {
    try {
      
      const token = localStorage.getItem('fcm_token_android');
      
      const permStatus = await PushNotifications.checkPermissions();
      
      if (token && permStatus.receive === 'granted') {
        this.openSnackBar('CometChat push configured - Ready to receive messages', 'OK');
      } else {
        this.openSnackBar('Push configuration incomplete', 'Close');
      }
      
    } catch (error) {
      console.error('Error checking push status:', error);
    }
  }

  async fetchUnreadMessages(): Promise<any[]> {
    let limit = 99;
    let messagesRequest = new CometChat.MessagesRequestBuilder()
      .setUnread(true)
      .setLimit(limit)
      .build();

    try {
      const messages: CometChat.BaseMessage[] = await messagesRequest.fetchPrevious();
      this.unreadCountUpdated$.next();
      return messages;
    } catch (error) {
      console.error("Message fetching failed with error:", error);
      return [];
    }
  }

  private async fetchChatCredentials(): Promise<any | null> {
    try {
      const credentials: any = await firstValueFrom(this.getChatCredentials());
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

  public getChatCredentials(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URI}/chat/`);
  }

  public openSnackBar(message: string, action: string) {
    this.snackBar.open(message, action, {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }

  // Dont allow group owner to edit/delete messages of other members
  private createCustomMessageTemplates() {
    this.templates = CometChatUIKit.getDataSource().getAllMessageTemplates(this.themeService.theme);
    this.templates = this.templates.map(template => {
      const newTemplate = Object.assign(Object.create(Object.getPrototypeOf(template)), template);
      newTemplate.options = (
        loggedInUser: CometChat.User,
        message: CometChat.BaseMessage,
        theme: CometChatTheme,
        group?: CometChat.Group
      ) => {
        let options = CometChatUIKit.getDataSource().getMessageOptions(
          loggedInUser,
          message,
          theme,
          group
        );
        if (
          group &&
          group.getOwner &&
          group.getOwner() === loggedInUser.getUid() &&
          message.getSender().getUid() !== loggedInUser.getUid()
        ) {
          options = options.filter(
            (option: CometChatMessageOption) =>
              option.id !== 'edit' && option.id !== 'delete'
          );
        }
        return options;
      };
      return newTemplate;
    });
  }
}