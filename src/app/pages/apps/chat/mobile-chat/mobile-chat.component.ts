import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CometChatService } from '../../../../services/apps/chat/chat.service';
import { CometChatThemeService, CometChatConversationsWithMessages, CometChatGroupsWithMessages, CometChatUIKit, CometChatConversations, CometChatGroups, CometChatContacts } from '@cometchat/chat-uikit-angular';
import '@cometchat/uikit-elements';
import { MessagesConfiguration, DetailsConfiguration, AddMembersConfiguration, MessageComposerConfiguration, MessageListConfiguration, ThreadedMessagesConfiguration, MessageHeaderConfiguration, ContactsConfiguration, UsersConfiguration, GroupsConfiguration, ConversationsConfiguration, ContactsStyle } from '@cometchat/uikit-shared';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { BackdropStyle, AvatarStyle } from "@cometchat/uikit-elements";
import { CometChatUIEvents, DatePatterns, TimestampAlignment } from "@cometchat/uikit-resources"
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';

interface ChatTab {
  label: string;
  icon: string;
  component: string;
}

@Component({
  selector: 'app-mobile-chat',
  imports: [MaterialModule, CometChatConversations, TablerIconsModule, CommonModule, CometChatGroups, CometChatContacts],
  templateUrl: './mobile-chat.component.html',
  styleUrl: './mobile-chat.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class MobileChatComponent implements OnInit {
  @Input() groupsConfiguration: GroupsConfiguration;
  @Input() basicMessagesConfig: MessagesConfiguration;
  @Input() essentialMessagesConfig: MessagesConfiguration;
  @Input() professionalMessagesConfig: MessagesConfiguration;
  @Input() StartConversationConfiguration: ContactsConfiguration;
  @Input() conversationConfiguration: ConversationsConfiguration;
  @Input() plan: any;
  @Input() userRole: string | null = localStorage.getItem('role');

  cometChatUser!: any;
  profilePic!: any;
  avatarStyle = new AvatarStyle({width: "28px",height: "28px"});
  tabs: ChatTab[] = [
    { label: 'Chat', icon: 'message', component: 'chats' },
    { label: 'Groups', icon: 'users-group', component: 'groups' },
    { label: 'Contacts', icon: 'address-book', component: 'contacts' },
    { label: 'Messages', icon: 'message', component: 'messages' },
  ];
  currentTab!: ChatTab;
  searchText: string = '';
  user: CometChat.User | null = null;
  group: CometChat.Group | null = null;
  basicMessageListConfiguration: MessageListConfiguration;
  essentialMessageListConfiguration: MessageListConfiguration;
  professionalMessageListConfiguration: MessageListConfiguration;

  constructor(private chatService: CometChatService) { }

  ngOnInit(): void {
    this.currentTab = this.plan.id != 1 ? this.tabs[0] : this.tabs[1];
    CometChat.getLoggedinUser().then((user: any) => {
      this.cometChatUser = user;
      this.profilePic = user.getAvatar();
    });

    this.essentialMessageListConfiguration = new MessageListConfiguration({
      disableReactions: true,
      templates: this.chatService.templates,
      showAvatar: true,
      scrollToBottomOnNewMessages: true,
      datePattern: DatePatterns.DateTime,
      timestampAlignment: TimestampAlignment.bottom
    });
    this.professionalMessageListConfiguration = new MessageListConfiguration({
      templates: this.chatService.templates,
      showAvatar: true,
      scrollToBottomOnNewMessages: true,
      datePattern: DatePatterns.DateTime,
      timestampAlignment: TimestampAlignment.bottom
    })
    this.basicMessageListConfiguration = new MessageListConfiguration({
      disableReactions: true,
      templates: this.chatService.templates,
      showAvatar: true,
      scrollToBottomOnNewMessages: true,
      datePattern: DatePatterns.DateTime,
      timestampAlignment: TimestampAlignment.bottom
    })
  }

  getCurrentTab() {
    return this.tabs.find(tab => tab === this.currentTab);
  }

  searchConversations() {
    // TODO: Implement search functionality
  }

  onGroupsItemClick(group: any) {
    this.group = group as CometChat.Group;
    this.user = null;

    // Hide the group list and show the messages component
  }

  onConversationsItemClick(conversation: any) {
    const conv = conversation.getConversationWith();
    const convType = conversation.getConversationType();

    if (convType === 'user') {
      this.user = conv as CometChat.User;
      this.group = null;
    } else if (convType === 'group') {
      this.group = conv as CometChat.Group;
      this.user = null;
    }
    // Hide the conversations list and show the messages component
  }
}
