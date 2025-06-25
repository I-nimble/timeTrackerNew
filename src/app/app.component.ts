import { Component, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CometChatService } from './services/apps/chat/chat.service';
import { CometChatIncomingCall, CometChatOngoingCall, CometChatOutgoingCall } from '@cometchat/chat-uikit-angular';
import "@cometchat/uikit-elements";
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatCalls } from "@cometchat/calls-sdk-javascript";
import { CallSettings } from '@cometchat/calls-sdk-javascript/pack/src/models/CallSettings';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CometChatIncomingCall, CometChatOngoingCall, CometChatOutgoingCall],
  templateUrl: './app.component.html',
  schemas : [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Modernize Angular Admin Tempplate';
  private callListenerId = 'APP_CALL_LISTENER';
  sessionId!: string;
  callSettings!: CallSettings;
  callScreen!: HTMLElement;

  constructor(
    public cometChatService: CometChatService
  ) { }

  ngOnInit(){
    this.cometChatService.initializeCometChat();
    this.callScreen = document.getElementById('callScreen') as HTMLElement;

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/firebase-messaging-sw.js')
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }

    CometChat.addCallListener(
      this.callListenerId,
      new CometChat.CallListener({
        onOutgoingCallAccepted: (call:any) => {
          this.cometChatService.isCallOngoing = true;
          this.cometChatService.outGoingCallObject = null;
          this.sessionId = call.getSessionId();
          
          this.callSettings = new CometChatCalls.CallSettingsBuilder()
            .enableDefaultLayout(true)
            .setIsAudioOnlyCall(call.getType() === 'audio')
            .setCallListener(new CometChatCalls.OngoingCallListener({
              onCallEndButtonPressed: () => {
                this.clearCall();
              },
              onCallEnded: () => {
                this.clearCall();
              }
            }))
            .build();

          CometChatCalls.startSession(
            this.sessionId,
            this.callSettings,
            document.getElementById('callScreen') as HTMLElement,
          );
        },
        onOutgoingCallRejected: (call:any) => {
          this.clearCall();
        },
        onIncomingCallCancelled: (call:any) => {
          this.clearCall();
        }
      })
    );
  }

  clearCall = () => {
    CometChatCalls.endSession();
    CometChat.clearActiveCall();
    this.cometChatService.isCallOngoing = false;
    this.cometChatService.outGoingCallObject = null;
    this.cometChatService.callObject = null;
    this.sessionId = '';
    this.callSettings = undefined as any;
  }

  public handleOnCloseClicked = () => {
    const sessionId = this.cometChatService.outGoingCallObject?.getSessionId();
    if (sessionId) {
      CometChat.rejectCall(sessionId, CometChat.CALL_STATUS.CANCELLED).then(
        (call) => {
          this.cometChatService.outGoingCallObject = null;
          this.cometChatService.isCallOngoing = false;
        },
        (error) => {
          console.error("Call cancel failed:", error);
        }
      );
    }
  };

  ngOnDestroy() {
    CometChat.removeCallListener(this.callListenerId);
  }
}
