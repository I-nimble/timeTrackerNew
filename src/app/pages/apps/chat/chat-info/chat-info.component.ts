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
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { RocketChatService } from 'src/app/services/rocket-chat.service';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatOption } from '@angular/material/core';
import { MatSelect } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatSelectionList } from '@angular/material/list';
import { MatListOption } from '@angular/material/list';
import { ModalComponent } from 'src/app/components/confirmation-modal/modal.component';

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
  canManageRoom = false;
  canDeleteRoom = false;
  roomRoles: Record<string, string[]> = {};
  loggedUserRoomRoles: string[] = [];

  constructor(
    public dialogRef: MatDialogRef<ChatInfoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      conversation: RocketChatRoom,
      userInfo: any,
      channelMembers: any[]
    },
    public chatService: RocketChatService,
    private confirmationModal: MatDialog,    
  ) {}

  ngOnInit(): void {
    if (this.data.conversation) {
      this.chatService
        .getConversationPicture(this.data.conversation)
        .subscribe(url => (this.roomPicture = url));
      this.loadRoomRoles();
    }
    this.loadAvailableUsers();
  }

  private loadRoomRoles(): void {
    const roomId = this.data.conversation?._id;
    const loggedUserId = this.chatService.loggedInUser?._id;
    if (!roomId || !loggedUserId) return;
    this.chatService.getRoomRoles(roomId).subscribe({
      next: res => {
        this.roomRoles = {};
        res.roles.forEach((r: any) => {
          this.roomRoles[r.u._id] = r.roles;
        });
        this.loggedUserRoomRoles = this.roomRoles[loggedUserId] || [];
        this.updateMemberPermissions();
      },
      error: err => {
        console.error('Failed to load room roles', err);
      }
    });
  }

  private updateMemberPermissions(): void {
    const type = this.data.conversation?.t;
    if (type !== 'c' && type !== 'p') {
      this.canManageRoom = false;
      this.canDeleteRoom = false;
      return;
    }
    const isAdmin = this.hasGlobalRole(['admin']);
    const isLeader = this.hasGlobalRole(['leader']);
    const isModerator = this.hasGlobalRole(['moderator']);
    const isOwner  = this.hasRoomRole(['owner']);
    this.canManageRoom = isAdmin || isLeader || isOwner || isModerator;
    this.canDeleteRoom = isAdmin || isLeader || isModerator;
  }

  private hasGlobalRole(roles: string[]): boolean {
    const userRoles = this.chatService.loggedInUser?.roles || [];
    return roles.some(r => userRoles.includes(r));
  }

  private hasRoomRole(roles: string[]): boolean {
    return roles.some(r => this.loggedUserRoomRoles.includes(r));
  }

  canManageMembers(member: any): boolean {
    const loggedUser = this.chatService.loggedInUser;
    if (!loggedUser) return false;
    if (member._id === loggedUser._id) return false;
    if (this.hasGlobalRole(['admin', 'moderator', 'leader'])) {
      return true;
    }
    if (!this.canManageRoom) return false;
    const memberRoles = this.roomRoles[member._id] || [];
    if (memberRoles.includes('owner')) {
      const ownersCount = Object.values(this.roomRoles)
        .filter(r => r.includes('owner')).length;
      if (ownersCount <= 1) return false;
    }
    return true;
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
          this.loadRoomRoles();
        },
        error: err => {
          console.error('Failed to add members', err);
        }
      });
  }

  removeMember(member: any): void {
    const conversation = this.data.conversation;
    const type = conversation?.t;
    if (type !== 'c' && type !== 'p') return;
    this.chatService
      .removeUserFromRoom(conversation._id, member._id, type)
      .subscribe({
        next: () => {
          this.data.channelMembers = this.data.channelMembers.filter(
            m => m._id !== member._id
          );
          this.loadRoomRoles();
        },
        error: err => {
          console.error('Failed to remove member', err);
        }
      });
  }

  deleteRoom(): void {
    const roomId = this.data.conversation?._id;
    if (!roomId) return;
    this.confirmationModal
      .open(ModalComponent, {
        data: {
          action: 'delete',
          subject: 'room',
          message: 'This action will permanently delete this room and all its messages.'
        }
      })
      .afterClosed()
      .subscribe(result => {
        if (!result) return;
        this.chatService.deleteRoom(roomId).subscribe({
          next: success => {
            if (success) {
              this.dialogRef.close({ deleted: true, roomId });
            }
          },
          error: err => {
            console.error('Error deleting room:', err);
          }
        });
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