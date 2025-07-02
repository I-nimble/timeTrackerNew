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
import { MessagesConfiguration, DetailsConfiguration, AddMembersConfiguration, MessageComposerConfiguration, MessageListConfiguration, ThreadedMessagesConfiguration, MessageHeaderConfiguration, ContactsConfiguration, UsersConfiguration } from '@cometchat/uikit-shared';
import { BackdropStyle } from "@cometchat/uikit-elements";
import { Subscription } from 'rxjs';
import { CometChatUIEvents } from "@cometchat/uikit-resources"

@Component({
  standalone: true,
  selector: 'app-chat',
  imports: [
    CometChatConversationsWithMessages,
    CometChatGroupsWithMessages,
    CommonModule,
    MaterialModule
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
  public contactsConfiguration: ContactsConfiguration = new ContactsConfiguration({
    usersConfiguration: new UsersConfiguration({
      hideSeparator: true
    })
  });
  
  // BASIC PLAN CONFIGURATION
  public basicMessagesConfig: MessagesConfiguration;
  public backdropStyle = new BackdropStyle({
    position: 'absolute',
  });
  // ESSENTIAL PLAN CONFIGURATION
  public essentialMessagesConfig: MessagesConfiguration;
  // PROFESSIONAL PLAN CONFIGURATION
  public professionalMessagesConfig: MessagesConfiguration;

  @ViewChild('customMenu', { static: true }) customMenu!: TemplateRef<any>;
  currentChatContext: any = null;

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
  ) { 
    const component = this;

    this.professionalMessagesConfig = new MessagesConfiguration({
      disableSoundForMessages: true,
      messageListConfiguration: new MessageListConfiguration({
        templates: this.chatService.templates
      }),
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
    })

    this.basicMessagesConfig = new MessagesConfiguration({ 
      messageHeaderConfiguration: new MessageHeaderConfiguration({
        menu: [] 
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
          }
        })
      })
    })
  }

  ngOnInit(): void {
    this.ccActiveChatChanged = CometChatUIEvents.ccActiveChatChanged.subscribe((event: any) => {
      this.currentChatContext = event;
      if (event.group) {
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

    if(this.userRole === '3') {
      this.companiesService.getByOwner().subscribe((company: any) => {
        this.plansService.getCurrentPlan(company.company.id).subscribe((companyPlan: any) => {
          this.plan = companyPlan.plan; 
        });
      });
    }
    else if (this.userRole === '2') {
      this.employeesService.getByEmployee().subscribe((employees: any) => {
        this.plansService.getCurrentPlan(employees.company_id).subscribe((companyPlan: any) => {
          this.plan = companyPlan.plan;
        });
      });
    }
    else if (this.userRole === '1') {
      this.getCompanies();
    }
    this.configureTheme();
    this.observeAppTheme();
  }

  ngAfterViewInit() {
    document.addEventListener('cc-image-clicked', () => {
      const viewer = document.querySelector('cometchat-full-screen-viewer');
      if (viewer) {
        document.body.appendChild(viewer);
      }
    });
  }

  startVoiceCall() {
    const context = this.currentChatContext;
    if (context.user) {
      const receiverID = context.user.uid;
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
    } else if (context.group) {
      const receiverID = context.group.guid;
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
    const context = this.currentChatContext;
    if (context.user) {
      const receiverID = context.user.uid;
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
    } else if (context.group) {
      const receiverID = context.group.guid;
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
        this.getCompanies();
      }
    });
  }
  
  getCompanies() {
    this.companiesService.getCompanies().subscribe({
      next: (companies: any) => {
        this.companies = companies;
      },
    });
  }

  async handleCompanySelection(event: any) {
    try {
      await this.chatService.logout();
  
      this.selectedCompanyId = event?.value;
      const selectedCompany = this.companies.find(c => c.id === this.selectedCompanyId);
      this.plan = {
        id: selectedCompany?.current_plan_id
      };
      this.chatService.initializeCometChat(this.selectedCompanyId);
    }
    catch (error) {
      this.openSnackBar('Error initializing chat', 'Close');
      console.error(error);
    }
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
