import { Component, OnInit, inject, CUSTOM_ELEMENTS_SCHEMA, ViewChild, TemplateRef, ElementRef, HostListener, ChangeDetectorRef } from '@angular/core';
import { PlansService } from 'src/app/services/plans.service';
import { Plan } from 'src/app/models/Plan.model';
import { CompaniesService } from 'src/app/services/companies.service';
import { EmployeesService } from 'src/app/services/employees.service';
import { CometChatService } from '../../../services/apps/chat/chat.service';
import { CometChatThemeService, CometChatTheme, CometChatConversationsWithMessages, CometChatGroupsWithMessages, CometChatUIKit } from '@cometchat/chat-uikit-angular';
import '@cometchat/uikit-elements';
import { CometChat } from '@cometchat/chat-sdk-javascript-new';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/material.module';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NewGroupDialogComponent } from './new-group-dialog/new-group-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { MessagesConfiguration, DetailsConfiguration, AddMembersConfiguration, MessageComposerConfiguration, MessageListConfiguration, ThreadedMessagesConfiguration, MessageHeaderConfiguration, ContactsConfiguration, UsersConfiguration, GroupsConfiguration, ConversationsConfiguration, ContactsStyle } from '@cometchat/uikit-shared';
import { BackdropStyle, AvatarStyle } from "@cometchat/uikit-elements";
import { Subscription } from 'rxjs';
import { CometChatUIEvents, DatePatterns, TimestampAlignment } from "@cometchat/uikit-resources"
import { LoaderComponent } from 'src/app/components/loader/loader.component';
import { Loader } from 'src/app/app.models';
import { emojisByCategory } from './emojisByCategory';
import { CustomMessageComposerComponent } from './custom-message-composer/custom-message-composer.component';
import { CometChatMessageTemplate, CometChatMessageOption } from "@cometchat/uikit-resources"
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
import { MatMenuModule } from '@angular/material/menu';;
import { messages as chatData } from './chatData';
import { Contact, Message } from './chat';

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
    MatMenuModule
  ],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
})
export class AppChatComponent {  contactsFilter = '';
  selectedContact: Contact | null = null;
  contacts: Contact[] = [];
  messages: Message[] = [];
  newMessage = '';
  isSidebarOpen = true;
  @ViewChild('messagesContainer', { static: false }) messagesContainer?: ElementRef;
  @ViewChild('sidebar') sidebar!: MatSidenav;
  isMobile = window.innerWidth <= 768;

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.isMobile = event.target.innerWidth <= 768;
  }

  ngOnInit(): void {
    this.contacts = chatData as Contact[];
    setTimeout(() => this.scrollToBottom(), 100);
  }

  filteredContacts(): Contact[] {
    if (!this.contactsFilter) return this.contacts;
    const q = this.contactsFilter.toLowerCase();
    return this.contacts.filter(c =>
      c.from.toLowerCase().includes(q) || (c.subject || '').toLowerCase().includes(q)
    );
  }


  selectContact(c: Contact) {
    this.selectedContact = c;
    setTimeout(() => this.scrollToBottom(), 50);
  }

  messagesFor(contactId: string): Message[] {
    const contact = this.contacts.find(c => c.id === contactId);
    return contact?.chat || [];
  }

  sendMessage() {
    if (!this.selectedContact) return;
    const text = this.newMessage?.trim();
    if (!text) return;

    if (!this.selectedContact.chat) {
      this.selectedContact.chat = [];
    }

    this.selectedContact.chat.push({
      type: 'even',
      msg: text,
      date: new Date()
    });

    this.newMessage = '';
    setTimeout(() => this.scrollToBottom(), 50);
  }
  
  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  private scrollToBottom() {
    try {
      const el = this.messagesContainer?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    } catch (e) {
    }
  }
}