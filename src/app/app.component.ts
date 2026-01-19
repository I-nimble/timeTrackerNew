import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, CUSTOM_ELEMENTS_SCHEMA, ChangeDetectorRef, PLATFORM_ID, Inject, HostListener } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RocketChatService } from './services/rocket-chat.service';
import { PlatformPermissionsService } from './services/permissions.service';
import { Subscription } from 'rxjs';
import { JitsiMeetComponent } from './components/jitsi-meet/jitsi-meet.component';
import { ViewChild, ViewContainerRef, ComponentRef } from '@angular/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { isPlatformBrowser } from '@angular/common';
import { PushNotificationService } from './services/push-notification.service';
import { App } from '@capacitor/app';

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
  private darkModeMediaQuery!: MediaQueryList;

  constructor(
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: any,
    private rocketChatService: RocketChatService,
    private platformPermissionsService: PlatformPermissionsService,
    private pushNotificationService: PushNotificationService
  ) { }

  async ngOnInit() {
    await this.initializeSystemBars();
    App.addListener('appStateChange', async ({ isActive }) => {
      if (!isActive) {
        this.rocketChatService.setUserStatus('away').subscribe();
      } else {
        this.rocketChatService.setUserStatus('online').subscribe();
        this.rocketChatService.onAppResume();
      }
    });
    
    const jwt = localStorage.getItem('jwt');
    if (!jwt) {
      try { localStorage.removeItem('rocketChatCredentials'); } catch(e) {}
      try { localStorage.removeItem('pushTokenUserId'); } catch(e) {}
      try { localStorage.removeItem('jwt'); } catch(e) {}
      try { localStorage.removeItem('id'); } catch(e) {}
      try { localStorage.removeItem('role'); } catch(e) {}
      try { this.rocketChatService.logout?.(); } catch (e) { console.warn('Error clearing Rocket.Chat credentials:', e); }
      try { this.pushNotificationService.clearToken(); } catch (e) { console.warn('Error clearing push token:', e); }
    }

    this.rocketChatService.resetNotificationState();
    this.rocketChatService.loadCredentials();
    try {
      const savedCreds = this.rocketChatService.credentials;
      const savedCredsRaw = localStorage.getItem('rocketChatCredentials');
      let localId: string | null = null;
      if (savedCredsRaw) {
        try {
          const parsed = JSON.parse(savedCredsRaw);
          localId = parsed?.userId ?? null;
        } catch (parseErr) {
          console.warn('Could not parse rocketChatCredentials from localStorage:', parseErr);
          localId = null;
        }
      }
      const pushOwner = localStorage.getItem('pushTokenUserId');
      if (savedCreds && localId && savedCreds.userId !== localId) {
        console.warn('Detected mismatch between Rocket.Chat credentials and local user id. Clearing credentials and push token.');
        localStorage.removeItem('rocketChatCredentials');
        localStorage.removeItem('pushTokenUserId');
        try { await this.pushNotificationService.cleanupPush(true); } catch (e) { console.warn('Error cleaning up push token:', e); }
        try { this.rocketChatService.logout?.(); } catch (e) { console.warn('Error logging out Rocket.Chat service:', e); }
        try { localStorage.removeItem('rocketChatCredentials'); } catch(e) {}
        try { localStorage.removeItem('pushTokenUserId'); } catch(e) {}
        try { localStorage.removeItem('jwt'); } catch(e) {}
        try { localStorage.removeItem('id'); } catch(e) {}
        try { localStorage.removeItem('role'); } catch(e) {}
        return;
      }
      if (pushOwner && localId && pushOwner !== localId) {
        console.warn('Detected push token owner different from local user id. Attempting to re-associate token for current user instead of deleting.');
        try {
          await this.pushNotificationService.registerCurrentPushTokenIfNeeded();
        } catch (e) {
          console.warn('Error re-registering push token for current user:', e);
        }
        try { localStorage.setItem('pushTokenUserId', localId); } catch (e) {}
      }
    } catch (e) {
      console.warn('Error validating stored credentials/push owner:', e);
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
    this.setupDarkModeListener();
  }

  @HostListener('window:beforeunload')
  async onBeforeUnload() {
    this.rocketChatService.setUserStatus('offline').subscribe();
  }

  ngOnDestroy(): void {
    this.rocketChatService.setUserStatus('offline').subscribe();
    try { this.jitsiSub?.unsubscribe(); } catch (e) {}
    try { this.jitsiCompRef?.destroy(); } catch (e) {}
  }

  onJitsiClosed() {
    try { this.rocketChatService.closeJitsiMeeting(); } catch (e) {}
  }

  async initializeSystemBars() {
    try {
      if (typeof StatusBar !== 'undefined') {
        await StatusBar.setOverlaysWebView({ overlay: false });
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (isDarkMode) {
          await StatusBar.setStyle({ style: Style.Dark });
          await StatusBar.setBackgroundColor({ color: '#15263a' });
        } else {
          await StatusBar.setStyle({ style: Style.Light });
          await StatusBar.setBackgroundColor({ color: '#EAEAEA' });
        }
        
        await StatusBar.setOverlaysWebView({ overlay: false });
      }
    } catch (error) {
      console.error('Error configuring system bars:', error);
    }
  }

  setupDarkModeListener() {
    if (isPlatformBrowser(this.platformId)) {
      this.darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleColorSchemeChange = (event: MediaQueryListEvent) => {
        this.updateSystemBarsColor(event.matches);
      };
      
      if (this.darkModeMediaQuery.addEventListener) {
        this.darkModeMediaQuery.addEventListener('change', handleColorSchemeChange);
      } else {
        this.darkModeMediaQuery.addListener(handleColorSchemeChange);
      }
      
      this.updateSystemBarsColor(this.darkModeMediaQuery.matches);
    }
  }

  async updateSystemBarsColor(isDarkMode: boolean) {
    try {
      if (typeof StatusBar !== 'undefined') {
        if (isDarkMode) {
          await StatusBar.setStyle({ style: Style.Dark });
          await StatusBar.setBackgroundColor({ color: '#15263a' });
        } else {
          await StatusBar.setStyle({ style: Style.Light });
          await StatusBar.setBackgroundColor({ color: '#EAEAEA' });
        }
      }
    } catch (error) {
      console.error('Error updating system bars color:', error);
    }
  }
}