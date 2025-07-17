import { Component } from '@angular/core';
import { Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-custom-incoming-call',
  standalone: true,
  templateUrl: './custom-incoming-call.component.html',
  styleUrl: './custom-incoming-call.component.scss'
})
export class CustomIncomingCallComponent {
  @Input() incomingCall: any;
  @Output() incomingCallAccepted = new EventEmitter<any>();
  @Output() incomingCallRejected = new EventEmitter<any>();

  acceptIncomingCall() {
    this.incomingCallAccepted.emit(this.incomingCall);
  }

  rejectIncomingCall() {
    this.incomingCallRejected.emit(this.incomingCall);
  }
}
