import { Injectable } from '@angular/core';
import { UIKitSettingsBuilder } from "@cometchat/uikit-shared";
import { CometChatUIKit } from "@cometchat/chat-uikit-angular";

const COMETCHAT_CONSTANTS = {
  APP_ID: "270688328e214865",
  REGION: "us",
  AUTH_KEY: "a10a89bdee324305d1a76e25203ca1aceaad9e9a",
  UID: "cometchat-uid-1"
};

@Injectable({
  providedIn: 'root',
})
export class CometChatService {
  private UIKitSettings = new UIKitSettingsBuilder()
    .setAppId(COMETCHAT_CONSTANTS.APP_ID)
    .setRegion(COMETCHAT_CONSTANTS.REGION)
    .setAuthKey(COMETCHAT_CONSTANTS.AUTH_KEY)
    .subscribePresenceForAllUsers()
    .build();

  async initializeCometChat(): Promise<void> {
    try {
      await CometChatUIKit.init(this.UIKitSettings);
      console.log("Initialization completed successfully");
      this.login(COMETCHAT_CONSTANTS.UID);
    } catch (error) {
      console.error("Initialization failed with error:", error);
    }
  }

  async login(UID: string): Promise<void> {
    try {
      const user = await CometChatUIKit.getLoggedinUser();
      if (!user) {
        const loggedInUser = await CometChatUIKit.login({ uid: UID });
        console.log("Login Successful:", { user: loggedInUser });
      }
    } catch (error) {
      console.error("Login failed with error:", error);
      throw error;
    }
  }
}