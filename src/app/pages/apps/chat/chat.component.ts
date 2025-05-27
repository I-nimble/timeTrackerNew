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
  selectedUser!: CometChat.User;
  selectedGroup!: CometChat.Group;
  selectedConversation: any = null;
  public userObject!: CometChat.User;
  plansService = inject(PlansService);
  companiesService = inject(CompaniesService);
  plan?: Plan;

  constructor(
    private themeService: CometChatThemeService,
    private cometChatService: CometChatService
  ) { }

  ngOnInit(): void {
    this.companiesService.getByOwner().subscribe((company: any) => {
      this.plansService.getCurrentPlan(company.company.id).subscribe((companyPlan: any) => {
        this.plan = companyPlan.plan;
        console.log('plan', companyPlan.plan);
      });
    });
    this.configureTheme();
    CometChat.getUser('cometchat-uid-2').then((user: CometChat.User) => {
      this.selectedUser = user;
    });
  }

  private configureTheme(): void {
    this.themeService.theme.palette.setMode('light');
    this.themeService.theme.palette.setPrimary({
      light: '#92b46c',
      dark: '#388E3C'
    });
    this.themeService.theme.typography.setFontFamily('Arial, sans-serif');
  }

  handleUserSelection(user: CometChat.User): void {
    this.selectedUser = user;
    //this.selectedGroup = null;
    this.selectedConversation = user;
    console.log("el plan", this.plan?.name);
    console.log('your custom on item click action', this.selectedUser);
  }

  handleGroupSelection(group: CometChat.Group): void {
    this.selectedGroup = group;
    //this.selectedUser = null;
    this.selectedConversation = group;
    console.log('your custom on item click action', this.selectedGroup);
  }

  public handleOnItemClickGroup = (group: CometChat.Group) => {
    console.log('your custom on item click action', group);
  };

  messageComposerStyle = new MessageComposerStyle({
    background: '#F8F9FA',
    border: '1px solid #E0E0E0',
    borderRadius: '28px',
    inputBackground: 'transparent',
    textColor: '#2D3436',
    sendIconTint: '#92B46C',
    //attachIconTint: "#6C757D",
    emojiIconTint: '#6C757D',
    dividerTint: 'transparent',
    //placeholderTextColor: '#ADB5BD',
    //height: '56px',
  });

  callButtonsStyle = new CallButtonsStyle({
    background: 'transparent',
    //height: '50px',
    //width: '400px',
    //border: '1px solid #f8f5fa',
    buttonBackground: 'transparent',
    buttonBorderRadius: '10px',
    videoCallIconTextColor: 'transparent',
    voiceCallIconTextColor: 'transparent',
    //buttonPadding: '20px',
    voiceCallIconTint: '#6C757D',
    videoCallIconTint: '#6C757D',
  });

  callButtonsStyleBasic = new CallButtonsStyle({
    background: 'transparent',
    //height: '50px',
    //width: '400px',
    //border: '1px solid #f8f5fa',
    buttonBackground: 'transparent',
    buttonBorderRadius: '10px',
    videoCallIconTextColor: 'transparent',
    voiceCallIconTextColor: 'transparent',
    //buttonPadding: '20px',
    voiceCallIconTint: '#6C757D',
    videoCallIconTint: 'transparent',
  });
}
