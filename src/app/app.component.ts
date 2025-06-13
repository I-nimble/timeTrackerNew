import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CometChatService } from './services/apps/chat/chat.service';
import "@cometchat/uikit-elements";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html'
})
export class AppComponent {
  title = 'Modernize Angular Admin Tempplate';

  constructor(
    private cometChatService: CometChatService,
  ) { }

   ngOnInit(){
    this.cometChatService.initializeCometChat();

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/firebase-messaging-sw.js')
        .catch((error) => {
          console.log('Service Worker registration failed:', error);
        });
    }
   }
}
