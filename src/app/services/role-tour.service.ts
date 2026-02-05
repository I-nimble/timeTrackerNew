import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { TourService } from 'ngx-ui-tour-md-menu';
import { BehaviorSubject, ReplaySubject, Subject, firstValueFrom, of } from 'rxjs';
import { catchError, filter, take, timeout } from 'rxjs/operators';
import { TourApiService, TourProgress } from './tour-api.service';
import { RoleTourStep, SectionConfig, buildClientSections } from './role-tour-steps';

interface StartOptions {
  forceStart?: boolean;
  currentRoute?: string;
  onlyIfNoProgress?: boolean;
}


@Injectable({ providedIn: 'root' })
export class RoleTourService {
  private activeTourKey?: string;
  private activeSteps: RoleTourStep[] = [];
  private skipRequested = false;
  private isStarting = false;

  private isActiveSubject = new BehaviorSubject<boolean>(false);
  isActive$ = this.isActiveSubject.asObservable();

  private startRequests = new ReplaySubject<{ steps: RoleTourStep[]; startIndex: number }>(1);
  startRequests$ = this.startRequests.asObservable();

  private kanbanOpenRequests = new Subject<void>();
  kanbanOpenRequests$ = this.kanbanOpenRequests.asObservable();

  private chatOpenRequests = new Subject<void>();
  chatOpenRequests$ = this.chatOpenRequests.asObservable();

  private employeeDetailsOpenRequests = new Subject<void>();
  employeeDetailsOpenRequests$ = this.employeeDetailsOpenRequests.asObservable();

  constructor(
    private tourService: TourService<RoleTourStep>,
    private tourApi: TourApiService,
    private router: Router,
  ) {}

  async maybeStartForCurrentUser(forceStart = false, roleOverride?: string, currentRoute?: string) {
    const jwt = localStorage.getItem('jwt');
    if (!jwt) return;
    const role = roleOverride ?? localStorage.getItem('role');
    if (!role) return;
    await this.startForRole(role, { forceStart, currentRoute, onlyIfNoProgress: !forceStart });
  }

  async maybeStartForCurrentRoute(forceStart = false, roleOverride?: string) {
    const jwt = localStorage.getItem('jwt');
    if (!jwt) return;
    const role = roleOverride ?? localStorage.getItem('role');
    if (!role) return;
    const currentRoute = this.normalizeRoute(this.router.url);
    await this.startForRole(role, { forceStart, currentRoute, onlyIfNoProgress: !forceStart });
  }

  async restartFromStart(role?: string) {
    const currentRole = role || localStorage.getItem('role');
    if (!currentRole) return;
    const currentRoute = this.normalizeRoute(this.router.url);
    await this.startForRole(currentRole, { forceStart: true, currentRoute, onlyIfNoProgress: false });
  }

  isTourActive(): boolean {
    return this.isActiveSubject.value;
  }

  hasStepsForRoute(route?: string, roleOverride?: string): boolean {
    const role = roleOverride ?? localStorage.getItem('role');
    if (!role) return false;
    const currentRoute = this.normalizeRoute(route ?? this.router.url);
    return !!this.getSectionForRoute(role, currentRoute);
  }

  skipActiveTour() {
    if (!this.activeTourKey || !this.isActiveSubject.value) return;
    this.skipRequested = true;
    this.tourService.end();
  }

  requestKanbanBoardOpen() {
    this.kanbanOpenRequests.next();
  }

  requestChatConversationOpen() {
    this.chatOpenRequests.next();
  }

  requestEmployeeDetailsOpen() {
    this.employeeDetailsOpenRequests.next();
  }

  resumeAtIndex(index: number) {
    if (!this.activeSteps.length) return;
    const safeIndex = Math.min(Math.max(index, 0), this.activeSteps.length - 1);
    this.isActiveSubject.next(true);
    this.startRequests.next({ steps: this.activeSteps, startIndex: safeIndex });
  }

  private async handleEnd() {
    if (!this.activeTourKey) return;

    try {
      if (this.skipRequested) {
        await firstValueFrom(this.tourApi.skip(this.activeTourKey));
      } else {
        await firstValueFrom(this.tourApi.complete({}, this.activeTourKey));
      }
    } catch (error) {
      console.error('Error finishing tour', error);
    } finally {
      this.resetState();
    }
  }

  private resetState() {
    this.activeTourKey = undefined;
    this.activeSteps = [];
    this.skipRequested = false;
    this.isActiveSubject.next(false);
  }

