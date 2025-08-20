import { Component, OnInit, inject, CUSTOM_ELEMENTS_SCHEMA, ViewChild, TemplateRef } from '@angular/core';
import { PlansService } from 'src/app/services/plans.service';
import { Plan } from 'src/app/models/Plan.model';
import { CompaniesService } from 'src/app/services/companies.service';
import { EmployeesService } from 'src/app/services/employees.service';
import { CometChatService } from '../../../services/apps/chat/chat.service';
import { CometChatThemeService, CometChatConversationsWithMessages, CometChatGroupsWithMessages } from '@cometchat/chat-uikit-angular';
import '@cometchat/uikit-elements';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/material.module';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NewGroupDialogComponent } from './new-group-dialog/new-group-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { MessagesConfiguration, DetailsConfiguration, AddMembersConfiguration, MessageComposerConfiguration, MessageListConfiguration, ThreadedMessagesConfiguration, MessageHeaderConfiguration, ContactsConfiguration, UsersConfiguration, GroupsConfiguration, ConversationsConfiguration } from '@cometchat/uikit-shared';
import { BackdropStyle } from "@cometchat/uikit-elements";
import { Subscription } from 'rxjs';
import { CometChatUIEvents } from "@cometchat/uikit-resources"
import { LoaderComponent } from 'src/app/components/loader/loader.component';
import { Loader } from 'src/app/app.models';

@Component({
  standalone: true,
  selector: 'app-chat',
  imports: [
    CometChatConversationsWithMessages,
    CometChatGroupsWithMessages,
    CommonModule,
    MaterialModule,
    LoaderComponent
  ],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppChatComponent implements OnInit {
  plansService = inject(PlansService);
  plan?: Plan;
  userRole: string | null = localStorage.getItem('role');
  userId: string | null = localStorage.getItem('id');
  groupCreatorUserIds = ['189', '181']; // Steffi and Fernando
  companies: any[] = [];
  selectedCompanyId!: number;
  public ccActiveChatChanged: Subscription;
  private themeMutationObserver: MutationObserver;
  public loader: Loader = new Loader(true, false, false);
  public chatInitError: string | null = null;
  
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
    ...this.chatService.contactsConfiguration,
    // usersConfiguration: new UsersConfiguration({
    //   onItemClick: (user) => {
    //     this.user = user as CometChat.User;
    //     this.group = null;
    //   },
    // }),
    // groupsConfiguration: new GroupsConfiguration({
    //   onItemClick: (group) => {
    //     this.user = null;
    //     this.group = group as CometChat.Group;
    //   },
    // }),
  });

  public conversationConfiguration = new ConversationsConfiguration({
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
  });
  public groupsConfiguration = new GroupsConfiguration({
    onItemClick: async (group) => {
      this.group = group as CometChat.Group;
      this.user = null;
    },
  });

  @ViewChild('customMenu', { static: true }) customMenu!: TemplateRef<any>;
  user: CometChat.User | null = null;
  group: CometChat.Group | null = null;

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
      filter: 'invert(69%) sepia(17%) saturate(511%) hue-rotate(57deg) brightness(91%) contrast(88%)'
    };
  }

  constructor(
    private themeService: CometChatThemeService,
    public chatService: CometChatService,
    private companiesService: CompaniesService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private employeesService: EmployeesService
  ) { }

  ngOnInit(): void {
    try {
      this.configureTheme();
      this.observeAppTheme();
      this.initPlanLogic();
    } catch (err) {
      this.loader = new Loader(true, true, true);
      this.chatInitError = 'There was an error initializing the chat.';
      console.error('Chat initialization error:', err);
    }
  }

  private initPlanLogic() {
    this.ccActiveChatChanged = CometChatUIEvents.ccActiveChatChanged.subscribe((event: any) => {
      if (event.group) {
        this.group = event.group;
        this.user = null;

        this.essentialMessagesConfig = new MessagesConfiguration({
          disableSoundForMessages: true,
          messageListConfiguration: new MessageListConfiguration({
            disableReactions: true,
            templates: this.chatService.templates
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
            templates: this.chatService.templates
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
      messageListConfiguration: new MessageListConfiguration({
        templates: this.chatService.templates
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
      messageListConfiguration: new MessageListConfiguration({
        disableReactions: true,
        templates: this.chatService.templates
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
      messageHeaderConfiguration: new MessageHeaderConfiguration({
        menu: null
      }),
      disableSoundForMessages: true,
      messageListConfiguration: new MessageListConfiguration({
        disableReactions: true,
        templates: this.chatService.templates
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

  openSnackBar(message: string, action: string) {
    this.snackBar.open(message, action, {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }
}
