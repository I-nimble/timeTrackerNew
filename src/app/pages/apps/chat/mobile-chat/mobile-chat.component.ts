import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, NgModule, CUSTOM_ELEMENTS_SCHEMA, TemplateRef } from '@angular/core';
import { CometChatService } from '../../../../services/apps/chat/chat.service';
import { CometChatThemeService, CometChatConversationsWithMessages, CometChatGroupsWithMessages, CometChatUIKit, CometChatConversations, CometChatGroups, CometChatContacts, CometChatMessages } from '@cometchat/chat-uikit-angular';
import '@cometchat/uikit-elements';
import { MessagesConfiguration, DetailsConfiguration, AddMembersConfiguration, MessageComposerConfiguration, MessageListConfiguration, ThreadedMessagesConfiguration, MessageHeaderConfiguration, ContactsConfiguration, UsersConfiguration, GroupsConfiguration, ConversationsConfiguration, ContactsStyle } from '@cometchat/uikit-shared';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { BackdropStyle, AvatarStyle } from "@cometchat/uikit-elements";
import { CometChatUIEvents, DatePatterns, TimestampAlignment, CometChatMessageTemplate } from "@cometchat/uikit-resources"
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';

interface ChatTab {
  label: string;
  icon: string;
  component: string;
}

@Component({
  selector: 'app-mobile-chat',
  imports: [MaterialModule, CometChatConversations, TablerIconsModule, CommonModule, CometChatGroups, CometChatContacts, CometChatMessages],
  templateUrl: './mobile-chat.component.html',
  styleUrl: './mobile-chat.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class MobileChatComponent implements OnInit {
  @Input() groupsConfiguration: GroupsConfiguration;
  @Input() basicMessagesConfig: MessagesConfiguration;
  @Input() essentialMessagesConfig: MessagesConfiguration;
  @Input() professionalMessagesConfig: MessagesConfiguration;
  @Input() conversationConfiguration: ConversationsConfiguration;
  @Input() plan: any;
  @Input() userRole: string | null = localStorage.getItem('role');
  @Input() conversationsMenuTemplate: TemplateRef<any>;
  @Input() customMessageComposerView: TemplateRef<any>;
  @Input() StartConversationConfiguration: ContactsConfiguration;
  @Input() templates: CometChatMessageTemplate[];

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
  conversationsRequestBuilder: CometChat.ConversationsRequestBuilder;
  usersSearchRequestBuilder: CometChat.UsersRequestBuilder;
  groupsSearchRequestBuilder: CometChat.GroupsRequestBuilder;

  constructor(private chatService: CometChatService) {
    this.onConversationsItemClick = this.onConversationsItemClick.bind(this);
    this.onGroupsItemClick = this.onGroupsItemClick.bind(this);
  }

  ngOnInit(): void {
    this.currentTab = this.plan.id != 1 ? this.tabs[0] : this.tabs[1];
    CometChat.getLoggedinUser().then((user: any) => {
      this.cometChatUser = user;
      this.profilePic = user.getAvatar();
    });

    this.essentialMessageListConfiguration = new MessageListConfiguration({
      disableReactions: true,
      templates: this.templates,
      showAvatar: true,
      scrollToBottomOnNewMessages: true,
      datePattern: DatePatterns.DateTime,
      timestampAlignment: TimestampAlignment.bottom
    });
    this.professionalMessageListConfiguration = new MessageListConfiguration({
      templates: this.templates,
      showAvatar: true,
      scrollToBottomOnNewMessages: true,
      datePattern: DatePatterns.DateTime,
      timestampAlignment: TimestampAlignment.bottom
    })
    this.basicMessageListConfiguration = new MessageListConfiguration({
      disableReactions: true,
      templates: this.templates,
      showAvatar: true,
      scrollToBottomOnNewMessages: true,
      datePattern: DatePatterns.DateTime,
      timestampAlignment: TimestampAlignment.bottom
    })

    this.groupsSearchRequestBuilder = new CometChat.GroupsRequestBuilder()
      .setLimit(50);

    this.conversationsRequestBuilder = new CometChat.ConversationsRequestBuilder()  
      .setConversationType('user')
      .setLimit(50);

    this.usersSearchRequestBuilder = new CometChat.UsersRequestBuilder()
      .setLimit(50);
  }

  search(event?: Event | string) {
    // Accept either the DOM Event (from input), a direct string, or no argument (button click).
    if (typeof event === 'string') {
      this.searchText = event;
    } else if (event instanceof Event) {
      const input = event.target as HTMLInputElement | null;
      this.searchText = input?.value ?? this.searchText;
    }

    const query = (this.searchText || '').trim();

    // If query is empty, reset builders to default (no search keyword)
    if (!query) {
      if (this.currentTab?.component === 'chats') {
        this.conversationsRequestBuilder = new CometChat.ConversationsRequestBuilder()
          .setConversationType('user')
          .setLimit(50);
      } else if (this.currentTab?.component === 'groups') {
        this.groupsSearchRequestBuilder = new CometChat.GroupsRequestBuilder()
          .setLimit(50);
      } else if (this.currentTab?.component === 'contacts') {
        this.usersSearchRequestBuilder = new CometChat.UsersRequestBuilder().setLimit(50);
        this.groupsSearchRequestBuilder = new CometChat.GroupsRequestBuilder().setLimit(50);
      }
      return;
    }

    // Apply search keyword to the appropriate builders
    if (this.currentTab?.component === 'chats') {
      this.conversationsRequestBuilder = new CometChat.ConversationsRequestBuilder()
        .setSearchKeyword(query)
        .setConversationType('user')
        .setLimit(50);
    } else if (this.currentTab?.component === 'groups') {
      // update the search builder for groups
      this.groupsSearchRequestBuilder = new CometChat.GroupsRequestBuilder()
        .setSearchKeyword(query)
        .setLimit(50);
    } else if (this.currentTab?.component === 'contacts') {
      this.usersSearchRequestBuilder = new CometChat.UsersRequestBuilder()
        .setSearchKeyword(query)
        .setLimit(50);
      this.groupsSearchRequestBuilder = new CometChat.GroupsRequestBuilder()
        .setSearchKeyword(query)
        .setLimit(50);
    }
  }

  onGroupsItemClick(group: any) {
    this.group = group as CometChat.Group;
    this.user = null;
    this.currentTab = this.tabs[3]; // Switch to the Messages tab
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
    this.currentTab = this.tabs[3]; // Switch to the Messages tab
  }
}
