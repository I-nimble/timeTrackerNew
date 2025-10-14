import { Component } from '@angular/core';
import { Input, Output, EventEmitter } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript-new';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-custom-incoming-call',
  imports: [CommonModule],
  standalone: true,
  templateUrl: './custom-incoming-call.component.html',
  styleUrl: './custom-incoming-call.component.scss'
})
export class CustomIncomingCallComponent {
  @Input() incomingCall: CometChat.Call;
  @Output() incomingCallAccepted = new EventEmitter<any>();
  @Output() incomingCallRejected = new EventEmitter<any>();

  acceptIncomingCall() {
    this.incomingCallAccepted.emit(this.incomingCall);
  }

  rejectIncomingCall() {
    this.incomingCallRejected.emit(this.incomingCall);
  }
}
