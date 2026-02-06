import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { RocketChatService } from 'src/app/services/rocket-chat.service';
import {
  RocketChatCredentials,
  RocketChatUser,
  RocketChatRoom,
  RocketChatMessage,
  RocketChatTeam
} from 'src/app/models/rocketChat.model';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDivider } from '@angular/material/divider';
import { MatCard } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-create-room',
  templateUrl: './create-room.component.html',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatDivider,
    MatCard,
    MatIcon
  ]
})
export class CreateRoomComponent implements OnInit {
  roomType: 'd' | 'c' | 't' | 'p';
  name = '';
  isPrivate = false;
  selectedTeamId?: string;
  selectedTeamName?: string;
  teams: RocketChatTeam[] = [];
  users: RocketChatUser[] = [];
  selectedUsers: RocketChatUser[] = [];

  constructor(
    public dialogRef: MatDialogRef<CreateRoomComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      type: 'd' | 'c' | 't' | 'p';
      teamId?: string;
      teamName?: string;
    },
    private chatService: RocketChatService,
    private snackBar: MatSnackBar
  ) {
    this.roomType = data.type;
  }

  ngOnInit() {
    const exclude = (u: RocketChatUser) =>
      u._id === this.chatService.loggedInUser?._id ||
      u.roles?.includes('bot') ||
      u.roles?.includes('app');

    const teams$ = (this.isAdmin || this.isModerator)
      ? this.chatService.getAllTeams()
      : this.chatService.getTeams();

    teams$.subscribe(teams => {
      this.teams = teams;

      if (this.roomType === 'c' || this.roomType === 'p') {
        if (this.isAdmin || this.isModerator) {
          if (teams.length > 0) {
            this.selectedTeamId = teams[0]._id;
            this.selectedTeamName = teams[0].name;
          }

          this.chatService.getUsers().subscribe(users => {
            this.includeModerators(users);
          });
        } else {
          if (teams.length > 0) {
            const firstTeam = teams[0];
            this.selectedTeamId = firstTeam._id;
            this.selectedTeamName = firstTeam.name;

            this.chatService.getTeamMembers(firstTeam._id).subscribe(users => {
              this.includeModerators(users);
            });
          }
        }
      }

      if (this.roomType === 'd') {
        if (this.isAdmin || this.isModerator) {
          this.chatService.getUsers().subscribe(users => {
            this.users = users.filter(u => !exclude(u));
          });
        } else if (teams.length > 0) {
          const firstTeam = teams[0];
          this.chatService.getTeamMembers(firstTeam._id).subscribe(users => {
            this.includeModerators(users);
          });
        }
      }

      if (this.roomType === 't') {
        this.chatService.getUsers().subscribe(users => {
          this.users = users.filter(u => !exclude(u));
        });
      }
    });
  }
  
  get isLeader(): boolean {
    return this.chatService.loggedInUser?.roles?.includes('leader') || false;
  }

  get isAdmin(): boolean {
    return this.chatService.loggedInUser?.roles?.includes('admin') || false;
  }

  get isModerator(): boolean {
    return this.chatService.loggedInUser?.roles?.includes('moderator') || false;
  }

  includeModerators(users: RocketChatUser[]) {
    this.chatService.getUsers().subscribe(all => {
      const moderators = all.filter(u => u.roles?.includes('moderator'));
      moderators.forEach(mod => {
        if (!users.some(u => u._id === mod._id)) {
          users.push(mod);
        }
      });
      this.users = users.filter(u => !this.isExcluded(u));
    });
  }

  createRoom() {
    if (!this.name) return;

    switch (this.roomType) {
      case 'd': {
        this.chatService.createDirectMessage(this.name)
          .then(room => this.dialogRef.close({ success: true, room }))
          .catch(err => console.error('Error creating direct message:', err));
        break;
      }
      case 'p': {
        if (!this.selectedTeamId) return;
        const type = this.isPrivate ? 'p' : 'c';
        const memberIds = this.selectedUsers.map(u => u._id);

        this.chatService.createRoom(this.name, type, memberIds, this.selectedTeamId)
          .subscribe({
            next: room => this.dialogRef.close({ success: true, room }),
            error: err => {
              console.error('Error creating channel:', err);
              this.snackBar.open(
                'Failed to create channel: ' + (err?.error?.error || err?.message || 'Unknown error'),
                'Close',
                { duration: 5000 }
              );
            }
          });
        break;
      }
      case 'c': {
        if (!this.selectedTeamId) return;
        const type = this.isPrivate ? 'p' : 'c';
        const memberIds = this.selectedUsers.map(u => u._id);

        this.chatService.createRoom(this.name, type, memberIds, this.selectedTeamId)
          .subscribe({
            next: room => this.dialogRef.close({ success: true, room }),
            error: err => {
              console.error('Error creating channel:', err);
              this.snackBar.open(
                'Failed to create channel: ' + (err?.error?.error || err?.message || 'Unknown error'),
                'Close',
                { duration: 5000 }
              );
            }
          });
        break;
      }
      case 't': {
        const owner = this.chatService.loggedInUser?._id || '';
        const memberIds = this.selectedUsers.map(u => u._id);
        this.chatService.createTeam(this.name, owner, memberIds).subscribe({
          next: (team: RocketChatTeam) => this.dialogRef.close({ success: true, room: team }),
          error: err => {
            console.error('Error creating team:', err);
            this.snackBar.open('Failed to create team: ' + (err?.error?.error || err?.message || 'Unknown error'), 'Close', { duration: 5000 });
          }
        });
        break;
      }
    }
  }

  onTeamChange(teamId: string) {
    this.selectedTeamId = teamId;

    if (this.isAdmin || this.isModerator) {
      this.chatService.getUsers().subscribe(users => {
        this.users = users.filter(u => !this.isExcluded(u));
        this.selectedUsers = [];
      });
    } else {
      this.chatService.getTeamMembers(teamId).subscribe(users => {
        this.includeModerators(users);
        this.selectedUsers = [];
      });
    }
  }

  isExcluded(u: RocketChatUser) {
    return u._id === this.chatService.loggedInUser?._id ||
          u.roles?.includes('bot') ||
          u.roles?.includes('app');
  }
}