import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  CUSTOM_ELEMENTS_SCHEMA,
  ViewChild,
  TemplateRef,
  ElementRef,
  HostListener,
  ChangeDetectorRef,
} from '@angular/core';
import { PlansService } from 'src/app/services/plans.service';
import { Plan } from 'src/app/models/Plan.model';
import { CompaniesService } from 'src/app/services/companies.service';
import { EmployeesService } from 'src/app/services/employees.service';
import '@cometchat/uikit-elements';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/material.module';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { LoaderComponent } from 'src/app/components/loader/loader.component';
import { Loader } from 'src/app/app.models';
import { environment } from 'src/environments/environment';
import { MatCardModule } from '@angular/material/card';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { MatSidenav } from '@angular/material/sidenav';
import { MatMenuModule } from '@angular/material/menu';
import { RocketChatService } from 'src/app/services/rocket-chat.service';
import {
  RocketChatRoom,
  RocketChatMessage,
  RocketChatUser,
} from '../../../models/rocketChat.model';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'app-chat',
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatSidenavModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatListModule,
    MatToolbarModule,
    MatDividerModule,
    MatButtonModule,
    MatMenuModule,
  ],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
})
export class AppChatComponent implements OnInit, OnDestroy {
  roomsFilter = '';
  selectedConversation!: RocketChatRoom;
  rooms: RocketChatRoom[] = [];
  messages: RocketChatMessage[] = [];
  newMessage = '';
  isSidebarOpen = true;
  @ViewChild('messagesContainer', { static: false })
  messagesContainer?: ElementRef;
  @ViewChild('sidebar') sidebar!: MatSidenav;
  isMobile = window.innerWidth <= 768;
  defaultAvatarUrl = environment.assets + '/default-profile-pic.png';
  defaultGroupPicUrl = environment.assets + '/group-icon.webp';
  roomPictures: { [roomId: string]: string } = {};
  realtimeSubscription: Subscription | null = null;

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.isMobile = event.target.innerWidth <= 768;
  }

  constructor(protected chatService: RocketChatService) {}

  ngOnInit(): void {
    this.chatService.getRooms().subscribe((rooms: any) => {
      this.rooms = rooms;
      this.loadAllRoomPictures();
      setTimeout(() => this.scrollToBottom(), 100);
    });
  }

  private loadAllRoomPictures() {
    this.rooms.forEach((room) => {
      this.chatService.getConversationPicture(room).subscribe((pictureUrl) => {
        this.roomPictures[room._id] = pictureUrl;
      });
    });
  }

  getConversationPicture(room: RocketChatRoom): string {
    return this.roomPictures[room._id] || this.getDefaultPicture(room);
  }

  private getDefaultPicture(room: RocketChatRoom): string {
    switch (room.t) {
      case 'd':
        return this.defaultAvatarUrl;
      case 'p':
        return this.defaultGroupPicUrl;
      case 'c':
        return this.defaultGroupPicUrl;
      case 'l':
        return this.defaultAvatarUrl;
      default:
        return this.defaultAvatarUrl;
    }
  }

  getUserEmail(): string {
    const emails = this.chatService.loggedInUser?.emails;
    return emails && emails.length > 0 ? emails[0].address : '';
  }

  call() {
    this.chatService
      .initializeJitsiMeeting(this.selectedConversation._id)
      .subscribe((res: any) => {
        if (!res.success) {
          console.error('Error calling room', this.selectedConversation._id);
        }
        window.open(res.callUrl, '_blank');
      });
  }

  joinCall(message: RocketChatMessage) {
    this.chatService.joinJitsiMeeting(message).subscribe((res: any) => {
      if (!res.success) {
        console.error('Error joining room', message.u._id);
      }
      window.open(res.callUrl, '_blank');
    });
  }

  isFromMe(message: RocketChatMessage) {
    return message.u._id === this.chatService.loggedInUser?._id;
  }

  filteredRooms(): RocketChatRoom[] {
    if (!this.roomsFilter) return this.rooms;
    const q = this.roomsFilter.toLowerCase();
    return this.rooms.filter(
      (r) =>
        r?.name?.toLowerCase().includes(q) ||
        r.usernames
          ?.filter(
            (u: string) => u !== this.chatService.loggedInUser?.username
          )[0]
          .includes(q)
    );
  }

  getConversationName(room: RocketChatRoom) {
    switch (room?.t) {
      case 'd': // direct message
        return room.usernames?.filter(
          (u: string) => u !== this.chatService.loggedInUser?.username
        )[0];
      case 'p': // private chat
        return room.name;
      case 'c': // channel
        return room.name;
      case 'l': // livechat
        return 'Inimble Support';
      default:
        return 'Unknown';
    }
  }

  getMessageTimestamp(message: RocketChatMessage): Date {
    if (typeof message.ts === 'string') {
      return new Date(message.ts);
    } else if (message.ts && typeof message.ts === 'object' && '$date' in message.ts) {
      const dateValue = message.ts.$date;
      return new Date(dateValue);
    }
    console.warn('Invalid timestamp format for message:', message._id);
    return new Date();
  }

  async selectRoom(room: RocketChatRoom) {
    this.selectedConversation = room;

    try {
      const { history, realtimeStream } =
        await this.chatService.loadRoomHistoryWithRealtime(room);

      this.messages = history;
      const existingMessageIds = new Set(this.messages.map(msg => msg._id));

      this.realtimeSubscription = realtimeStream.subscribe((newMessage) => {
        if (!existingMessageIds.has(newMessage._id)) {
          this.messages = [...this.messages, newMessage];
          existingMessageIds.add(newMessage._id);
          this.scrollToBottom();
        }
      });
    } catch (error) {
      console.error('Error loading room history:', error);
    }
  }

  loadRoomMessages(room: RocketChatRoom): Observable<RocketChatMessage[]> {
    if (room.t === 'd') {
      return this.chatService.loadDirectMessagesHistory(room._id);
    } else if (room.t === 'p') {
      return this.chatService.getGroupMessagesHistory(room._id);
    } else if (room.t === 'c') {
      return this.chatService.loadChannelMessagesHistory(room._id);
    }
    return of([]);
  }

  getLastMessage(room: RocketChatRoom): string {
    const lastMessage = room.lastMessage;
    switch (lastMessage?.t) {
      case 'videoconf':
        return 'Call started';
      case 'd':
        return lastMessage.msg || 'No messages yet';
      case 'p':
        return lastMessage.msg || 'No messages yet';
      case 'c':
        return lastMessage.msg || 'No messages yet';
      case 'l':
        return lastMessage.msg || 'No messages yet';
      default:
        return lastMessage?.msg || 'No messages yet';
    }
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.selectedConversation) return;

    this.chatService
      .sendMessageWithConfirmation(
        this.selectedConversation._id,
        this.newMessage
      )
      .subscribe({
        next: (result: any) => {
          if (result.success) {
            this.newMessage = '';
          } else {
            console.error('Failed to send message:', result.error);
          }
        },
        error: (error: any) => {
          console.error('Error sending message:', error);
        },
      });
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  private scrollToBottom() {
    try {
      const el = this.messagesContainer?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    } catch (e) {}
  }

  ngOnDestroy() {
    if (this.realtimeSubscription) {
      this.realtimeSubscription.unsubscribe();
    }
    
    if (this.selectedConversation) {
      this.chatService.unsubscribeFromRoomMessages(this.selectedConversation._id);
    }
  }
}
