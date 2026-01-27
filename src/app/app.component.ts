import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, CUSTOM_ELEMENTS_SCHEMA, ChangeDetectorRef, NgZone } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RocketChatService } from './services/rocket-chat.service';
import { Subscription, firstValueFrom } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { JitsiMeetComponent } from './components/jitsi-meet/jitsi-meet.component';
import { ViewChild, ViewContainerRef, ComponentRef } from '@angular/core';
import { WebSocketService } from './services/socket/web-socket.service';
import { GeolocationRequest } from './models/geolocation.model';
import { LocationService } from './services/location.service';
import { TourMatMenuModule, TourService } from 'ngx-ui-tour-md-menu';
import { RoleTourService, RoleTourStep } from './services/role-tour.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, TourMatMenuModule],
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
  private geolocationRequestSub: Subscription | null = null;
  private geolocationPermissionDenied = false;
  private tourStartSub: Subscription | null = null;
  private tourStepSub: Subscription | null = null;
  private tourEndSub: Subscription | null = null;
  private anchorLogSub: Subscription | null = null;

  @ViewChild('jitsiHost', { read: ViewContainerRef, static: true }) jitsiHost!: ViewContainerRef;

  constructor(
    private rocketChatService: RocketChatService,
    private webSocketService: WebSocketService,
    private locationService: LocationService,
    private roleTourService: RoleTourService,
    private tourService: TourService<RoleTourStep>,
    private router: Router,
    private ngZone: NgZone
  ) { }

  async ngOnInit() {
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


      this.setupTourBridge();

      if (localStorage.getItem('jwt')) {
        setTimeout(() => {
          void this.roleTourService.maybeStartForCurrentUser();
        }, 0);
      }
    this.setupGeolocationListener();

    const role = localStorage.getItem('role');
    if (role == '2') {
      setTimeout(() => {
        this.locationService.startTracking();
        this.locationService.forceUpdate(); 
      }, 2000);
    }
  }

  ngOnDestroy(): void {
    try { this.jitsiSub?.unsubscribe(); } catch (e) {}
    try { this.jitsiCompRef?.destroy(); } catch (e) {}
    try { this.geolocationRequestSub?.unsubscribe(); } catch (e) {}
    try { this.tourStartSub?.unsubscribe(); } catch (e) {}
    try { this.tourStepSub?.unsubscribe(); } catch (e) {}
    try { this.tourEndSub?.unsubscribe(); } catch (e) {}
    try { this.anchorLogSub?.unsubscribe(); } catch (e) {}
  }

  onJitsiClosed() {
    try { this.rocketChatService.closeJitsiMeeting(); } catch (e) {}
  }

  private setupGeolocationListener(): void {
    this.geolocationRequestSub = this.webSocketService.getGeolocationRequestStream().subscribe({
      next: (request: GeolocationRequest) => {
        this.locationService.forceUpdate(true);
      },
      error: (err) => {
        console.error('Error in geolocation request stream', err);
      }
    });
  }

  private setupTourBridge(): void {
    const svc: any = this.tourService as any;
    this.tourService.setDefaults({ allowUserInitiatedNavigation: true } as RoleTourStep);
    this.anchorLogSub = svc.anchorRegister$?.subscribe((id: string) => console.log('anchor registered (root)', id)) ?? null;

    this.tourStartSub = this.roleTourService.startRequests$.subscribe(({ steps, startIndex }) => {
      console.log('tour start request', { startIndex, steps });
      void this.startTourWhenReady(steps, startIndex);
    });

    this.tourStepSub = svc.stepShow$?.subscribe((payload: any) => {
      console.log('tour step show', payload);
      const step = payload?.step ?? payload;
      void this.roleTourService.notifyStepShown(step);
    }) ?? null;

    this.tourEndSub = svc.end$?.subscribe(() => {
      console.log('tour ended');
      void this.roleTourService.notifyEnded();
    }) ?? null;
  }

  private async startTourWhenReady(steps: RoleTourStep[], startIndex: number) {
    try { this.tourService.end(); } catch (e) {}
    this.tourService.initialize(steps);
    const svc: any = this.tourService as any;
    const targetAnchor = steps[startIndex]?.anchorId;
    const targetRoute = steps[startIndex]?.route;

    if (targetRoute) {
      const currentPath = this.router.url.split('?')[0];
      if (currentPath !== targetRoute) {
        await firstValueFrom(
          this.router.events.pipe(
            filter((e) => e instanceof NavigationEnd),
            filter((e) => (e as NavigationEnd).urlAfterRedirects.split('?')[0] === targetRoute),
            take(1)
          )
        ).catch(() => undefined);
      }
    }

    await firstValueFrom(this.ngZone.onStable.pipe(take(1))).catch(() => undefined);

    const anchors = svc.anchors ?? {};
    if (targetAnchor && !anchors[targetAnchor]) {
      await firstValueFrom(
        svc.anchorRegister$?.pipe(
          filter((id: string) => id === targetAnchor),
          take(1)
        ) ?? new Promise(() => undefined)
      ).catch(() => undefined);
    }

    const tryStart = () => {
      try {
        if (startIndex > 0 && steps[startIndex] && svc.startAt) {
          svc.startAt(startIndex);
        } else {
          this.tourService.start();
        }
      } catch (error) {
        console.error('Error starting tour', error);
      }
    };

    setTimeout(() => {
      requestAnimationFrame(tryStart);
    }, 0);
  }
}