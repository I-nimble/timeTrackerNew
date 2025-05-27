import { Component, OnInit, inject } from '@angular/core';
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
    CommonModule
  ],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss'
})
export class AppChatComponent implements OnInit {
  plansService = inject(PlansService);
  companiesService = inject(CompaniesService);
  plan?: Plan;

  constructor(
    private themeService: CometChatThemeService,
    private cometChatService: CometChatService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.companiesService.getByOwner().subscribe((company: any) => {
      this.plansService.getCurrentPlan(company.company.id).subscribe((companyPlan: any) => {
        this.plan = companyPlan.plan;
      });
    });
    this.configureTheme();
  }

  private configureTheme(): void {
    this.themeService.theme.palette.setMode('light'); // TODO: Set to the current mode in the app
    this.themeService.theme.palette.setPrimary({
      light: '#92b46c',
      dark: '#388E3C'
    });
    this.themeService.theme.typography.setFontFamily('Arial, sans-serif');
  }
}
