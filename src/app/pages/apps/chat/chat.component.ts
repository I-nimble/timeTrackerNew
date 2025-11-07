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
import { CreateRoomComponent } from './create-room/create-room.component';
import { ChatInfoComponent } from './chat-info/chat-info.component';
import {
  RocketChatRoom,
  RocketChatMessage,
  RocketChatUser,
  RocketChatMessageAttachment
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
    CreateRoomComponent,
    ChatInfoComponent
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
  @ViewChild('infoSidebar') infoSidebar!: MatSidenav;
  selectedUserInfo: any = null;
  channelMembers: any[] = [];
  defaultAvatarUrl = environment.assets + '/default-profile-pic.png';
  defaultGroupPicUrl = environment.assets + '/group-icon.webp';
  roomPictures: { [roomId: string]: string } = {};
  realtimeSubscription: Subscription | null = null;
  unreadMapSubscription: Subscription | null = null;
  private roomSubscriptions = new Map<string, Subscription>();
  rocketChatS3Bucket: string = environment.rocketChatS3Bucket;
  isSendingMessage = false;

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.isMobile = event.target.innerWidth <= 768;
  }

  constructor(protected chatService: RocketChatService, private dialog: MatDialog, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadRooms();
    try {
      this.realtimeSubscription = this.chatService.getMessageStream().subscribe((message: RocketChatMessage) => {
        try {
          if (!message || !message.rid) return;
          const room = this.rooms.find(r => r._id === message.rid);
          if (room) {
            (room as any).lastMessage = message;
            (room as any).lastMessageTs = message.ts || (room as any).ts || message.ts;
            this.moveRoomToTop(message.rid);
          }
        } catch (err) {
          console.error('Error updating room lastMessage from global stream:', err, message);
        }
      });
    } catch (err) {
      console.error('Failed to subscribe to global message stream:', err);
    }

    try {
      this.unreadMapSubscription = this.chatService.getUnreadMapStream().subscribe(() => {
        this.sortRoomsByUnread();
      });
    } catch (err) {
      console.error('Failed to subscribe to unread map stream:', err);
    }
  }

  private loadRooms(): void {
    this.chatService.getRooms().subscribe({
      next: (rooms: any) => {
        this.rooms = rooms;
        this.sortRoomsByUnread();
        this.loadAllRoomPictures();
        setTimeout(() => this.scrollToBottom(), 100);
      },
      error: (err) => {
        console.error('Error loading rooms:', err);
      },
    });
  }

  private loadAllRoomPictures() {
    this.rooms.forEach((room) => {
      this.chatService.getConversationPicture(room).subscribe((pictureUrl) => {
        this.roomPictures[room._id] = pictureUrl;
      });
    });
  }

  getConversationPicture(room?: RocketChatRoom): string {
    return this.roomPictures[room?._id || ''] || this.getDefaultPicture(room!);
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

  getInfoTitle(): string {
    if (!this.selectedConversation) return 'Info';

    switch (this.selectedConversation.t) {
      case 'd': return 'Contact Info';
      case 'c': return 'Channel Info';
      case 'p': return 'Team Info';
      case 'l': return 'Support Info';
      default: return 'Info';
    }
  }

  private hasAnyRole(roles: string[]): boolean {
    const userRoles = this.chatService.loggedInUser?.roles || [];
    return userRoles.some(r => roles.includes(r));
  }

  canCreateTeam(): boolean {
    return this.hasAnyRole(['moderator', 'admin']);
  }

  canCreateChannel(): boolean {
    return this.hasAnyRole(['leader']);
  }

  canCreateDirectMessage(): boolean {
    return this.hasAnyRole(['user']);
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


  getAttachmentType(attachment: RocketChatMessageAttachment): 'image' | 'video' | 'audio' | 'file' {
    if (!attachment) return 'file';

    if (attachment.image_url) return 'image';
    if (attachment.video_url) return 'video';
    if (attachment.audio_url) return 'audio';
    return 'file';
  }

async downloadFile(attachment: RocketChatMessageAttachment) {
  const fullFileName = attachment.image_url || attachment.video_url || attachment.audio_url || attachment.title_link;
  if (!fullFileName) return;

  const fileNameInS3 = fullFileName.split('/')[2];
  const groupId = this.selectedConversation?._id;
  
  if (!groupId) return;

  const segment1 = groupId;
  const segment2 = groupId.substring(17);
  const downloadUrl = `${this.rocketChatS3Bucket}/uploads/${segment1}/${segment2}/${fileNameInS3}`;
  const originalFileName = attachment.title || fileNameInS3;

  try {
    // Fetch the file and convert to blob
    const response = await fetch(downloadUrl);
    const blob = await response.blob();
    
    // Create object URL from blob
    const blobUrl = window.URL.createObjectURL(blob);
    
    // Create download link
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = originalFileName; // This forces download
    
    // Append to body, click, and clean up
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the blob URL
    window.URL.revokeObjectURL(blobUrl);
    
  } catch (error) {
    console.error('Download failed:', error);
    // Fallback to opening in new tab
    window.open(downloadUrl, '_blank');
  }
}

  selectFile() {
    this.isSendingMessage = true;
    const input = document.createElement('input');
    input.type = 'file';
    input.click();
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      const roomId = this.selectedConversation?._id;
      if (file) {
        this.chatService.uploadFile(file, roomId).subscribe({
          next: (res: any) => {
            if (!res.success) {
              console.error('Failed to upload file:', res.error);
              return;
            }
            
            const fileType = file.type.split('/')[0];
            const attachment: RocketChatMessageAttachment = {
              title: file.name,
              title_link: res.file.url,
              title_link_download: true,
              ts: new Date().toISOString(),
              
              ...(fileType === 'image' && { 
                image_url: res.file.url,
                thumb_url: res.file.url 
              }),
              ...(fileType === 'video' && { 
                video_url: res.file.url 
              }),
              ...(fileType === 'audio' && { 
                audio_url: res.file.url 
              }),
              
              ...(!['image', 'video', 'audio'].includes(fileType) && {
                text: `File: ${file.name} (${this.formatFileSize(file.size)})`
              })
            };

            this.chatService.sendMessage(roomId, '', [attachment]).subscribe({
              next: (res: any) => {
                this.isSendingMessage = false;
              },
              error: (err: any) => {
                console.error('Error sending message with attachment:', err);
                this.isSendingMessage = false;
              }
            });
          },
          error: (err: any) => {
            console.error('Error uploading file:', err);
            this.isSendingMessage = false;
          }
        });
      }
    };
  }

  getFileUrl(attachment: RocketChatMessageAttachment) {
    const fullFileName = attachment.image_url || attachment.video_url || attachment.audio_url || attachment.title_link;
    if (!fullFileName) return;

    const fileNameInS3 = fullFileName.split('/')[2];
    const groupId = this.selectedConversation?._id;
    const segment1 = groupId;
    const segment2 = groupId.substring(17);

    return `${this.rocketChatS3Bucket}/uploads/${segment1}/${segment2}/${fileNameInS3}`;
  }

  // Helper method to format file size
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  openCreateRoomDialog(type: 'd' | 'c' | 't') {
    const dialogRef = this.dialog.open(CreateRoomComponent, {
      width: '400px',
      data: { type },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) {
        this.loadRooms();
      }
    });
  }

  loadUserInfo(username: string) {
    this.chatService.getUserInfo(username).subscribe(user => {
      this.selectedUserInfo = {
        ...user,
        email: user.emails?.[0]?.address,
        avatarUrl: this.chatService.getUserAvatarUrl(user.username)
      };
    });
  }

  loadChannelMembers(roomId: string, type: 'c' | 'p') {
    this.chatService.getRoomMembers(roomId, type).subscribe(members => {
      this.channelMembers = members.map(m => ({
        ...m,
        avatarUrl: this.chatService.getUserAvatarUrl(m.username)
      }));
    });
  }
  
  openInfoDialog() {
    if (!this.selectedConversation) return;

    const room = this.selectedConversation;

    if (room.t === 'd') {
      const otherUsername = room.usernames?.find(
        u => u !== this.chatService.loggedInUser?.username
      );
      if (otherUsername) {
        this.chatService.getUserInfo(otherUsername).subscribe(user => {
          const userInfo = {
            ...user,
            email: user.emails?.[0]?.address,
            avatarUrl: this.chatService.getUserAvatarUrl(user.username)
          };

          this.dialog.open(ChatInfoComponent, {
            width: this.isMobile ? '95vw' : '400px',
            maxWidth: '95vw',
            data: {
              conversation: room,
              userInfo,
              channelMembers: []
            },
            panelClass: 'chat-info-dialog'
          });
        });
      }
    } else if (room.t === 'c' || room.t === 'p') {
      this.chatService.getRoomMembers(room._id, room.t).subscribe(members => {
        const enrichedMembers = members.map(m => ({
          ...m,
          avatarUrl: this.chatService.getUserAvatarUrl(m.username)
        }));

        this.dialog.open(ChatInfoComponent, {
          width: this.isMobile ? '95vw' : '400px',
          maxWidth: '95vw',
          data: {
            conversation: room,
            userInfo: null,
            channelMembers: enrichedMembers
          },
          panelClass: 'chat-info-dialog'
        });
      });
    }
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

  getUnreadMessageCount(room: RocketChatRoom): number {
    if (!room) return 0;
    try {
      const count = this.chatService.getUnreadForRoom(room._id);
      return count || 0;
    } catch (err) {
      console.error('Error reading unread count from service for room', room._id, err);
      return 0;
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

  getSenderAvatar(message: RocketChatMessage): string {
    if (this.isFromMe(message)) {
      return this.chatService.loggedInUser?.avatarUrl || this.defaultAvatarUrl;
    }
    return this.chatService.getUserAvatarUrl(message.u.username);
  }
    
  getSenderName(message: RocketChatMessage): string {
    return message.u?.name || message.u?.username || 'Unknown';
  }

  async selectRoom(room: RocketChatRoom) {
    this.selectedConversation = room;

    try {
      this.chatService.setActiveRoom(room._id);
    } catch (err) {
      console.error('Failed to notify active room:', err);
    }

    try {
      this.chatService.markChannelAsRead(room._id);
    } catch (err) {
      console.error('Failed to mark channel as read:', err);
    }

    if (this.roomSubscriptions.has(room._id)) {
      this.roomSubscriptions.get(room._id)?.unsubscribe();
    }

    const { history, realtimeStream } = await this.chatService.loadRoomHistoryWithRealtime(room);

    this.messages = history;
    const existingMessageIds = new Set(this.messages.map(msg => msg._id));

    const sub = realtimeStream.subscribe((newMessage) => {
      if (!existingMessageIds.has(newMessage._id)) {
        this.messages = [...this.messages, newMessage];
        existingMessageIds.add(newMessage._id);
        this.scrollToBottom();
        try {
          this.chatService.setUnreadForRoom(room._id, 0);
        } catch (e) {}
        try {
          const roomIdx = this.rooms.findIndex(r => r._id === room._id);
          if (roomIdx !== -1) {
            (this.rooms[roomIdx] as any).lastMessage = newMessage;
            (this.rooms[roomIdx] as any).lastMessageTs = newMessage.ts || (this.rooms[roomIdx] as any).ts;
            this.moveRoomToTop(room._id);
          }
        } catch (err) {
          console.error('Error updating room lastMessage after realtime message:', err, newMessage);
        }
      }
    });
    this.roomSubscriptions.set(room._id, sub);

    try {
      this.chatService.markChannelAsRead(room._id).subscribe({
        next: (res: any) => {
          try {
            this.chatService.setUnreadForRoom(room._id, 0);
          } catch (e) {}

          try {
            this.chatService.getAllSubscriptions().subscribe({
              next: (sres: any) => {
                try {
                  const payload = sres?.update || sres?.subscriptions || sres;
                  const subsArray = Array.isArray(payload) ? payload : [payload];
                  this.chatService.updateUnreadFromSubscriptions(subsArray);
                } catch (e) {
                  console.error('Error updating unread from subscriptions after mark-as-read:', e, sres);
                }
              },
              error: (e) => console.error('Failed to refresh subscriptions after mark-as-read:', e)
            });
          } catch (e) {
            console.error('Error calling getAllSubscriptions after markChannelAsRead:', e);
          }
        },
        error: (err) => {
          console.error('Failed to mark room as read on server:', err);
        }
      });
    } catch (err) {
      console.error('Error calling markChannelAsRead:', err);
    }

    if (room.t === 'd') {
      const otherUsername = room.usernames?.find(
        u => u !== this.chatService.loggedInUser?.username
      );
      if (otherUsername) this.loadUserInfo(otherUsername);
      this.channelMembers = [];
    } else if (room.t === 'c' || room.t === 'p') {
      this.loadChannelMembers(room._id, room.t);
      this.selectedUserInfo = null;
    }

    setTimeout(() => this.scrollToBottom(), 100);
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
    this.isSendingMessage = true;

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
          this.isSendingMessage = false;
        },
        error: (error: any) => {
          console.error('Error sending message:', error);
          this.isSendingMessage = false;
        },
      });
  }
  
  getLocalTime(offset: number | undefined): string {
    if (offset === undefined || offset === null) return '';

    const now = new Date();
    const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
    const local = new Date(utcTime + offset * 3600000);
    return local.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
    try {
      this.chatService.setActiveRoom(null);
    } catch (err) {}
    if (this.realtimeSubscription) {
      this.realtimeSubscription.unsubscribe();
    }
    if (this.unreadMapSubscription) {
      this.unreadMapSubscription.unsubscribe();
    }
    if (this.selectedConversation) {
      this.chatService.unsubscribeFromRoomMessages(this.selectedConversation._id);
    }
  }

  private sortRoomsByUnread(): void {
    try {
      this.rooms.sort((a, b) => {
        const aUnread = this.chatService.getUnreadForRoom(a._id) || 0;
        const bUnread = this.chatService.getUnreadForRoom(b._id) || 0;
        if (aUnread !== bUnread) return bUnread - aUnread;

        const aTs = a.lastMessage ? this.getMessageTimestamp(a.lastMessage).getTime() : 0;
        const bTs = b.lastMessage ? this.getMessageTimestamp(b.lastMessage).getTime() : 0;
        return bTs - aTs;
      });
      this.rooms = [...this.rooms];
    } catch (err) {
      console.error('Error sorting rooms by unread:', err);
    }
  }

  private moveRoomToTop(roomId: string): void {
    try {
      const idx = this.rooms.findIndex(r => r._id === roomId);
      if (idx === -1) return;
      const [room] = this.rooms.splice(idx, 1);
      this.rooms.unshift(room);
      this.rooms = [...this.rooms];
      try { this.cdr.detectChanges(); } catch (e) {}
    } catch (err) {
      console.error('Error moving room to top:', err, roomId);
    }
  }
}
