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
    // Check for valid JWT, if not present, clear all credentials and localStorage
    const jwt = localStorage.getItem('jwt');
    if (!jwt) {
      console.log('[AppComponent] No JWT found on app start, clearing auth/credentials but preserving device push token.');
      try { localStorage.removeItem('rocketChatCredentials'); } catch(e) {}
      try { localStorage.removeItem('pushTokenUserId'); } catch(e) {}
      try { localStorage.removeItem('jwt'); } catch(e) {}
      try { localStorage.removeItem('id'); } catch(e) {}
      try { localStorage.removeItem('role'); } catch(e) {}
      try { this.rocketChatService.logout?.(); } catch (e) { console.warn('[AppComponent] Error clearing Rocket.Chat credentials:', e); }
      try { this.pushNotificationService.clearToken(); } catch (e) { console.warn('[AppComponent] Error clearing push token:', e); }
    } else {
      console.log('[AppComponent] JWT found on app start.');
    }

    this.rocketChatService.onAppResume();
    this.rocketChatService.resetNotificationState();
    this.rocketChatService.loadCredentials();
    // Validate that loaded Rocket.Chat credentials match the local app user id.
    try {
      const savedCreds = this.rocketChatService.credentials;
      const savedCredsRaw = localStorage.getItem('rocketChatCredentials');
      let localId: string | null = null;
      if (savedCredsRaw) {
        try {
          const parsed = JSON.parse(savedCredsRaw);
          localId = parsed?.userId ?? null;
        } catch (parseErr) {
          console.warn('[AppComponent] Could not parse rocketChatCredentials from localStorage:', parseErr);
          localId = null;
        }
      }
      const pushOwner = localStorage.getItem('pushTokenUserId');
      if (savedCreds && localId && savedCreds.userId !== localId) {
        console.warn('[AppComponent] Detected mismatch between Rocket.Chat credentials and local user id. Clearing credentials and push token.');
        // Clear stored chat credentials and push token metadata
        localStorage.removeItem('rocketChatCredentials');
        localStorage.removeItem('pushTokenUserId');
        try { await this.pushNotificationService.cleanupPush(); } catch (e) { console.warn('[AppComponent] Error cleaning up push token:', e); }
        try { this.rocketChatService.logout?.(); } catch (e) { console.warn('[AppComponent] Error logging out Rocket.Chat service:', e); }
        // Clear only stale auth/chat-related keys to avoid deleting device push token
        try { localStorage.removeItem('rocketChatCredentials'); } catch(e) {}
        try { localStorage.removeItem('pushTokenUserId'); } catch(e) {}
        try { localStorage.removeItem('jwt'); } catch(e) {}
        try { localStorage.removeItem('id'); } catch(e) {}
        try { localStorage.removeItem('role'); } catch(e) {}
        console.log('[AppComponent] Cleared stale credentials and push data. Reloading app state.');
        return;
      }
      if (pushOwner && localId && pushOwner !== localId) {
        console.warn('[AppComponent] Detected push token owner different from local user id. Cleaning up push token.');
        try { await this.pushNotificationService.cleanupPush(); } catch (e) { console.warn('[AppComponent] Error cleaning up push token:', e); }
        localStorage.removeItem('pushTokenUserId');
      }
    } catch (e) {
      console.warn('[AppComponent] Error validating stored credentials/push owner:', e);
    }
    await this.pushNotificationService.initialize();
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