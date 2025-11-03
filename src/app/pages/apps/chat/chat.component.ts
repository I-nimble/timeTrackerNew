import {
  Component,
  OnInit,
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
import { RocketChatRoom, RocketChatMessage, RocketChatUser } from '../../../models/rocketChat.model';

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
export class AppChatComponent implements OnInit {
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

  @HostListener('window:resize', ['$event'])
  
  onResize(event: any) {
    this.isMobile = event.target.innerWidth <= 768;
  }

  constructor(protected chatService: RocketChatService) {}

  ngOnInit(): void {
    this.chatService.getRooms().subscribe((rooms: any) => {
      console.log(rooms);
      this.rooms = rooms;
      // setTimeout(() => this.scrollToBottom(), 100);
    });
  }

  call() {
    // TODO: Implement call functionality
    // Get jitsi meet url and open in new tab/window
    // return this.chatService.initializeJitsiMeeting(
    //   this.selectedConversation.id, 
    //   this.selectedConversation.tmid, 
    //   this.selectedConversation.previewItem
    // );
  }

  filteredRooms(): RocketChatRoom[] {
    if (!this.roomsFilter) return this.rooms;
    const q = this.roomsFilter.toLowerCase();
    return this.rooms.filter(
      (r) => r.usernames?.filter((u: string) => u.toLowerCase().includes(q)) // filtering direct messages
    );
  }

  getConversationPicture(room : RocketChatRoom) {
    switch (room.t) {
      case 'd': // direct message
        // return 'assets/images/profile/user-4.jpg';
      case 'p': // private chat
        // return 'assets/images/profile/user-5.jpg';
      case 'c': // channel
        // return 'assets/images/profile/user-6.jpg';
      case 'l': // livechat
        // return 'assets/images/profile/user-7.jpg';
      default:
        return 'assets/images/default-user-profile-pic.png';
    }
  }

  selectRoom(r: RocketChatRoom) {
    this.selectedConversation = r;
    setTimeout(() => this.scrollToBottom(), 50);
  }

  messagesFor(contactId: string): RocketChatMessage[] {
    // TODO: get all messages for a room
    return [];
  }

  sendMessage() {
    // TODO: Implement send message functionality via API

    // if (!this.selectedConversation) return;
    // const text = this.newMessage?.trim();
    // if (!text) return;

    // if (!this.selectedConversation.chat) {
    //   this.selectedConversation.chat = [];
    // }

    // this.selectedConversation.chat.push({
    //   type: 'even',
    //   msg: text,
    //   date: new Date(),
    // });

    // this.newMessage = '';
    setTimeout(() => this.scrollToBottom(), 50);
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
}
