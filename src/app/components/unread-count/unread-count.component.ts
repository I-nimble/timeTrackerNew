import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { RocketChatService } from 'src/app/services/rocket-chat.service';

@Component({
  selector: 'app-unread-count',
  templateUrl: './unread-count.component.html',
  styleUrls: ['./unread-count.component.scss'],
})
export class UnreadCountComponent implements OnInit, OnDestroy {
  unreadMessageCount = 0;
  private subscriptions: Subscription[] = [];

  constructor(private chatService: RocketChatService) {}

  ngOnInit() {
    this.refreshUnread();

    const liveSub = this.chatService.getUserNotifyStream().subscribe(() => {
      this.refreshUnread();
    });
    this.subscriptions.push(liveSub);

    const activeSub = this.chatService.getActiveRoomStream().subscribe((roomId) => {
      if (!roomId) return;
      this.chatService.setUnreadForRoom(roomId, 0);
      this.refreshUnread();
    });
    this.subscriptions.push(activeSub);

    const mapSub = this.chatService.getUnreadMapStream().subscribe((map) => {
      this.unreadMessageCount = Object.values(map).reduce((acc, value) => acc + (value || 0), 0);
    });
    this.subscriptions.push(mapSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  private refreshUnread(): void {
    const refreshSub = this.chatService.refreshUnreadFromCurrentUserRooms().subscribe();
    this.subscriptions.push(refreshSub);
  }
}