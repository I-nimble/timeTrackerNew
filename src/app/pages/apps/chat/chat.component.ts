import { Component, OnInit, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { PlansService } from 'src/app/services/plans.service';
import { Plan } from 'src/app/models/Plan.model';
import { CompaniesService } from 'src/app/services/companies.service';
import { CometChatConversationsWithMessages, CometChatGroupsWithMessages, CometChatGroups, CometChatMessageComposer, CometChatMessageHeader, CometChatMessageList, CometChatUsers } from '@cometchat/chat-uikit-angular';
import { CometChatService } from '../../../services/apps/chat/chat.service';
import { MessageComposerStyle, CallButtonsStyle } from '@cometchat/uikit-shared';
import { CometChatThemeService, CometChatCallButtons } from '@cometchat/chat-uikit-angular';
import '@cometchat/uikit-elements';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef } from '@angular/core';
import { MaterialModule } from 'src/app/material.module';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NewGroupDialogComponent } from './new-group-dialog/new-group-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { ConversationsConfiguration, MessagesConfiguration, DetailsConfiguration, GroupsConfiguration, AddMembersConfiguration, MessageComposerConfiguration, MessageListConfiguration, ThreadedMessagesConfiguration } from '@cometchat/uikit-shared';
import { BackdropStyle, CreateGroupStyle } from "@cometchat/uikit-elements";
import { EmployeesService } from 'src/app/services/employees.service';
import { CometChatIncomingCall } from "@cometchat/chat-uikit-angular";

@Component({
  standalone: true,
  selector: 'app-chat',
  imports: [
    CometChatConversationsWithMessages,
    CometChatGroupsWithMessages,
    CometChatGroups,
    CometChatUsers,
    CometChatMessageComposer,
    CometChatMessageHeader,
    CometChatMessageList,
    CometChatCallButtons,
    CometChatIncomingCall,
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
  
  // BASIC PLAN CONFIGURATION
  public basicMessagesConfig: MessagesConfiguration;
  public backdropStyle = new BackdropStyle({
    position: 'absolute',
  });
  // ESSENTIAL PLAN CONFIGURATION
  public essentialMessagesConfig: MessagesConfiguration;
  // TODO: Remove conference call

  // TODO: Disable SoundForMessages

  constructor(
    private themeService: CometChatThemeService,
    public chatService: CometChatService,
    private companiesService: CompaniesService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private employeesService: EmployeesService
  ) { 
    const component = this; 

    this.essentialMessagesConfig = new MessagesConfiguration({
      messageListConfiguration: new MessageListConfiguration({
        disableReactions: true,
      }),
      threadedMessageConfiguration: new ThreadedMessagesConfiguration({
        hideMessageComposer: true,
      })
    })

    this.basicMessagesConfig = new MessagesConfiguration({ // For Basic plan
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
              if (currentCount + members.length > 5) {
                component.openSnackBar('You can only have up to 5 members in a group.', 'Close');
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
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(NewGroupDialogComponent, {
      data: {},
      autoFocus: false,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if(result.group) {
        this.openSnackBar('Group Created successfully!', 'Close');
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

  handleCompanySelection(event: any) {
    this.selectedCompanyId = event.value;
    this.plan = {
      id: this.companies.find(c => c.id === this.selectedCompanyId).current_plan_id
    };
    this.chatService.logout();
    this.chatService.getChatCredentials(this.selectedCompanyId).subscribe({
      next: (credentials: any) => {
        this.chatService.initializeCometChat(this.selectedCompanyId);
      },
      error: (err) => {
        this.openSnackBar('The company chat is not available', 'Close');
      }
    });
  }

  private configureTheme(): void {
    this.themeService.theme.palette.setMode('light'); // TODO: Set to the current mode in the app
    this.themeService.theme.palette.setPrimary({
      light: '#92b46c',
      dark: '#388E3C'
    });
    this.themeService.theme.typography.setFontFamily('Arial, sans-serif');
  }

  openSnackBar(message: string, action: string) {
    this.snackBar.open(message, action, {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }
}
