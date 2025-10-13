import { Component, OnInit, inject, CUSTOM_ELEMENTS_SCHEMA, ViewChild, TemplateRef, ElementRef, HostListener, ChangeDetectorRef } from '@angular/core';
import { PlansService } from 'src/app/services/plans.service';
import { Plan } from 'src/app/models/Plan.model';
import { CompaniesService } from 'src/app/services/companies.service';
import { EmployeesService } from 'src/app/services/employees.service';
import { CometChatService } from '../../../services/apps/chat/chat.service';
import { CometChatThemeService, CometChatTheme, CometChatConversationsWithMessages, CometChatGroupsWithMessages, CometChatUIKit } from '@cometchat/chat-uikit-angular';
import '@cometchat/uikit-elements';
import { CometChat } from '@cometchat/chat-sdk-javascript';
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

interface InlineImage {
  id: string;
  file: File;
  dataUrl: string;
  position: number;
}

@Component({
  standalone: true,
  selector: 'app-chat',
  imports: [
    CometChatConversationsWithMessages,
    CometChatGroupsWithMessages,
    CommonModule,
    MaterialModule,
    LoaderComponent,
    CustomMessageComposerComponent
  ],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppChatComponent implements OnInit {
  @ViewChild('contactsView', { static: true }) contactsView!: TemplateRef<any>;
  @ViewChild('customMenu', { static: true }) customMenu!: TemplateRef<any>;
  @ViewChild('conversationsMenuTemplate', { static: true }) conversationsMenuTemplate!: TemplateRef<any>;
  @ViewChild('customMessageComposerView', { static: true }) customMessageComposerView!: TemplateRef<any>;
  @ViewChild('basicChat') basicChat: any;
  @ViewChild('essentialChat') essentialChat: any;
  @ViewChild('professionalChat') professionalChat: any;
  @ViewChild('customHeaderView') customHeaderView: TemplateRef<any>;

  plansService = inject(PlansService);
  plan?: Plan;
  userRole: string | null = localStorage.getItem('role');
  userId: string | null = localStorage.getItem('id');
  groupCreatorUserIds = ['189', '181']; // Steffi and Fernando
  companies: any[] = [];
  selectedCompanyId!: number;
  showContacts: boolean = false;
  public ccActiveChatChanged: Subscription;
  private themeMutationObserver: MutationObserver;
  public loader: Loader = new Loader(true, false, false);
  public chatInitError: string | null = null;
  templates: CometChatMessageTemplate[] = [];
  public replyMessage: any = null;

  // BASIC PLAN CONFIGURATION
  public basicMessagesConfig: MessagesConfiguration;
  public backdropStyle = new BackdropStyle({
    position: 'absolute',
  });
  // ESSENTIAL PLAN CONFIGURATION
  public essentialMessagesConfig: MessagesConfiguration;
  // PROFESSIONAL PLAN CONFIGURATION
  public professionalMessagesConfig: MessagesConfiguration;

  public StartConversationConfiguration: ContactsConfiguration = new ContactsConfiguration({
      usersConfiguration: new UsersConfiguration({
        onItemClick: (user) => {
          const btnContainer = document.querySelector("#chat-container > div > div.cc-with-messages__start-conversation.ng-star-inserted > cometchat-contacts > div > div.cc-close-button > cometchat-button") as HTMLElement;
          const btn = btnContainer.shadowRoot?.querySelector("button") as HTMLElement;
          if (btn) btn.click();

          this.user = user as CometChat.User;
          this.group = null;
        },
        usersRequestBuilder: new CometChat.UsersRequestBuilder()
          .setLimit(100)
          .friendsOnly(true),
        searchRequestBuilder: new CometChat.UsersRequestBuilder()
          .setLimit(100)
          .friendsOnly(true),
        hideSeparator: true,
      }),
      groupsConfiguration: new GroupsConfiguration({
        onItemClick: (group) => {
          const btnContainer = document.querySelector("#chat-container > div > div.cc-with-messages__start-conversation.ng-star-inserted > cometchat-contacts > div > div.cc-close-button > cometchat-button") as HTMLElement;
          const btn = btnContainer.shadowRoot?.querySelector("button") as HTMLElement;
          if (btn) btn.click();

          this.user = null;
          this.group = group as CometChat.Group;
        },
        menu: this.conversationsMenuTemplate,
        groupsRequestBuilder: new CometChat.GroupsRequestBuilder()
          .setLimit(100)
          .joinedOnly(true),
        searchRequestBuilder: new CometChat.GroupsRequestBuilder()
          .setLimit(100)
          .joinedOnly(true)
      }),
      contactsStyle: new ContactsStyle({
        activeTabBackground: '#92b46c',
        activeTabTitleTextColor: '#fff',
        tabBorderRadius: '16px',
        tabBorder: 'none'
      })
    });

  public conversationConfiguration!: ConversationsConfiguration;
  public groupsConfiguration: GroupsConfiguration;

  user: CometChat.User | null = null;
  group: CometChat.Group | null = null;
  isSelect: boolean = false;

  getButtonStyle() {
    return {
      height: '20px',
      width: '20px',
      border: 'none',
      borderRadius: '0',
      background: 'transparent',
      padding: '0',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    };
  }
  getButtonIconStyle() {
    return {
      filter: 'invert(8%) sepia(18%) saturate(487%) hue-rotate(57deg) brightness(91%) contrast(88%)'
    };
  }

  constructor(
    private themeService: CometChatThemeService,
    public chatService: CometChatService,
    private companiesService: CompaniesService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private employeesService: EmployeesService,
    public ref: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    try {
      this.configureTheme();
      this.observeAppTheme();
      this.createCustomMessageTemplates();
      this.initPlanLogic();
    } catch (err) {
      this.loader = new Loader(true, true, true);
      this.chatInitError = 'There was an error initializing the chat.';
      console.error('Chat initialization error:', err);
    }
  }

  private initPlanLogic() {
    this.ccActiveChatChanged = CometChatUIEvents.ccActiveChatChanged.subscribe((event: any) => {
      this.replyMessage = null;
      if (event.group) {
        this.group = event.group;
        this.user = null;

        this.essentialMessagesConfig = new MessagesConfiguration({
          disableSoundForMessages: true,
          messageListConfiguration: new MessageListConfiguration({
            disableReactions: true,
            templates: this.templates,
            showAvatar: true,
            scrollToBottomOnNewMessages: true,
            datePattern: DatePatterns.DateTime,
            timestampAlignment: TimestampAlignment.bottom,
          }),
          messageHeaderConfiguration: new MessageHeaderConfiguration({
            menu: null // Hide call buttons for groups
          }),
          threadedMessageConfiguration: new ThreadedMessagesConfiguration({
            hideMessageComposer: true,
          })
        });
      } else {
        this.user = event.user;
        this.group = null;

        this.essentialMessagesConfig = new MessagesConfiguration({
          disableSoundForMessages: true,
          messageListConfiguration: new MessageListConfiguration({
            disableReactions: true,
            templates: this.templates,
            showAvatar: true,
            scrollToBottomOnNewMessages: true,
            datePattern: DatePatterns.DateTime,
            timestampAlignment: TimestampAlignment.bottom,
          }),
          threadedMessageConfiguration: new ThreadedMessagesConfiguration({
            hideMessageComposer: true,
          }),
          messageHeaderConfiguration: new MessageHeaderConfiguration({
            menu: this.customMenu
          }),
        })
      }
    });

    try {
      this.conversationConfiguration = new ConversationsConfiguration({
        onItemClick: async (conversation) => {
          const conv = conversation.getConversationWith();
          const convType = conversation.getConversationType();

          if (convType === 'user') {
            this.user = conv as CometChat.User;
            this.group = null;
          } else if (convType === 'group') {
            this.group = conv as CometChat.Group;
            this.user = null;
          }
        },
        menu: this.conversationsMenuTemplate
      });

      if(this.userRole === '3') {
        this.companiesService.getByOwner().subscribe({
          next: (company: any) => {
            this.plansService.getCurrentPlan(company.company.id).subscribe({
              next: (companyPlan: any) => {
                this.plan = companyPlan.plan || { id: companyPlan[0] };
                this.loader = new Loader(true, true, false);
              },
              error: (err) => {
                this.loader = new Loader(true, true, true);
                this.chatInitError = 'There was an error loading the plan.';
                console.error('Plan loading error:', err);
              }
            });
          },
          error: (err) => {
            this.loader = new Loader(true, true, true);
            this.chatInitError = 'There was an error loading the company.';
            console.error('Company loading error:', err);
          }
        });
      }
      else if (this.userRole === '2') {
        this.employeesService.getByEmployee().subscribe({
          next: (employees: any) => {
            this.plansService.getCurrentPlan(employees.company_id).subscribe({
              next: (companyPlan: any) => {
                this.plan = companyPlan.plan || { id: companyPlan[0] };
                this.loader = new Loader(true, true, false);
              },
              error: (err) => {
                this.loader = new Loader(true, true, true);
                this.chatInitError = 'There was an error loading the plan.';
                console.error('Plan loading error:', err);
              }
            });
          },
          error: (err) => {
            this.loader = new Loader(true, true, true);
            this.chatInitError = 'There was an error loading the employee.';
            console.error('Employee loading error:', err);
          }
        });
      } else {
        this.plan = {
          "name": "Professional",
          "id": 3
        }
        this.loader = new Loader(true, true, false);
      }
    } catch (err) {
      this.loader = new Loader(true, true, true);
      this.chatInitError = 'There was an error initializing the chat.';
      console.error('Chat initialization error:', err);
    }
  }

  ngAfterViewInit() {
    document.addEventListener('cc-image-clicked', () => {
      const viewer = document.querySelector('cometchat-full-screen-viewer');
      if (viewer) {
        document.body.appendChild(viewer);
      }
    });

    const component = this;

    this.professionalMessagesConfig = new MessagesConfiguration({
      disableSoundForMessages: true,
      messageComposerView: this.customMessageComposerView,
      messageListConfiguration: new MessageListConfiguration({
        templates: this.templates,
        showAvatar: true,
        scrollToBottomOnNewMessages: true,
        datePattern: DatePatterns.DateTime,
        timestampAlignment: TimestampAlignment.bottom
      }),
      messageHeaderConfiguration: new MessageHeaderConfiguration({
        menu: this.customMenu
      }),
      detailsConfiguration: new DetailsConfiguration({
        addMembersConfiguration: new AddMembersConfiguration({
          usersRequestBuilder: new CometChat.UsersRequestBuilder()
            .setLimit(100)
            .friendsOnly(true)
        })
      })
    })

    this.essentialMessagesConfig = new MessagesConfiguration({
      disableSoundForMessages: true,
      messageComposerView: this.customMessageComposerView,
      messageListConfiguration: new MessageListConfiguration({
        disableReactions: true,
        templates: this.templates,
        showAvatar: true,
        scrollToBottomOnNewMessages: true,
        datePattern: DatePatterns.DateTime,
        timestampAlignment: TimestampAlignment.bottom
      }),
      threadedMessageConfiguration: new ThreadedMessagesConfiguration({
        hideMessageComposer: true,
      }),
      messageHeaderConfiguration: new MessageHeaderConfiguration({
        menu: this.customMenu
      }),
      detailsConfiguration: new DetailsConfiguration({
        addMembersConfiguration: new AddMembersConfiguration({
          usersRequestBuilder: new CometChat.UsersRequestBuilder()
            .setLimit(100)
            .friendsOnly(true)
        })
      })
    })

    this.basicMessagesConfig = new MessagesConfiguration({
      messageComposerView: this.customMessageComposerView,
      messageHeaderConfiguration: new MessageHeaderConfiguration({
        menu: null
      }),
      disableSoundForMessages: true,
      messageListConfiguration: new MessageListConfiguration({
        disableReactions: true,
        templates: this.templates,
        showAvatar: true,
        scrollToBottomOnNewMessages: true,
        datePattern: DatePatterns.DateTime,
        timestampAlignment: TimestampAlignment.bottom
      }),
      threadedMessageConfiguration: new ThreadedMessagesConfiguration({
        hideMessageComposer: true,
      }),
      messageComposerConfiguration: new MessageComposerConfiguration({
        hideVoiceRecording: true
      }),
      detailsConfiguration: new DetailsConfiguration({
        addMembersConfiguration: new AddMembersConfiguration({
          onAddMembersButtonClick: function (guid: string, members: CometChat.User[]) {
            const membersRequest = new CometChat.GroupMembersRequestBuilder(guid)
              .setLimit(100)
              .build();

            membersRequest.fetchNext().then(response => {
              const currentCount = response.length;
              if (currentCount + members.length > 6) {
                component.openSnackBar('You can only have up to 5 team members in a group.', 'Close');
              } else {
                  const groupMembers = members.map(u => new CometChat.GroupMember((u as any).uid, CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT));
                  CometChat.addMembersToGroup(
                    guid,
                    groupMembers,
                    [] // empty bannedMembersList
                  ).then(() => {
                    if (this.onClose) this.onClose();
                  });
              }
            });
          },
          usersRequestBuilder: new CometChat.UsersRequestBuilder()
            .setLimit(100)
            .friendsOnly(true)
        })
      })
    })

    this.groupsConfiguration = new GroupsConfiguration({
      onItemClick: async (group) => {
        this.group = group as CometChat.Group;
        this.user = null;
      },
      menu: this.conversationsMenuTemplate,
    })
  }

  startVoiceCall() {
    if (this.user) {
      const receiverID = this.user.getUid();
      const callType = CometChat.CALL_TYPE.AUDIO;
      const receiverType = CometChat.RECEIVER_TYPE.USER;
      this.chatService.callObject = new CometChat.Call(receiverID, callType, receiverType);
      CometChat.initiateCall(this.chatService.callObject).then(
        (call: any) => {
          this.chatService.outGoingCallObject = call;
          this.chatService.callObject = call;
        },
        (error: any) => console.error("Voice call initiation failed:", error)
      );
    } else if (this.group) {
      const receiverID = this.group.getGuid();
      const callType = CometChat.CALL_TYPE.AUDIO;
      const receiverType = CometChat.RECEIVER_TYPE.GROUP;
      this.chatService.callObject = new CometChat.Call(receiverID, callType, receiverType);
      CometChat.initiateCall(this.chatService.callObject).then(
        (call: any) => {
          this.chatService.outGoingCallObject = call;
          this.chatService.callObject = call;
        },
        (error: any) => console.error("Group voice call initiation failed:", error)
      );
    }
  }

  startVideoCall() {
    if (this.user) {
      const receiverID = this.user.getUid();
      const callType = CometChat.CALL_TYPE.VIDEO;
      const receiverType = CometChat.RECEIVER_TYPE.USER;
      this.chatService.callObject = new CometChat.Call(receiverID, callType, receiverType);
      CometChat.initiateCall(this.chatService.callObject).then(
        (call: any) => {
          this.chatService.outGoingCallObject = call;
          this.chatService.callObject = call;
        },
        (error: any) => console.error("Video call initiation failed:", error)
      );
    } else if (this.group) {
      const receiverID = this.group.getGuid();
      const callType = CometChat.CALL_TYPE.VIDEO;
      const receiverType = CometChat.RECEIVER_TYPE.GROUP;
      this.chatService.callObject = new CometChat.Call(receiverID, callType, receiverType);
      CometChat.initiateCall(this.chatService.callObject).then(
        (call: any) => {
          this.chatService.outGoingCallObject = call;
          this.chatService.callObject = call;
        },
        (error: any) => console.error("Group video call initiation failed:", error)
      );
    }
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(NewGroupDialogComponent, {
      data: {},
      autoFocus: false,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if(result?.group) {
        this.openSnackBar('Group Created successfully!', 'Close');
        this.chatService.isChatAvailable = false;
        setTimeout(() => {
          this.chatService.isChatAvailable = true;
        }, 100);
      }
    });
  }

  private configureTheme(): void {
    const htmlElement = document.querySelector('html');
    if (htmlElement?.classList.contains('dark-theme')) {
      this.themeService.theme.palette.setMode('dark');
    } else {
      this.themeService.theme.palette.setMode('light');
    }
    this.themeService.theme.palette.setPrimary({
      light: '#92b46c',
      dark: '#388E3C'
    });
    this.themeService.theme.palette.setBackground({
      light: '#ffffff',
      dark: "#111c2d"
    });
    this.themeService.theme.palette.setSecondary({
      light: '#e5eaef',
      dark: '#15263a'
    })
    this.themeService.theme.typography.setFontFamily('Montserrat, sans-serif');
  }

  private observeAppTheme(): void {
    const htmlElement = document.querySelector('html');
    if (!htmlElement) return;
    this.themeMutationObserver = new MutationObserver(() => {
      this.chatService.isChatAvailable = false;
      setTimeout(() => {
        if (htmlElement.classList.contains('dark-theme')) {
          this.themeService.theme.palette.setMode('dark');
        } else {
          this.themeService.theme.palette.setMode('light');
        }
        this.chatService.isChatAvailable = true;
      }, 100);
    });
    this.themeMutationObserver.observe(htmlElement, { attributes: true, attributeFilter: ['class'] });
  }

  onMenuButtonClick() {
    this.showContacts = !this.showContacts;
    if (this.plan && this.plan.id === 2 && this.essentialChat) {
      this.essentialChat.showStartConversation = this.showContacts;
    }
    if ((this.plan && this.plan.id === 3) && this.professionalChat) {
      this.professionalChat.showStartConversation = this.showContacts;
    }
    this.ref.detectChanges();
  }

  private createCustomMessageTemplates() {
    this.templates = CometChatUIKit.getDataSource().getAllMessageTemplates(this.themeService.theme);
    this.templates = this.templates.map(template => {
      const newTemplate = Object.assign(Object.create(Object.getPrototypeOf(template)), template);
      // Dont allow group owner to edit/delete messages of other members
      newTemplate.options = (
        loggedInUser: CometChat.User,
        message: CometChat.BaseMessage,
        theme: CometChatTheme,
        group?: CometChat.Group
      ) => {
        let options = CometChatUIKit.getDataSource().getMessageOptions(
          loggedInUser,
          message,
          theme,
          group
        );
        if (
          group &&
          group.getOwner &&
          group.getOwner() === loggedInUser.getUid() &&
          message.getSender().getUid() !== loggedInUser.getUid()
        ) {
          options = options.filter(
            (option: CometChatMessageOption) =>
              option.id !== 'edit' && option.id !== 'delete'
          );
        }
        // Replace default thread reply with custom option
        options = options.map((option: CometChatMessageOption) => {
          if (option.id === 'replyInThread') {
            option.onClick = async () => {
              this.replyMessage = message;
            }
          }
          // NOTE: Here i can modify the edit option to save the id of the message to be edited and fill the custom message composer with its text in edit mode, on send message modify it. This would fix the issue of editing messages.
          return option;
        });
        return options;
      };
      newTemplate.headerView = () => this.customHeaderView;
      return newTemplate;
    });
  }

  toDate(timestamp: any) {
		return new Date(timestamp * 1000);
	}

  openSnackBar(message: string, action: string) {
    this.snackBar.open(message, action, {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }

  ngOnDestroy() {
    if (this.themeMutationObserver) {
      this.themeMutationObserver.disconnect();
    }
    if (this.ccActiveChatChanged) {
      this.ccActiveChatChanged.unsubscribe();
    }
  }
}
