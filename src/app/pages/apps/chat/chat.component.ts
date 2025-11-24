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
import { JitsiMeetComponent } from '../../../components/jitsi-meet/jitsi-meet.component';
import {
  RocketChatRoom,
  RocketChatMessage,
  RocketChatUser,
  RocketChatMessageAttachment
} from '../../../models/rocketChat.model';
import { Observable, of } from 'rxjs';
import { PlatformPermissionsService } from '../../../services/permissions.service';
import { ModalComponent } from 'src/app/components/confirmation-modal/modal.component';

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
  private serverUpdatedSubscription: Subscription | null = null;
  private typingSubscription!: Subscription;
  private typingTimeout: any;
  typingUsers: string[] = [];
  isUserTyping = false;
  unreadMapSubscription: Subscription | null = null;
  private roomSubscriptions = new Map<string, Subscription>();
  rocketChatS3Bucket: string = environment.rocketChatS3Bucket;
  isSendingMessage = false;
  editingMessage: RocketChatMessage | null = null;
  replyToMessage: RocketChatMessage | null = null;
  pressedMessageId: string | null = null;
  private touchTimer: any = null;
  userNameCache = new Map<string, string>();

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.isMobile = event.target.innerWidth <= 768;
  }

  constructor(protected chatService: RocketChatService, private dialog: MatDialog, private cdr: ChangeDetectorRef, private snackBar: MatSnackBar, private permissionsService: PlatformPermissionsService, private confirmationModal: MatDialog) {}

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
          else {
            this.loadRooms();
          }
        } catch (err) {
          console.error('Error updating room lastMessage from global stream:', err, message);
        }
      });
    } catch (err) {
      console.error('Failed to subscribe to global message stream:', err);
    }

    // listen for low-level room notify events (deleteMessage, editMessage) and handle them
    try {
      this.chatService.getRoomUpdateStream().subscribe((ev: any) => {
        try {
          if (!ev || !ev.collection) return;
          if (ev.collection === 'stream-notify-room' && ev.fields && ev.fields.eventName && Array.isArray(ev.fields.args)) {
            const eventName: string = ev.fields.eventName;
            const args = ev.fields.args;
            if (eventName.includes('/deleteMessage')) {
              const roomId = eventName.split('/')[0];
              if (this.selectedConversation && this.selectedConversation._id === roomId) {
                const maybeId = args?.[0]?._id || args?.[0]?.messageId || null;
                if (maybeId) {
                  this.messages = this.messages.filter((m) => m._id !== maybeId);
                  this.cdr.detectChanges();
                } else if (this.selectedConversation) {
                  this.loadRoomMessages(this.selectedConversation).subscribe((msgs) => {
                    this.messages = msgs || [];
                    this.sortMessagesAscending();
                    this.cdr.detectChanges();
                  });
                }
              }
            }
          }

          if (ev.collection === 'stream-room-messages' && ev.fields && ev.fields.eventName && Array.isArray(ev.fields.args)) {
            const args = ev.fields.args;
            const maybeMsg = args?.[0];
            if (!maybeMsg || !maybeMsg._id) return;
            const roomId = (ev.fields.eventName || '').split('/')[0];
            if (!this.selectedConversation || this.selectedConversation._id !== roomId) return;

            const incoming: RocketChatMessage = maybeMsg as RocketChatMessage;
            const idx = this.messages.findIndex(m => m._id === incoming._id);
            if (idx !== -1) {
              this.messages[idx] = { ...this.messages[idx], ...incoming };
            } else {
              this.messages.push(incoming);
            }
            this.sortMessagesAscending();
            this.cdr.detectChanges();
          }
        } catch (err) {
          console.error('Error handling room update event in component:', err, ev);
        }
      });
    } catch (err) {
      console.error('Failed to subscribe to room update stream:', err);
    }

    try {
      this.unreadMapSubscription = this.chatService.getUnreadMapStream().subscribe(() => {
        this.sortRoomsByUnread();
      });
    } catch (err) {
      console.error('Failed to subscribe to unread map stream:', err);
    }

    // reload messages when server sends an 'updated' notification
    try {
      this.serverUpdatedSubscription = this.chatService.getServerUpdatedStream().subscribe((methods: any) => {
        try {
          if (!this.selectedConversation) return;
          this.loadRoomMessages(this.selectedConversation).subscribe((msgs) => {
            this.messages = msgs || [];
            this.sortMessagesAscending();
            this.cdr.detectChanges();
            this.scrollToBottom();
          }, (err) => {
            console.error('Failed to reload room messages after server updated event:', err);
          });
        } catch (err) {
          console.error('Error handling server updated event in component:', err, methods);
        }
      });
    } catch (err) {
      console.error('Failed to subscribe to server updated stream:', err);
    }
  }

  private loadRooms(): void {
    this.chatService.getRooms().subscribe({
      next: (rooms: any) => {
        this.rooms = rooms;
        this.sortRoomsByUnread();
        this.loadAllRoomPictures();
        this.scrollToBottom();
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

  isSystemMessage(message: RocketChatMessage): boolean {
    const systemTypes = [
      'rm', 'r',
      'uj', 'ul', 'ult', 'ru',
      'au',
      'added-user-to-team',
      'removed-user-from-team',
      'user-added-room-to-team',
      'user-deleted-room-from-team',    
      'room_changed_name',
      'room_changed_description',
      'room_changed_avatar',
      'message_pinned',
    ];
    return systemTypes.includes(message.t || '');
  }
  
  formatSystemMessage(message: RocketChatMessage): string {
    const actor = this.getDisplayName(message.u);
    const target = message.msg || '';

    switch (message.t) {
      case 'rm':
        return `${actor} removed a message`;
      case 'uj':
        return `${actor} joined the room`;
      case 'ul':
      case 'ult':
        return `${actor} left the room`;
      case 'ru':
        return `${actor} removed user ${target}`;
      case 'au':
        return `${actor} added user ${target}`;
      case 'added-user-to-team':
        return `${actor} added user ${target} to the team`;
      case 'removed-user-from-team':
        return `${actor} removed user ${target} from the team`;
      case 'user-added-room-to-team':
        return `${actor} added room ${target} to the team`;
      case 'user-deleted-room-from-team':
        return `${actor} removed room "${target}" from the team`;
      case 'r':
      case 'room_changed_name':
        return `${actor} changed the room name to ${target}`;
      case 'room_changed_description':
        return `${actor} changed the description to "${target}"`;
      case 'room_changed_avatar':
        return `${actor} changed the room avatar`;
      case 'message_pinned':
        return `${actor} pinned a message`
      default:
        return target || '';
    }
  }

  getDisplayName(user: any): string {
    if (!user) return 'Unknown';
    if (user.name && user.name.trim().length > 0) return user.name.trim();
    return user.username || 'Unknown';
  }

  canCreateTeam(): boolean {
    return this.hasAnyRole(['moderator', 'admin']);
  }

  canCreateChannel(): boolean {
    return this.hasAnyRole(['user', 'leader', 'admin', 'moderator']);
  }

  canCreateDirectMessage(): boolean {
    return this.hasAnyRole(['user', 'leader', 'admin', 'moderator']);
  }

  canDeleteRoom(room: RocketChatRoom): boolean {
    if (!room || !room.t) return false;
    const roles = this.chatService.loggedInUser?.roles || [];

    switch (room.t) {
      case 'c': return roles.includes('admin') || roles.includes('moderator') || roles.includes('leader');
      case 'p': return roles.includes('admin') || roles.includes('moderator') || roles.includes('leader');
      case 'd': return true;
      default: return false;
    }
  }

  async call(type: 'video' | 'audio') {
    if (!this.selectedConversation) return;

    if(!this.chatService.callsAvailable) {
      const permissionsGranted = await this.permissionsService.requestMediaPermissions(type === 'video');
      
      if (!permissionsGranted) {
        this.openSnackBar('Camera/microphone permissions are required for calls.', 'Close');
        return;
      }
    }

    const roomId = this.selectedConversation._id;
    this.chatService.initializeJitsiMeeting(roomId).subscribe((res: any) => {
      if (!res || !res.success) {
        console.error('Error calling room', roomId, res?.error);
        return;
      }

      const callId = res.callId;
      const jwt = res.callToken;
      const roomName = `RocketChat${callId}`;
      const externalApiUrl = (environment.jitsiMeetUrl || '').replace(/\/$/, '') + '/external_api.js';

      this.chatService.openJitsiMeeting({
        roomId: callId,
        roomName,
        jwt,
        externalApiUrl,
        displayName: this.chatService.loggedInUser?.name || this.chatService.loggedInUser?.username,
        email: this.getUserEmail(),
        configOverwrite: { 
          startWithAudioMuted: false, 
          startWithVideoMuted: type === 'audio', 
          prejoinPageEnabled: false 
        },
        interfaceConfigOverwrite: {
          MOBILE_APP_PROMO: false,
        }
      });
    });
  }

  async joinCall(message: RocketChatMessage) {
    if(!this.chatService.callsAvailable) {
      const permissionsGranted = await this.permissionsService.requestMediaPermissions(true);
      
      if (!permissionsGranted) {
        this.openSnackBar('Camera/microphone permissions are required for calls.', 'Close');
        return;
      }
    }

    this.chatService.joinJitsiMeeting(message).subscribe((res: any) => {
      if (!res || !res.success) {
        console.error('Error joining room', res?.error);
        return;
      }

      const callId = res.callId;
      const jwt = res.callToken;
      const roomName = `RocketChat${callId}`;
      const externalApiUrl = (environment.jitsiMeetUrl || '').replace(/\/$/, '') + '/external_api.js';

      this.chatService.openJitsiMeeting({
        roomId: callId,
        roomName,
        jwt,
        externalApiUrl,
        displayName: this.chatService.loggedInUser?.name || this.chatService.loggedInUser?.username,
        email: this.getUserEmail(),
        configOverwrite: { prejoinPageEnabled: false },
        interfaceConfigOverwrite: {
          MOBILE_APP_PROMO: false,
        }
      });
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
    const response = await fetch(downloadUrl);
    const blob = await response.blob();
    
    const blobUrl = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = originalFileName;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    window.URL.revokeObjectURL(blobUrl);
    
  } catch (error) {
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

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  openCreateRoomDialog(type: 'd' | 'c' | 't', teamId?: string, teamName?: string) {
    const dialogRef = this.dialog.open(CreateRoomComponent, {
      width: '400px',
      data: { type, teamId, teamName },
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
    return this.rooms
      .filter(r => {
        if (r.teamMain) return false;
        if (r.t === 'd') return true;
        if (r.t === 'c') return true;
        if (r.t === 'p') return true;
        return false;
      })
      .filter((r) => {
        if (!this.roomsFilter) return true;
        const q = this.roomsFilter.toLowerCase();
        try {
          const nameMatch = !!r?.name && r.name.toLowerCase().includes(q);
          let otherUsername = '';
          if (Array.isArray(r?.usernames) && r.usernames.length > 0) {
            const others = r.usernames.filter((u: string) => u !== this.chatService.loggedInUser?.username);
            otherUsername = (others && others[0]) || '';
          }
          const usernameMatch = otherUsername.toLowerCase().includes(q);
          return nameMatch || usernameMatch;
        } catch (e) {
          return false;
        }
      });
  }

  getConversationName(room: RocketChatRoom): string {
    if (!room) return 'Unknown';
    
    switch (room.t) {
      case 'd': {
        if (room.name && room.name.trim().length > 0) return room.name;
        if (Array.isArray(room.usernames) && room.usernames.length > 0) {
          const other = room.usernames.find((u: string) => u !== this.chatService.loggedInUser?.username);
          if (!other) return (room.usernames[0] || 'Direct Message');
          
          if (this.userNameCache.has(other)) {
            return this.userNameCache.get(other)!;
          }
          
          this.loadUserName(other);
          return other; 
        }
        return 'Direct Message';
      }
      case 'p':
      case 'c':
        return room.name || 'Unknown';
      case 'l':
        return 'Inimble Support';
      default:
        return room.name || 'Unknown';
    }
  }

  private loadUserName(username: string): void {
    this.chatService.getUserInfo(username).subscribe({
      next: (user: RocketChatUser) => {
        const displayName = user.name && user.name.trim().length > 0 ? user.name : username;
        this.userNameCache.set(username, displayName);
        this.cdr.detectChanges();
      },
      error: () => {
        this.userNameCache.set(username, username);
        this.cdr.detectChanges();
      }
    });
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

  markAsRead(room: RocketChatRoom) {
    if (!room || !room._id) return;
    this.chatService.markChannelAsRead(room._id).subscribe({
      next: () => {
        try {
          this.chatService.setUnreadForRoom(room._id, 0);
        } catch {}
        this.sortRoomsByUnread();
      },
      error: err => {
        console.error('Failed to mark as read:', err);
        this.openSnackBar('Failed to mark room as read', 'Close');
      }
    });
  }

  markAsUnread(room: RocketChatRoom) {
    if (!room || !room._id) return;
    try {
      this.chatService.setUnreadForRoom(room._id, 1);
    } catch (err) {
      console.error('Failed to mark as unread:', err);
      this.openSnackBar('Failed to mark room as unread', 'Close');
    }
    this.sortRoomsByUnread();
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

  formatMessageTime(message: RocketChatMessage): string {
    const date = this.getMessageTimestamp(message);
    return date.toLocaleString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  getDateLabel(date: Date): string {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (this.isSameDay(date, today)) {
      return 'Today';
    } else if (this.isSameDay(date, yesterday)) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
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
    this.typingUsers = [];

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

    const { history, realtimeStream, typingStream } = await this.chatService.loadRoomHistoryWithRealtime(room);
    this.messages = history;
    this.sortMessagesAscending();
    const existingMessageIds = new Set(this.messages.map(msg => msg._id));

    const sub = realtimeStream.subscribe((newMessage) => {
      try {
        if (!newMessage || !newMessage._id) return;

        if (existingMessageIds.has(newMessage._id)) {
          // update existing message
          const idx = this.messages.findIndex(m => m._id === newMessage._id);
          if (idx !== -1) {
            this.messages[idx] = { ...this.messages[idx], ...newMessage };
            this.cdr.detectChanges();
          }
        } else {
          // append new message
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
      } catch (err) {
        console.error('Error handling realtime message in room subscription:', err, newMessage);
      }
    });
    this.roomSubscriptions.set(room._id, sub);

    this.typingSubscription = typingStream.subscribe({
      next: (typingEvent) => {
        this.handleTypingEvent(typingEvent);
      },
      error: (error) => {
        console.error('Error in typing stream:', error);
      },
    });

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

    this.scrollToBottom();
  }

  private sortMessagesAscending(): void {
    try {
      this.messages.sort((a, b) => this.getMessageTimestamp(a).getTime() - this.getMessageTimestamp(b).getTime());
      this.messages = [...this.messages];
    } catch (err) {
      console.error('Error sorting messages ascending:', err);
    }
  }

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
  
  onDeleteRoom(room: RocketChatRoom) {
    if (!room || !room._id) return;

    this.chatService.deleteRoom(room._id).subscribe({
      next: success => {
        if (success) {
          this.rooms = this.rooms.filter(r => r._id !== room._id);
          if (this.selectedConversation?._id === room._id) {
            this.selectedConversation = undefined as any;
            this.messages = [];
          }
          this.openSnackBar(`Chat deleted`, 'OK');
        }
      },
      error: err => {
        console.error('Error deleting chat:', err);
        this.openSnackBar('Failed to delete chat', 'Close');
      }
    });
  }

  onLeaveRoom(room: RocketChatRoom) {
    if (!room || !room._id) return;

    this.chatService.leaveRoom(room._id).subscribe({
      next: success => {
        if (success) {
          this.rooms = this.rooms.filter(r => r._id !== room._id);
          if (this.selectedConversation?._id === room._id) {
            this.selectedConversation = undefined as any;
            this.messages = [];
          }
          this.openSnackBar(`Left room`, 'OK');
        }
      },
      error: err => {
        console.error('Error leaving group:', err);
        const errorType = err?.error?.errorType;
        if (errorType === "error-you-are-last-owner") {
          this.openSnackBar('You are the last owner. Delete the group instead.', 'Close');
        } else {
          this.openSnackBar('Could not leave the group.', 'Close');
        }
      }
    });
  }

  getLastMessage(room: RocketChatRoom): string {
    const lastMessage = room.lastMessage;
    if (!lastMessage) return 'No messages yet';
    if (lastMessage.t === 'videoconf') return 'Call started';
    const msgText = lastMessage.msg || '';
    if (room.t !== 'd' && lastMessage.u?.username) {
      return `${lastMessage.u.username}: ${msgText}`;
    }
    return msgText || 'No messages yet';
  }

  private handleTypingEvent(event: {
    roomId: string;
    username: string;
    isTyping: boolean;
  }): void {
    if (event.roomId !== this.selectedConversation?._id) return;

    if (event.isTyping) {
      if (!this.typingUsers.includes(event.username)) {
        this.typingUsers.push(event.username);
      }
    } else {
      this.typingUsers = this.typingUsers.filter(
        (user) => user !== event.username
      );
    }

    this.isUserTyping = this.typingUsers.length > 0;
    if (this.messagesContainer?.nativeElement.scrollTop + this.messagesContainer?.nativeElement.clientHeight >= this.messagesContainer?.nativeElement.scrollHeight) {
      this.scrollToBottom();
    }

    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    if (event.isTyping) {
      this.typingTimeout = setTimeout(() => {
        this.typingUsers = this.typingUsers.filter(
          (user) => user !== event.username
        );
        this.isUserTyping = this.typingUsers.length > 0;
        if (this.messagesContainer?.nativeElement.scrollTop + this.messagesContainer?.nativeElement.clientHeight >= this.messagesContainer?.nativeElement.scrollHeight) {
          this.scrollToBottom();
        }
      }, 3000);
    }
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.selectedConversation) return;
    if (this.editingMessage) {
      const updatedText = this.newMessage.trim();

      this.chatService
        .editMessage(
          this.selectedConversation._id,
          this.editingMessage._id,
          updatedText
        )
        .subscribe({
          next: (res) => {
            this.editingMessage!.msg = updatedText;
            this.editingMessage = null;
            this.newMessage = '';

            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error('Error editing message:', err);
          },
        });

      return;
    }
    this.isSendingMessage = true;

    this.chatService.stopTyping(this.selectedConversation._id);
    this.typingUsers = [];
    const threadId = this.replyToMessage?._id;

    this.chatService
      .sendMessageWithConfirmation(
        this.selectedConversation._id,
        this.newMessage.trim(),
        threadId
      )
      .subscribe({
        next: (result) => {
          if (result.success) {
            this.newMessage = '';
            this.replyToMessage = null;
          }
          this.isSendingMessage = false;
        },
        error: (error) => {
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
      if (el) {
        setTimeout(() => el.scrollTop = el.scrollHeight, 500);
      };
    } catch (e) {}
  }

  ngOnDestroy() {
    try {
      this.chatService.setActiveRoom(null);
    } catch (err) {}
    if (this.realtimeSubscription) {
      this.realtimeSubscription.unsubscribe();
    }
    if (this.typingSubscription) {
      this.typingSubscription.unsubscribe();
    }
    if (this.unreadMapSubscription) {
      this.unreadMapSubscription.unsubscribe();
    }
    if (this.serverUpdatedSubscription) {
      this.serverUpdatedSubscription.unsubscribe();
    }
    if (this.selectedConversation) {
      this.chatService.unsubscribeFromRoomMessages(
        this.selectedConversation._id
      );
      this.chatService.unsubscribeFromTypingEvents(
        this.selectedConversation._id
      );
    }

    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
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

  openSnackBar(message: string, action: string): void {
    this.snackBar.open(message, action, {
      duration: 2000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }

  onMessageInput(): void {
    if (!this.selectedConversation) return;

    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    this.chatService.startTyping(this.selectedConversation._id);

    this.typingTimeout = setTimeout(() => {
      this.chatService.stopTyping(this.selectedConversation._id);
    }, 1000);
  }

  onMessageTouchStart(event: TouchEvent, message: RocketChatMessage) {
    if (!this.isMobile) return;
    this.clearTouchTimer();
    const msgId = message?._id;
    this.touchTimer = setTimeout(() => {
      this.pressedMessageId = msgId || null;
      setTimeout(() => {
        if (this.pressedMessageId === msgId) {
          this.pressedMessageId = null;
          this.cdr.markForCheck();
        }
      }, 3000);
      this.cdr.markForCheck();
    }, 600);
  }

  onMessageTouchEnd(event: TouchEvent, message: RocketChatMessage) {
    if (!this.isMobile) return;
    if (this.touchTimer) {
      this.clearTouchTimer();
    }
  }

  onMessageTouchCancel(event: TouchEvent) {
    this.clearTouchTimer();
  }

  private clearTouchTimer() {
    if (this.touchTimer) {
      clearTimeout(this.touchTimer);
      this.touchTimer = null;
    }
  }

/*   reactToMessage(message: RocketChatMessage) {
    const emoji = ':smile:';
    this.chatService.reactToMessage(message._id, emoji).subscribe({
      next: (res) => {
        console.log('Reacted to message:', res);
      },
      error: (err) => {
        console.error('Error reacting to message:', err);
      }
    });
  } */

  quoteMessage(message: RocketChatMessage) {
    this.replyToMessage = message;
    this.scrollToBottom();
  }

  cancelReply() {
    this.replyToMessage = null;
  }

  getRepliedMessage(message: RocketChatMessage): RocketChatMessage | null {
    const anyMsg: any = message as any;
    const possibleIds = [anyMsg.tmid, anyMsg.tmidString, anyMsg.threadId, anyMsg.tmid_id, anyMsg.tmidId];
    const tmid = possibleIds.find((id) => !!id) as string | undefined;
    if (!tmid) return null;
    return this.messages.find((m) => m._id === tmid) || null;
  }

  getRepliedTextOrAttachment(msg: RocketChatMessage): string {
    if (!msg) return '';
    if (msg.msg && msg.msg.trim().length > 0) return msg.msg;
    if (msg.attachments && msg.attachments.length > 0) return msg.attachments[0].title || 'Attachment';
    return '';
  }
  
  isReplyMessage(message: RocketChatMessage): boolean {
    if (!message) return false;

    const anyMsg: any = message;

    const possibleIds = [
      anyMsg.tmid,
      anyMsg.tmidString,
      anyMsg.threadId,
      anyMsg.tmid_id,
      anyMsg.tmidId
    ];

    return possibleIds.some(id => typeof id === 'string' && id.trim().length > 0);
  }

  pinnedMessage(): RocketChatMessage | null {
    if (!this.messages || this.messages.length === 0) return null;
    const pinned = this.messages.filter((m) => !!m.pinned);
    if (pinned.length === 0) return null;

    try {
      pinned.sort((a, b) => this.getMessageTimestamp(a).getTime() - this.getMessageTimestamp(b).getTime());
      return pinned[pinned.length - 1] || null;
    } catch (e) {
      return pinned[pinned.length - 1] || null;
    }
  }

  pinnedPreview(msg: RocketChatMessage | null): string {
    if (!msg) return '';
    if (msg.msg && msg.msg.trim().length > 0) {
      const txt = msg.msg.trim();
      return txt.length > 120 ? txt.slice(0, 120) + '...' : txt;
    }
    if (msg.attachments && msg.attachments.length > 0) {
      const a: any = msg.attachments[0];
      const title = a?.title || a?.text || a?.description || '';
      if (title && title.trim().length > 0) {
        return title.length > 120 ? title.slice(0, 120) + '...' : title;
      }
      return a?.title || 'Attachment';
    }
    return '';
  }

  scrollToMessage(id?: string | null) {
    if (!id) return;
    try {
      const container = this.messagesContainer?.nativeElement;
      if (!container) return;
      const el = container.querySelector(`#msg-${id}`) as HTMLElement | null;
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('replied-highlight');
        setTimeout(() => {
          el.classList.remove('replied-highlight');
        }, 1400);
      }
    } catch (err) {
      console.error('scrollToMessage error', err);
    }
  }

  togglePin(message: RocketChatMessage) {
    const action$ = message.pinned
      ? this.chatService.unpinMessage(message._id)
      : this.chatService.pinMessage(message._id);

    action$.subscribe({
      next: (res) => {
        message.pinned = !message.pinned;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error pinning/unpinning message:', err);
      }
    });
  }

  editMessage(message: RocketChatMessage) {
    this.replyToMessage = null;
    this.editingMessage = message;
    this.newMessage = message.msg;
  }
  
  cancelEditing() {
    this.editingMessage = null;
    this.newMessage = '';
  }

  deleteMessage(message: RocketChatMessage) {
    this.confirmationModal.open(ModalComponent, {
      data: {
        action: 'delete',
        subject: 'message',
        message: `This action will be permanent.`,
      }
    }).afterClosed().subscribe((result) => {
      if (result) {
        this.chatService.deleteMessage(message._id, message.rid).subscribe({
          next: (res) => {
            this.messages = this.messages.filter((m) => m._id !== message._id);
            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error('Error deleting message:', err);
          }
        });
      }
    });
  }
}
