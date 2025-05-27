import { Injectable } from '@angular/core';
import { UIKitSettingsBuilder } from "@cometchat/uikit-shared";
import { CometChatUIKit } from "@cometchat/chat-uikit-angular";
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class CometChatService {
  private UIKitSettings!: any;
  API_URI = environment.apiUrl;

  constructor(private http: HttpClient) { }

  async initializeCometChat(): Promise<void> {
    try {
      const chat_uid = localStorage.getItem('id');
      if (chat_uid) {
        // Fetch credentials first
        const credentials: any = await firstValueFrom(this.getChatCredentials());
        if(!credentials) {
          console.log("No chat credentials found in the database.");
          return;
        }

        this.UIKitSettings = new UIKitSettingsBuilder()
          .setAppId(credentials.app_id)
          .setRegion("us")
          .setAuthKey(credentials.auth_key)
          .subscribePresenceForAllUsers()
          .build();

        await CometChatUIKit.init(this.UIKitSettings);
        // Now login the user
        await this.login(chat_uid);

        console.log("Initialization completed successfully");
      }
    } catch (error) {
      console.error("Initialization failed with error:", error);
    }
  }

  async login(UID: string): Promise<void> {
    try {
      const user = await CometChatUIKit.getLoggedinUser();
      if (!user) {
        await CometChatUIKit.login({ uid: UID });
      }
    } catch (error) {
      console.error("Login failed with error:", error);
      throw error;
    }
  }

  public getChatCredentials(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URI}/chat/`);
  }
}