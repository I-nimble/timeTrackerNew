import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, CUSTOM_ELEMENTS_SCHEMA, ChangeDetectorRef } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CometChatService } from './services/apps/chat/chat.service';
import { CometChatOngoingCall, CometChatOutgoingCall } from '@cometchat/chat-uikit-angular';
import "@cometchat/uikit-elements";
import { CometChat } from '@cometchat/chat-sdk-javascript-new';
import { CometChatCalls } from '@cometchat/calls-sdk-javascript-new';
import { CometChatUIKitConstants, CometChatCallEvents } from '@cometchat/uikit-resources';
import { StorageUtils } from '@cometchat/uikit-shared';
import { CustomIncomingCallComponent } from './components/custom-incoming-call/custom-incoming-call.component';
import { RocketChatService } from './services/rocket-chat.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CometChatOngoingCall, CometChatOutgoingCall, CustomIncomingCallComponent],
  templateUrl: './app.component.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.Default
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Modernize Angular Admin Template';
  private callListenerId = 'APP_CALL_LISTENER';
  sessionId!: string;
  callSettingsBuilder!: any;
  callScreen!: HTMLElement;
  incomingCall: any = null;
  loggedInUID: string = '';
  outgoingCall: any = null;
  ongoingCall: any = null;
  ccCallEnded!: any;

  constructor(
    public cometChatService: CometChatService,
    private cdr: ChangeDetectorRef,
    private rocketChatService: RocketChatService
  ) { }

  async ngOnInit() {
    this.rocketChatService.loadCredentials();
    this.rocketChatService.saveUserData();

    await this.cometChatService.initializeCometChat();
    this.callScreen = document.getElementById('callScreen') as HTMLElement;

    const user = await CometChat.getLoggedinUser();
    if (user) {
      this.loggedInUID = user.getUid();
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/firebase-messaging-sw.js')
        .catch(error => console.error('Service Worker registration failed:', error));
    }

    CometChat.addMessageListener("UNIQUE_LISTENER_ID", this.createMessageListener());

    CometChat.addCallListener(this.callListenerId, this.createCallListener());

    this.ccCallEnded = CometChatCallEvents.ccCallEnded.subscribe(
      (call: CometChat.Call) => {
        this.clearCall();
      }
    );
  }

  createMessageListener() {
    return new CometChat.MessageListener({
      onTextMessageReceived: () => this.handleMessage(),
      onMediaMessageReceived: () => this.handleMessage(),
      onCustomMessageReceived: () => this.handleMessage(),
      onInteractiveMessageReceived: () => this.handleMessage(),
      onTransientMessageReceived: () => this.handleMessage(),
      onMessagesRead: () => this.handleMessageRead()
    });
  }

  createCallListener() {
    return new CometChat.CallListener({
      onOutgoingCallAccepted: (call: any) => {
        if (call.getReceiverType() === 'group') {
          this.ongoingCall = call;
          this.cometChatService.outGoingCallObject = null;
          this.incomingCall = null;
          this.startCallSession(call);
          this.cdr.detectChanges();
        }
        else if (call.getReceiverId() !== this.loggedInUID) {
          this.ongoingCall = null;
          this.incomingCall = null;
          this.cdr.detectChanges();
          return;
        }
        else if (this.cometChatService.outGoingCallObject) {
          this.ongoingCall = call;
          this.cometChatService.outGoingCallObject = null;
          this.incomingCall = null;
          this.startCallSession(call);
          this.cdr.detectChanges();
        }
      },
      onOutgoingCallRejected: (call: any) => {
        this.clearCall();
      },
      onIncomingCallCancelled: (call: any) => {
        if (this.incomingCall && this.incomingCall.sessionId === call.sessionId) {
          this.incomingCall = null;
          this.cdr.detectChanges();
        }
        this.clearCall();
      },
      onIncomingCallReceived: (call: any) => {
        const activeCall = StorageUtils.getItem(CometChatUIKitConstants.calls.activecall);
        
        if (call.getSender().getUid() === this.loggedInUID) {
          this.incomingCall = null;
          return;
        }
        
        if (!activeCall) {
          this.incomingCall = call;
          this.cdr.detectChanges();
        } else {
          this.incomingCall = null;
          CometChat.rejectCall(call.getSessionId(), CometChat.CALL_STATUS.BUSY);
        }
      },
      onCallEndedMessageReceived: (call: any) => {
        this.clearCall()
      }
    });
  }

  handleMessage() {
    navigator.vibrate(1000);
    this.cometChatService.fetchUnreadMessages();
    this.cometChatService.unreadCountUpdated$.next();
  }

  handleMessageRead() {
    this.cometChatService.fetchUnreadMessages();
    this.cometChatService.unreadCountUpdated$.next();
  }

  acceptIncomingCall() {
    if (!this.incomingCall) return;
    CometChat.acceptCall(this.incomingCall.sessionId)
      .then(call => {
        this.startCallSession(call);
        this.incomingCall = null;
        this.cdr.detectChanges();
      })
      .catch(error => {
        console.error("Call acceptance failed:", error);
        this.incomingCall = null;
        this.cdr.detectChanges();
      });
  }

  rejectIncomingCall() {
    if (!this.incomingCall) return;
    
    CometChat.rejectCall(this.incomingCall.sessionId, CometChat.CALL_STATUS.REJECTED)
      .then(() => {
        this.incomingCall = null;
        this.cdr.detectChanges();
      })
      .catch(error => {
        console.error("Call rejection failed:", error);
        this.incomingCall = null;
        this.cdr.detectChanges();
      });
  }

  private async startCallSession(call: any) {
    StorageUtils.setItem(CometChatUIKitConstants.calls.activecall, call.sessionId);
    
    this.sessionId = call.getSessionId();
    this.callSettingsBuilder = new CometChatCalls.CallSettingsBuilder()
      .enableDefaultLayout(true)
      .setIsAudioOnlyCall(call.getType() === 'audio');
    
    this.cometChatService.isCallOngoing = true;
    this.cdr.detectChanges();
  }

  clearCall = () => {
    StorageUtils.removeItem(CometChatUIKitConstants.calls.activecall);
    CometChatCalls.endSession();
    CometChat.endCall(this.sessionId)
    CometChat.clearActiveCall();
    this.cometChatService.isCallOngoing = false;
    this.cometChatService.outGoingCallObject = null;
    this.cometChatService.callObject = null;
    this.sessionId = '';
    this.callSettingsBuilder = undefined as any;
    this.incomingCall = null;
    this.outgoingCall = null;
    this.ongoingCall = null;
    this.cdr.detectChanges();
  }

public handleOnCloseClicked = () => {
  const outgoingCall = this.cometChatService.outGoingCallObject;
  if (!outgoingCall) {
    console.warn('No outgoing call object found');
    return;
  }

  const sessionId = outgoingCall.getSessionId?.();
  if (sessionId) {
    CometChat.rejectCall(sessionId, CometChat.CALL_STATUS.CANCELLED).then(
      () => this.clearCall()
    ).catch(
      (error: any) => {
        console.error("Call cancel failed:", error);
        if (error && error.stack) {
          console.error("Stack trace:", error.stack);
        }
      }
    );
  } else {
    console.warn('No sessionId found in outgoing call object');
  }
};

  ngOnDestroy() {
    CometChat.removeCallListener(this.callListenerId);
    CometChat.removeMessageListener('UNIQUE_LISTENER_ID');
    this.ccCallEnded?.unsubscribe();
    this.clearCall();
  }
}