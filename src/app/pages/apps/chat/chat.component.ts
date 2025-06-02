import { Component, OnInit, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { PlansService } from 'src/app/services/plans.service';
import { Plan } from 'src/app/models/Plan.model';
import { CompaniesService } from 'src/app/services/companies.service';
import { CometChatConversationsWithMessages, CometChatGroups, CometChatMessageComposer, CometChatMessageHeader, CometChatMessageList, CometChatUsers } from '@cometchat/chat-uikit-angular';
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
import { ConversationsConfiguration, MessagesConfiguration, ContactsConfiguration } from '@cometchat/uikit-shared';

@Component({
  standalone: true,
  selector: 'app-chat',
  imports: [
    CometChatConversationsWithMessages,
    CometChatGroups,
    CometChatUsers,
    CometChatMessageComposer,
    CometChatMessageHeader,
    CometChatMessageList,
    CometChatCallButtons,
    CommonModule,
    MaterialModule
  ],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss',
})
export class AppChatComponent implements OnInit {
  plansService = inject(PlansService);
  plan?: Plan;
  userRole: string | null = localStorage.getItem('role');
  companies: any[] = [];
  selectedCompanyId!: number;
  public conversationsConfigurations = new ConversationsConfiguration({});
  public messagesConfiguration = new MessagesConfiguration({});
  public startConversationConfiguration = new ConversationsConfiguration({});

  constructor(
    private themeService: CometChatThemeService,
    public chatService: CometChatService,
    private companiesService: CompaniesService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    if(this.userRole === '3') {
      this.companiesService.getByOwner().subscribe((company: any) => {
        this.plansService.getCurrentPlan(company.company.id).subscribe((companyPlan: any) => {
          this.plan = companyPlan.plan;
          this.initializeConfigurations();
        });
      });
    }
    else if (this.userRole === '1') {
      this.getCompanies();
    }
    this.configureTheme();
  }

  // Set configurations for every plan
  initializeConfigurations() {
    console.log('PLAN: ', this.plan)
    if(this.plan?.name === 'Basic') {
      // Free plan
      this.conversationsConfigurations = new ConversationsConfiguration({
        conversationsRequestBuilder: new CometChat.ConversationsRequestBuilder().setConversationType('group').setLimit(50),
      });
    }
    else if(this.plan?.name === 'Essential') {
      // Essential plan
    }
    else if(this.plan?.name === 'Professional') {
      // Proffessional plan
    }
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
