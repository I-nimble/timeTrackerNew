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
      this.setContactsConfiguration();

      this.isChatAvailable = true;

      const permissionGranted = await this.requestNotificationPermission();
      if (!permissionGranted) return;

      await this.registerPushToken();

    } catch (error) {
      console.error("Initialization failed with error:", error);
    }
  }

  setContactsConfiguration(): void {
    const friendsRequestBuilder = new CometChat.UsersRequestBuilder()
      .setLimit(100)
      .friendsOnly(true);

    this.contactsConfiguration = new ContactsConfiguration({
      usersConfiguration: new UsersConfiguration({
        usersRequestBuilder: friendsRequestBuilder,
        hideSeparator: true
      })
    });
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