import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { WebSocketService } from './services/socket/web-socket.service';
import { NotificationStore } from './stores/notification.store';
import { CometChatService } from './services/apps/chat/chat.service';
import { CometChatThemeService, CometChatUIKit } from '@cometchat/chat-uikit-angular';
import "@cometchat/uikit-elements";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html'
})
export class AppComponent {
  title = 'Modernize Angular Admin Tempplate';

  constructor(
    private socketService: WebSocketService,
    private cometChatService: CometChatService,
    private themeService: CometChatThemeService
  ) { }

   ngOnInit(){
    this.cometChatService.initializeCometChat();
   }
}
