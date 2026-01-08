import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  RocketChatCredentials,
  RocketChatUser,
  RocketChatRoom,
  RocketChatMessage,
  RocketChatTeam
} from 'src/app/models/rocketChat.model';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { RocketChatService } from 'src/app/services/rocket-chat.service';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatOption } from '@angular/material/core';
import { MatSelect } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatSelectionList } from '@angular/material/list';
import { MatListOption } from '@angular/material/list';

@Component({
  selector: 'app-chat-info',
  templateUrl: './chat-info.component.html',
  styleUrls: ['./chat-info.component.scss'],
  imports: [
    CommonModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatFormField, 
    MatLabel, 
    MatOption, 
    MatSelect,
    FormsModule,
    MatSelectModule,
    MatSelectionList,
    MatListOption
  ]
})
export class ChatInfoComponent {
  roomPicture: string | null = null;
  showAddMembers = false;
  availableUsers: RocketChatUser[] = [];
  selectedUsers: RocketChatUser[] = [];

  constructor(
    public dialogRef: MatDialogRef<ChatInfoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      conversation: RocketChatRoom,
      userInfo: any,
      channelMembers: any[]
    },
    public chatService: RocketChatService
  ) {}

  ngOnInit(): void {
    if (this.data.conversation) {
      this.chatService.getConversationPicture(this.data.conversation)
        .subscribe(url => this.roomPicture = url);
    }
    this.loadAvailableUsers();
  }

  get canAddMembers(): boolean {
    return this.data.conversation?.t === 'c' || this.data.conversation?.t === 'p';
  }

  canManageMembers(member: any): boolean {
    if (!this.chatService.loggedInUser) return false;
    return member._id !== this.chatService.loggedInUser._id;
  }

  getUserAvatar(user: any): string {
    return user.avatarUrl || user.avatar || user.profilePicture || this.chatService.defaultAvatarUrl;
  }
 
  isAlreadyMember(user: RocketChatUser): boolean {
    return this.data.channelMembers.some(m => m._id === user._id);
  }

  private loadAvailableUsers(): void {
    const roomUserIds = new Set(this.data.channelMembers.map(u => u._id));

    if (this.data.conversation.teamId) {
      this.chatService.getTeamMembers(this.data.conversation.teamId)
        .subscribe(users => {
          this.availableUsers = users
            .map(u => ({
              ...u,
              avatarUrl: u.avatarUrl || this.chatService.getUserAvatarUrl(u.username)
            }));
        });
    }
  }

  toggleAddMembers(): void {
    this.showAddMembers = !this.showAddMembers;
    if (!this.showAddMembers) {
      this.selectedUsers = [];
    }
  }

  addMembers(): void {
    const roomId = this.data.conversation._id;
    const type = this.data.conversation.t;

    if (type !== 'c' && type !== 'p') {
      return;
    }

    this.chatService
      .addUsersToRoom(
        roomId,
        this.selectedUsers.map(u => u._id),
        type
      )
      .subscribe({
        next: () => {
          this.data.channelMembers.push(...this.selectedUsers);
          this.selectedUsers = [];
          this.showAddMembers = false;
          this.loadAvailableUsers();
        },
        error: err => {
          console.error('Failed to add members', err);
        }
      });
  }

  removeMember(member: any): void {
    if (!this.data.conversation?._id) return;
    this.chatService
      .removeUserFromRoom(this.data.conversation._id, member._id)
      .subscribe({
        next: () => {
          this.data.channelMembers = this.data.channelMembers.filter(
            m => m._id !== member._id
          );
        },
        error: err => {
          console.error('Failed to remove member', err);
        }
      });
  }

  getLocalTime(offset?: number): string {
    if (offset === undefined || offset === null) return '';
    const now = new Date();
    const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
    const local = new Date(utcTime + offset * 3600000);
    return local.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}