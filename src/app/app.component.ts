import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, CUSTOM_ELEMENTS_SCHEMA, ChangeDetectorRef } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RocketChatService } from './services/rocket-chat.service';
import { PlatformPermissionsService } from './services/permissions.service';
import { Subscription } from 'rxjs';
import { JitsiMeetComponent } from './components/jitsi-meet/jitsi-meet.component';
import { ViewChild, ViewContainerRef, ComponentRef } from '@angular/core';
import { PushNotificationService } from './services/push-notification.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
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
  activeJitsi: any = null;
  jitsiMinimized = false;
  private jitsiSub: Subscription | null = null;
  private jitsiCompRef: ComponentRef<any> | null = null;

  @ViewChild('jitsiHost', { read: ViewContainerRef, static: true }) jitsiHost!: ViewContainerRef;

  constructor(
    private rocketChatService: RocketChatService,
    private platformPermissionsService: PlatformPermissionsService,
    private pushNotificationService: PushNotificationService
  ) { }

  async ngOnInit() {
    await this.pushNotificationService.initialize();
    this.rocketChatService.loadCredentials();
    this.rocketChatService.saveUserData();
    const notificationPermission = await this.platformPermissionsService.requestNotificationPermissions();
    if (notificationPermission) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await this.rocketChatService.initLocalNotifications();
    }

    try {
      this.jitsiSub = this.rocketChatService.getActiveJitsiStream().subscribe((m) => {
        this.activeJitsi = m;
        this.jitsiMinimized = false;
        try {
          if (m) {
            try { this.jitsiCompRef?.destroy(); } catch (e) {}
            this.jitsiHost.clear();
            this.jitsiCompRef = this.jitsiHost.createComponent(JitsiMeetComponent);
            try { this.jitsiCompRef.instance.dataInput = m; } catch (e) {}
            try { this.jitsiCompRef.instance.closed.subscribe(() => this.onJitsiClosed()); } catch (e) {}
            try { this.jitsiCompRef.instance.minimized.subscribe((b: any) => this.jitsiMinimized = !!b); } catch (e) {}
          } else {
            try { this.jitsiCompRef?.destroy(); } catch (e) {}
            this.jitsiCompRef = null;
            this.jitsiHost.clear();
          }
        } catch (e) {}
      });
    } catch (e) {}
  }

  ngOnDestroy(): void {
    try { this.jitsiSub?.unsubscribe(); } catch (e) {}
    try { this.jitsiCompRef?.destroy(); } catch (e) {}
  }

  onJitsiClosed() {
    try { this.rocketChatService.closeJitsiMeeting(); } catch (e) {}
  }
}