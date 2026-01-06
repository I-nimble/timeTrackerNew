import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, CUSTOM_ELEMENTS_SCHEMA, ChangeDetectorRef, PLATFORM_ID, Inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RocketChatService } from './services/rocket-chat.service';
import { Subscription } from 'rxjs';
import { JitsiMeetComponent } from './components/jitsi-meet/jitsi-meet.component';
import { ViewChild, ViewContainerRef, ComponentRef } from '@angular/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { isPlatformBrowser } from '@angular/common';

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
    private rocketChatService: RocketChatService
  ) { }

  async ngOnInit() {
    await this.initializeSystemBars();
    this.rocketChatService.loadCredentials();
    this.rocketChatService.saveUserData();

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

  ngOnDestroy(): void {
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