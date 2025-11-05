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
  private typingSubscription!: Subscription;
  private typingTimeout: any;
  typingUsers: string[] = [];
  isUserTyping = false;

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

// ------------------ TEST ------------------
/**
 * Simulate a typing event for testing
 */
simulateTypingEvent(): void {
  if (!this.selectedConversation) return;
  
  // Simulate another user typing
  this.handleTypingEvent({
    roomId: this.selectedConversation._id,
    username: 'testuser',
    isTyping: true
  });
  
  // Auto clear after 2 seconds
  setTimeout(() => {
    this.handleTypingEvent({
      roomId: this.selectedConversation._id,
      username: 'testuser',
      isTyping: false
    });
  }, 2000);
}

/**
 * Clear all typing indicators
 */
clearTyping(): void {
  this.typingUsers = [];
  this.isUserTyping = false;
  console.log('🧹 Cleared all typing indicators');
}

testTypingSubscription(roomId: string): void {
  console.log('🧪 Testing typing subscription for room:', roomId);
  
  // First, make sure we're subscribed to typing events
  this.chatService.subscribeToTypingEvents(roomId);
  
  // Wait a bit for subscription to establish, then test
  setTimeout(() => {
    console.log('🧪 Sending test typing notification');
    this.chatService.startTyping(roomId);
    
    // Also test receiving typing events by simulating one
    setTimeout(() => {
      console.log('🧪 Simulating received typing event');
      // This simulates what we should receive from the server
      this.handleTypingEvent({
        roomId: roomId,
        username: this.chatService.loggedInUser?.username || 'TestUser',
        isTyping: true
      });
    }, 1000);
    
  }, 1000);
  
  // Stop typing after 3 seconds
  setTimeout(() => {
    console.log('🧪 Stopping test typing notification');
    this.chatService.stopTyping(roomId);
  }, 4000);
}
// ------------------ TEST ------------------

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
    } else if (
      message.ts &&
      typeof message.ts === 'object' &&
      '$date' in message.ts
    ) {
      const dateValue = message.ts.$date;
      return new Date(dateValue);
    }
    console.warn('Invalid timestamp format for message:', message._id);
    return new Date();
  }

  async selectRoom(room: any) {
    // Unsubscribe from previous subscriptions
    if (this.realtimeSubscription) {
      this.realtimeSubscription.unsubscribe();
    }
    if (this.typingSubscription) {
      this.typingSubscription.unsubscribe();
    }

    // Unsubscribe from previous room if any
    if (this.selectedConversation) {
      this.chatService.unsubscribeFromRoomMessages(
        this.selectedConversation._id
      );
      this.chatService.unsubscribeFromTypingEvents(
        this.selectedConversation._id
      );
    }

    this.selectedConversation = room;
    this.typingUsers = []; // Clear typing users when switching rooms

    try {
      const { history, realtimeStream, typingStream } =
        await this.chatService.loadRoomHistoryWithRealtime(room);

      // Load historical messages
      this.messages = history;
      const existingMessageIds = new Set(this.messages.map((msg) => msg._id));

      // Subscribe to real-time messages
      this.realtimeSubscription = realtimeStream.subscribe({
        next: (newMessage) => {
          if (!existingMessageIds.has(newMessage._id)) {
            this.messages = [...this.messages, newMessage];
            existingMessageIds.add(newMessage._id);
            this.scrollToBottom();
          }
        },
        error: (error) => {
          console.error('Error in real-time stream:', error);
        },
      });

      // Subscribe to typing events
      this.typingSubscription = typingStream.subscribe({
        next: (typingEvent) => {
          console.log('TYPING EVENT RECEIVED:', typingEvent);
          this.handleTypingEvent(typingEvent);
        },
        error: (error) => {
          console.error('Error in typing stream:', error);
        },
      });
    } catch (error) {
      console.error('Error loading room history:', error);
    }
  }

  private handleTypingEvent(event: {
    roomId: string;
    username: string;
    isTyping: boolean;
  }): void {
    if (event.roomId !== this.selectedConversation?._id) return;

    console.log(`⌨️ Handling typing event: ${event.username} is ${event.isTyping ? 'typing' : 'not typing'}`);

    if (event.isTyping) {
      // Add user to typing list if not already there
      if (!this.typingUsers.includes(event.username)) {
        this.typingUsers.push(event.username);
        console.log('✅ Added user to typing list:', event.username);
      }
    } else {
      // Remove user from typing list
      this.typingUsers = this.typingUsers.filter(
        (user) => user !== event.username
      );
      console.log('❌ Removed user from typing list:', event.username);
    }

    // Update typing indicator
    this.isUserTyping = this.typingUsers.length > 0;
    console.log('📊 Current typing users:', this.typingUsers);

    // Clear any existing timeout for this user
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    // Auto-remove typing indicator after 3 seconds (fallback)
    if (event.isTyping) {
      this.typingTimeout = setTimeout(() => {
        console.log('⏰ Typing timeout, removing user:', event.username);
        this.typingUsers = this.typingUsers.filter(
          (user) => user !== event.username
        );
        this.isUserTyping = this.typingUsers.length > 0;
      }, 3000);
    }
  }

  /**
   * Handle input events for typing indicator
   */
  onMessageInput(): void {
    if (!this.selectedConversation) return;

    // Clear existing timeout
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    // Start typing notification
    this.chatService.startTyping(this.selectedConversation._id);

    // Set timeout to stop typing after user stops typing for 1 second
    this.typingTimeout = setTimeout(() => {
      this.chatService.stopTyping(this.selectedConversation._id);
    }, 1000);
  }

  /**
   * Get typing indicator text
   */
  getTypingText(): string {
    if (this.typingUsers.length === 0) return '';

    if (this.typingUsers.length === 1) {
      return `${this.typingUsers[0]} is typing...`;
    } else if (this.typingUsers.length === 2) {
      return `${this.typingUsers[0]} and ${this.typingUsers[1]} are typing...`;
    } else {
      return `${this.typingUsers[0]} and ${
        this.typingUsers.length - 1
      } others are typing...`;
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

    // Stop typing when sending message
    this.chatService.stopTyping(this.selectedConversation._id);
    this.typingUsers = [];

    this.chatService
      .sendMessageWithConfirmation(
        this.selectedConversation._id,
        this.newMessage
      )
      .subscribe({
        next: (result) => {
          if (result.success) {
            this.newMessage = '';
          } else {
            console.error('Failed to send message:', result.error);
          }
        },
        error: (error) => {
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

  ngOnDestroy(): void {
    // Clean up subscriptions
    if (this.realtimeSubscription) {
      this.realtimeSubscription.unsubscribe();
    }
    if (this.typingSubscription) {
      this.typingSubscription.unsubscribe();
    }

    // Unsubscribe from current room
    if (this.selectedConversation) {
      this.chatService.unsubscribeFromRoomMessages(
        this.selectedConversation._id
      );
      this.chatService.unsubscribeFromTypingEvents(
        this.selectedConversation._id
      );
    }

    // Clear typing timeout
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
  }
}
