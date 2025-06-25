import { Component, OnInit } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { Subscription } from 'rxjs';
import { CometChatUIEvents } from "@cometchat/uikit-resources"

@Component({
  selector: 'app-unread-count',
  templateUrl: './unread-count.component.html',
  styleUrls: ['./unread-count.component.scss'],
})
export class UnreadCountComponent implements OnInit {
  unreadMessageCount = 0;
  public ccActiveChatChanged: Subscription;

  constructor() {}

  ngOnInit() {
    this.fetchUnreadMessages();

    CometChat.addMessageListener(
      "UNIQUE_LISTENER_ID",
      new CometChat.MessageListener({
        onTextMessageReceived: () => this.fetchUnreadMessages(),
        onMediaMessageReceived: () => this.fetchUnreadMessages(),
        onCustomMessageReceived: () => this.fetchUnreadMessages(),
        onInteractiveMessageReceived: () => this.fetchUnreadMessages(),
        onTransientMessageReceived: () => this.fetchUnreadMessages(),
        onMessagesRead: () => this.fetchUnreadMessages(),
      })
    );

    this.ccActiveChatChanged = CometChatUIEvents.ccActiveChatChanged.subscribe((event: any) => {
      setTimeout(() => {
        this.fetchUnreadMessages();
      }, 1000);
    });
  }

  fetchUnreadMessages() {
    let limit = 99;
    let messagesRequest = new CometChat.MessagesRequestBuilder()
      .setUnread(true)
      .setLimit(limit)
      .build();

    messagesRequest.fetchPrevious().then(
      (messages: CometChat.BaseMessage[]) => {
        this.unreadMessageCount = messages.length;
      },
      (error: CometChat.CometChatException) => {
        console.error("Message fetching failed with error:", error);
      }
    );
  }
}