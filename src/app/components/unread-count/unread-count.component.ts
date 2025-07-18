import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { CometChatUIEvents } from "@cometchat/uikit-resources"
import { CometChatService } from 'src/app/services/apps/chat/chat.service';

@Component({
  selector: 'app-unread-count',
  templateUrl: './unread-count.component.html',
  styleUrls: ['./unread-count.component.scss'],
})
export class UnreadCountComponent implements OnInit, OnDestroy {
  unreadMessageCount = 0;
  private subscriptions = new Subscription();

  constructor(private chatService: CometChatService) {}

  async ngOnInit() {
    let messages = await this.chatService.fetchUnreadMessages();
    this.unreadMessageCount = messages.length;

    this.subscriptions.add(
      this.chatService.unreadCountUpdated$.subscribe(async () => {
        let messages = await this.chatService.fetchUnreadMessages();
        this.unreadMessageCount = messages.length;
      })
    );

    const ccActiveChatChangedSub = CometChatUIEvents.ccActiveChatChanged.subscribe((event: any) => {
      setTimeout(() => {
        this.chatService.fetchUnreadMessages()
          .then((messages: any[]) => {
            this.unreadMessageCount = messages.length;
          })
      }, 1000);
    });
    this.subscriptions.add(ccActiveChatChangedSub);
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}