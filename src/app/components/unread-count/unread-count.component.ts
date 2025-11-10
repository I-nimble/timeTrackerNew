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

  async ngOnInit() {
    const sub = this.chatService.getAllSubscriptions().subscribe({
      next: (res) => {
        try {
          const payload = res?.update || res?.subscriptions || res;
          let subsArray = Array.isArray(payload) ? payload : [payload];

          if (subsArray[0] && subsArray[0].update && Array.isArray(subsArray[0].update)) {
            subsArray = subsArray[0].update;
          }

          this.chatService.updateUnreadFromSubscriptions(subsArray);
        } catch (err) {
          console.error('Error parsing initial subscriptions response', err, res);
        }
      },
      error: (err) => {
        console.error('Error getting unread messages:', err);
      },
    });
    this.subscriptions.push(sub);

    try {
      await this.chatService.subscribeToUserNotifications('subscriptions-changed');
    } catch (err) {
      console.error('Failed to subscribe to user notifications:', err);
    }

    const liveSub = this.chatService.getUserNotifyStream().subscribe({
      next: (res) => {
        try {
          const args = res?.fields?.args;

          const payloadCandidate = Array.isArray(args) && args.length > 1 ? args[1] : (Array.isArray(args) ? args[0] : args);

          let subs = [] as any[];

          if (payloadCandidate) {
            if (Array.isArray(payloadCandidate)) {
              subs = payloadCandidate;
            } else if (payloadCandidate.update && Array.isArray(payloadCandidate.update)) {
              subs = payloadCandidate.update;
            } else if (payloadCandidate.subscriptions && Array.isArray(payloadCandidate.subscriptions)) {
              subs = payloadCandidate.subscriptions;
            } else if (typeof payloadCandidate === 'object' && ('unread' in payloadCandidate || '_id' in payloadCandidate || 'rid' in payloadCandidate)) {
              subs = [payloadCandidate];
            }
          }

          if (subs.length > 0) {
            this.chatService.updateUnreadFromSubscriptions(subs);
          } else {
            const eventName = res?.fields?.eventName || '';
            const ridFromPayload = payloadCandidate && typeof payloadCandidate === 'object' ? (payloadCandidate.rid || payloadCandidate.roomId || null) : null;
            if (ridFromPayload) {
              this.chatService.incrementUnreadForRoom(ridFromPayload, 1);
            } else if (/message|notification/i.test(eventName)) {
              this.chatService.incrementUnreadForRoom('unknown', 1);
            }
          }
        } catch (err) {
          console.error('Error handling user notify stream message:', err, res);
        }
      },
      error: (err) => {
        console.error('User notify stream error:', err);
      },
    });
    this.subscriptions.push(liveSub);
    const activeSub = this.chatService.getActiveRoomStream().subscribe((roomId) => {
      try {
        if (!roomId) return;
        this.chatService.setUnreadForRoom(roomId, 0);
        this.chatService.setUnreadForRoom('unknown', 0);
      } catch (err) {
        console.error('Error handling active room change:', err, roomId);
      }
    });
    this.subscriptions.push(activeSub);

    const mapSub = this.chatService.getUnreadMapStream().subscribe((map) => {
      try {
        this.unreadMessageCount = Object.values(map).reduce((acc, v) => acc + (v || 0), 0);
      } catch (err) {
        console.error('Error reducing unread map:', err, map);
      }
    });
    this.subscriptions.push(mapSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
    try {
      this.chatService.unsubscribeUserNotifications('subscriptions-changed');
    } catch (err) {
      console.error('Failed to unsubscribe from user notifications:', err);
    }
  }
}