  private async startForRole(role: string, options: StartOptions) {
    const currentRoute = this.normalizeRoute(options.currentRoute ?? this.router.url);
    const section = this.getSectionForRoute(role, currentRoute);
    if (!section) return;
    const tourKey = this.getTourKeyForRoleSection(role, section.key);
    if (this.isStarting) return;
    if (this.isActiveSubject.value) {
      const svc: any = this.tourService as any;
      const status = svc.getStatus?.();
      const hasStep = !!svc.currentStep;
      if (status === 0 || !hasStep) {
        try { this.tourService.end(); } catch (e) {}
        this.resetState();
      } else if (options.forceStart) {
        try { this.tourService.end(); } catch (e) { console.error('Error ending existing tour', e); }
      } else {
        return;
      }
    }

    const steps = section.steps;
    if (!steps.length) return;

    this.isStarting = true;
    try {
      const progress = await this.safeFetchProgress(tourKey);
      if (options.onlyIfNoProgress && progress) {
        return;
      }
      if (!progress) {
        try {
          await firstValueFrom(
            this.tourApi.start({
              current_step: 0,
              progress: { anchorId: steps[0]?.anchorId, route: steps[0]?.route }
            }, tourKey)
          );
        } catch (error) {
          console.error('Error starting tour progress', error);
        }
      }
      if (!options.forceStart && (progress?.skipped || progress?.completed)) {
        return;
      }

      let startIndex = this.getStartIndex(progress, steps, options.forceStart);
      const intendedRoute = steps[startIndex]?.route;
      if (!options.forceStart && currentRoute && intendedRoute && currentRoute !== intendedRoute) {
        const matchIndex = steps.findIndex((step) => step.route === currentRoute);
        if (matchIndex >= 0) {
          startIndex = matchIndex;
        }
      }
      const targetRoute = steps[startIndex]?.route;

      if (targetRoute) {
        await this.ensureRoute(targetRoute);
      }

      this.activeTourKey = tourKey;
      this.activeSteps = steps;
      this.skipRequested = false;
      this.isActiveSubject.next(true);

      this.startRequests.next({ steps, startIndex });
    } catch (error) {
      console.error('Error starting tour', error);
    } finally {
      this.isStarting = false;
    }
  }

  private getStartIndex(progress: TourProgress | null, steps: RoleTourStep[], forceStart?: boolean) {
    if (forceStart) return 0;
    const index = progress?.current_step ?? 0;
    return Math.min(Math.max(index, 0), steps.length - 1);
  }

  private async persistProgress(step: RoleTourStep) {
    if (!this.activeTourKey || !this.activeSteps.length) return;
    const stepIndex = this.activeSteps.findIndex((s) => s.anchorId === step.anchorId);
    if (stepIndex === -1) return;

    try {
      await firstValueFrom(
        this.tourApi.updateProgress({
          current_step: stepIndex,
          progress: { anchorId: step.anchorId, route: step.route },
        }, this.activeTourKey)
      );
    } catch (error) {
      console.error('Error updating tour progress', error);
    }
  }

  private async safeFetchProgress(tourKey: string): Promise<TourProgress | null> {
    return await firstValueFrom(
      this.tourApi.getProgress(tourKey).pipe(
        catchError(() => of(null))
      )
    );
  }

  private async ensureRoute(targetRoute: string) {
    if (!this.router.navigated) {
      await firstValueFrom(
        this.router.events.pipe(
          filter((e) => e instanceof NavigationEnd),
          take(1),
          timeout({ first: 2000 })
        )
      ).catch((e) => console.error('Error navigating to tour route', e));
    }

    const currentPath = this.router.url.split('?')[0];
    if (currentPath === targetRoute) return;

    try {
      await this.router.navigateByUrl(targetRoute);
      // Proceed even if NavigationEnd is missed (guards or same-route) to avoid hanging the tour.
      await firstValueFrom(
        this.router.events.pipe(
          filter((e) => e instanceof NavigationEnd),
          take(1),
          // Fallback: release after 1s even if NavigationEnd is not seen.
          timeout({ first: 2000 })
        ).pipe(catchError(() => of(null)))
      ).catch(() => undefined);
    } catch (error) {
      console.error('Error navigating to tour route', error);
    }
  }

  // Public callbacks from component's TourService events
  async notifyStepShown(step: RoleTourStep) {
    await this.persistProgress(step);
  }

  async notifyEnded() {
    await this.handleEnd();
  }

  private getSectionForRoute(role: string, route: string): SectionConfig | null {
    if (role != '3') return null;
    const sections = this.getClientSections();
    return sections.find((section) =>
      section.routes.some((r) => route === r || route.startsWith(`${r}/`))
    ) ?? null;
  }

  private getClientSections(): SectionConfig[] {
    const baseStep = {
      isAsync: true,
      asyncStepTimeout: 30000,
      delayAfterNavigation: 500,
      delayBeforeStepShow: 100,
      enableBackdrop: true,
      allowUserInitiatedNavigation: false,
      isOptional: true,
    };
    return buildClientSections(baseStep);
  }

  private getTourKeyForRoleSection(role: string, sectionKey: string): string {
    const rolePrefix = this.getRolePrefix(role);
    return `${rolePrefix}-${sectionKey}`;
  }

  private getRolePrefix(role: string): string {
    switch (role) {
      case '1':
        return 'admin';
      case '2':
        return 'user';
      case '3':
        return 'client';
      case '4':
        return 'support';
      default:
        return role;
    }
  }

  private normalizeRoute(route: string): string {
    return route.split('?')[0];
  }
}
