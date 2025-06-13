import { Component, OnInit, inject, CUSTOM_ELEMENTS_SCHEMA, ChangeDetectorRef } from '@angular/core';
import { PlansService } from 'src/app/services/plans.service';
import { Plan } from 'src/app/models/Plan.model';
import { CompaniesService } from 'src/app/services/companies.service';
import { EmployeesService } from 'src/app/services/employees.service';
import { CometChatService } from '../../../services/apps/chat/chat.service';
import { CometChatThemeService, ChatConfigurator, CometChatConversationsWithMessages, CometChatGroupsWithMessages } from '@cometchat/chat-uikit-angular';
import '@cometchat/uikit-elements';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/material.module';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NewGroupDialogComponent } from './new-group-dialog/new-group-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { MessagesConfiguration, DetailsConfiguration, AddMembersConfiguration, MessageComposerConfiguration, MessageListConfiguration, ThreadedMessagesConfiguration, MessageHeaderConfiguration } from '@cometchat/uikit-shared';
import { BackdropStyle } from "@cometchat/uikit-elements";
import { Subscription } from 'rxjs';
import { CometChatUIEvents, CometChatMessageTemplate, CometChatUIKitConstants, CometChatTheme } from "@cometchat/uikit-resources"


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
  companies: any[] = [];
  selectedCompanyId!: number;
  public ccActiveChatChanged: Subscription;
  private themeMutationObserver: MutationObserver;
  definedTemplates!: CometChatMessageTemplate[];

  
  // BASIC PLAN CONFIGURATION
  public basicMessagesConfig: MessagesConfiguration;
  public backdropStyle = new BackdropStyle({
    position: 'absolute',
  });
  // ESSENTIAL PLAN CONFIGURATION
  public essentialMessagesConfig: MessagesConfiguration;
  // PROFESSIONAL PLAN CONFIGURATION
  public professionalMessagesConfig: MessagesConfiguration;

  constructor(
    private themeService: CometChatThemeService,
    public chatService: CometChatService,
    private companiesService: CompaniesService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private employeesService: EmployeesService
  ) { 
    const component = this; 
    this.definedTemplates = [
      new CometChatMessageTemplate({
        type: "text",
        category: CometChatUIKitConstants.MessageCategory.message,
        options: (
          loggedInUser: CometChat.User,
          message: CometChat.BaseMessage,
          theme: CometChatTheme,
          group?: CometChat.Group
        ) => {
          const defaultOptions = ChatConfigurator.getDataSource().getMessageOptions(
            loggedInUser,
            message,
            theme,
            group
          );
          return defaultOptions.filter((option: any) => option.id !== 'react');
        }
      })
    ];

    this.professionalMessagesConfig = new MessagesConfiguration({
      disableSoundForMessages: true
    })

    this.essentialMessagesConfig = new MessagesConfiguration({
      disableSoundForMessages: true,
      messageListConfiguration: new MessageListConfiguration({
        // disableReactions: true,
        templates: this.definedTemplates
      }),
      threadedMessageConfiguration: new ThreadedMessagesConfiguration({
        hideMessageComposer: true,
      })
    })

    this.basicMessagesConfig = new MessagesConfiguration({ 
      messageHeaderConfiguration: new MessageHeaderConfiguration({
        menu: [] 
      }),
      disableSoundForMessages: true,
      messageListConfiguration: new MessageListConfiguration({
        // disableReactions: true,
        templates: this.definedTemplates
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
      if (event.group) {
        this.essentialMessagesConfig = new MessagesConfiguration({
          disableSoundForMessages: true,
          messageListConfiguration: new MessageListConfiguration({
            // disableReactions: true,
            templates: this.definedTemplates
          }),
          messageHeaderConfiguration: new MessageHeaderConfiguration({
            menu: [] // Hide call buttons for groups
          }),
          threadedMessageConfiguration: new ThreadedMessagesConfiguration({
            hideMessageComposer: true,
          })
        });
      } else {
        this.essentialMessagesConfig = new MessagesConfiguration({
          disableSoundForMessages: true,
          messageListConfiguration: new MessageListConfiguration({
            // disableReactions: true,
            templates: this.definedTemplates
          }),
          threadedMessageConfiguration: new ThreadedMessagesConfiguration({
            hideMessageComposer: true,
          })
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

  openDialog(): void {
    const dialogRef = this.dialog.open(NewGroupDialogComponent, {
      data: {},
      autoFocus: false,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if(result.group) {
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
