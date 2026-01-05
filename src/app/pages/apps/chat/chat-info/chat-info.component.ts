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
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { RocketChatService } from 'src/app/services/rocket-chat.service';

@Component({
  selector: 'app-chat-info',
  templateUrl: './chat-info.component.html',
  styleUrls: ['./chat-info.component.scss'],
  imports: [
    CommonModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule
  ]
})
export class ChatInfoComponent {
  roomPicture: string | null = null;
  constructor(
    public dialogRef: MatDialogRef<ChatInfoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      conversation: RocketChatRoom,
      userInfo: any,
      channelMembers: any[]
    },
    private chatService: RocketChatService
  ) {}

  ngOnInit(): void {
    if (this.data.conversation) {
      this.chatService.getConversationPicture(this.data.conversation)
        .subscribe(url => this.roomPicture = url);
    }
  }

  getLocalTime(offset?: number): string {
    if (offset === undefined || offset === null) return '';
    const now = new Date();
    const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
    const local = new Date(utcTime + offset * 3600000);
    return local.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}