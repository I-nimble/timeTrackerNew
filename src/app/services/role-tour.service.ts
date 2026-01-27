import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { TourService, IStepOption } from 'ngx-ui-tour-md-menu';
import { BehaviorSubject, Subject, firstValueFrom, of } from 'rxjs';
import { catchError, filter, take } from 'rxjs/operators';
import { TourApiService, TourProgress } from './tour-api.service';

export type RoleTourStep = IStepOption & { anchorId: string; route?: string };

interface StartOptions {
  forceStart?: boolean;
}

@Injectable({ providedIn: 'root' })
export class RoleTourService {
  private activeTourKey?: string;
  private activeSteps: RoleTourStep[] = [];
  private skipRequested = false;
  private isStarting = false;

  private isActiveSubject = new BehaviorSubject<boolean>(false);
  isActive$ = this.isActiveSubject.asObservable();

  private startRequests = new Subject<{ steps: RoleTourStep[]; startIndex: number }>();
  startRequests$ = this.startRequests.asObservable();

  constructor(
    private tourService: TourService<RoleTourStep>,
    private tourApi: TourApiService,
    private router: Router,
  ) {
    // Progress/end will be forwarded from the component that owns the TourService instance.

  }

  async maybeStartForCurrentUser(forceStart = false) {
    console.log('maybeStartForCurrentUser');
    const role = localStorage.getItem('role');
    if (!role) return;
    await this.startForRole(role, { forceStart });
  }

  async restartFromStart(role?: string) {
    const currentRole = role || localStorage.getItem('role');
    if (!currentRole) return;
    await this.startForRole(currentRole, { forceStart: true });
  }

  isTourActive(): boolean {
    return this.isActiveSubject.value;
  }

  skipActiveTour() {
    if (!this.activeTourKey || !this.isActiveSubject.value) return;
    this.skipRequested = true;
    this.tourService.end();
  }

  private async handleEnd() {
    if (!this.activeTourKey) return;

    try {
      if (this.skipRequested) {
        await firstValueFrom(this.tourApi.skip());
      } else {
        await firstValueFrom(this.tourApi.complete());
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
    const tourKey = role;
    if (!tourKey) return;
    if (this.isStarting) return;
    if (this.isActiveSubject.value && !options.forceStart) return;

    const steps = this.getStepsForRole(role);
    console.log('steps', steps);
    if (!steps.length) return;

    this.isStarting = true;
    try {
      const progress = await this.safeFetchProgress();
      console.log('progress', progress);
      if (!options.forceStart && progress?.skipped) {
        return;
      }

      // Initialize steps early so anchors can register before we wait for them.
      this.tourService.initialize(steps);

      const startIndex = this.getStartIndex(progress, steps, options.forceStart);
      console.log('startIndex', startIndex);
      const targetRoute = steps[startIndex]?.route;

      if (targetRoute) {
        await this.ensureRoute(targetRoute);
      }

      const targetAnchor = steps[startIndex]?.anchorId;
      if (targetAnchor) {
        const tour = this.tourService as any;
        const existing = tour.anchors ? Object.keys(tour.anchors) : [];
        console.log('before wait, anchors:', existing);
        await this.waitForAnchorRegistration(targetAnchor);
      }

      this.activeTourKey = tourKey;
      this.activeSteps = steps;
      this.skipRequested = false;
      this.isActiveSubject.next(true);

      // Defer actual initialize/start to the component's TourService instance.
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
        })
      );
    } catch (error) {
      console.error('Error updating tour progress', error);
    }
  }

  private async safeFetchProgress(): Promise<TourProgress | null> {
    return await firstValueFrom(
      this.tourApi.getProgress().pipe(
        catchError(() => of(null))
      )
    );
  }

  private async waitForAnchorRegistration(anchorId: string) {
    const tour = this.tourService as any;
    const anchorRecord = tour.anchors ?? {};
    const isRegistered = !!anchorRecord[anchorId] || !!anchorRecord.get?.(anchorId) || !!anchorRecord.has?.(anchorId);
    if (isRegistered) return;

    const register$ = tour.anchorRegister$;
    console.log('register$', register$);
    if (!register$) return;

    const currentAnchors = anchorRecord ? Object.keys(anchorRecord) : [];
    console.log('waiting for anchor', anchorId, 'current anchors', currentAnchors);

    this.tourService.events$.subscribe((x: any) => console.log(x));

    await firstValueFrom(
      register$.pipe(
        filter((id: string) => id === anchorId),
        take(1),
      )
    );
  }

  private async ensureRoute(targetRoute: string) {
    const currentPath = this.router.url.split('?')[0];
    if (currentPath === targetRoute) return;

    try {
      await this.router.navigateByUrl(targetRoute);
      await firstValueFrom(
        this.router.events.pipe(
          filter((e) => e instanceof NavigationEnd),
          take(1),
        )
      );
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

  private getStepsForRole(role: string): RoleTourStep[] {
    if (role === '3') {
      return this.getClientSteps();
    }
    return [];
  }

  private getClientSteps(): RoleTourStep[] {
    const asyncStep = {
      isAsync: true,
      asyncStepTimeout: 30000,
      delayAfterNavigation: 500,
      delayBeforeStepShow: 100,
    };

    return [
      {
        ...asyncStep,
        anchorId: 'tm-custom-search',
        title: 'Find talent fast',
        content: 'Start with a guided or custom search for your first role.',
        route: '/apps/talent-match',
      },
      {
        ...asyncStep,
        anchorId: 'tm-main-filters',
        title: 'Define role and practice',
        content: 'Select the role and legal area to refine matches.',
        route: '/apps/talent-match',
      },
      {
        ...asyncStep,
        anchorId: 'tm-budget',
        title: 'Adjust the budget',
        content: 'Set the rate range and type for candidates.',
        route: '/apps/talent-match',
      },
      {
        ...asyncStep,
        anchorId: 'tm-advanced',
        title: 'Advanced filters',
        content: 'Filter by skills, tools, background, and trainings.',
        route: '/apps/talent-match',
      },
      {
        ...asyncStep,
        anchorId: 'tm-ai-box',
        title: 'AI-powered search',
        content: 'Describe the role and let AI rank the best candidates.',
        route: '/apps/talent-match',
      },
      {
        ...asyncStep,
        anchorId: 'tm-results',
        title: 'Results and selection',
        content: 'Review the table, select candidates, and compare profiles.',
        route: '/apps/talent-match',
      },
      {
        ...asyncStep,
        anchorId: 'tm-actions',
        title: 'Quick actions',
        content: 'Schedule interviews, download resumes, or mark not interested.',
        route: '/apps/talent-match',
      },
      {
        ...asyncStep,
        anchorId: 'dash-welcome',
        title: 'Executive summary',
        content: 'See updates and key team notifications here.',
        route: '/dashboards/dashboard2',
      },
      {
        ...asyncStep,
        anchorId: 'dash-kpis',
        title: 'Daily KPIs',
        content: 'Tasks, hours, and performance at a glance.',
        route: '/dashboards/dashboard2',
      },
      {
        ...asyncStep,
        anchorId: 'dash-activity',
        title: 'Activity and hours',
        content: 'Distribution of worked vs remaining hours.',
        route: '/dashboards/dashboard2',
      },
      {
        ...asyncStep,
        anchorId: 'dash-team',
        title: 'My team',
        content: 'Track performance and scheduled interviews.',
        route: '/dashboards/dashboard2',
      },
      {
        ...asyncStep,
        anchorId: 'dash-productivity',
        title: 'Productivity and pipeline',
        content: 'Progress by area and quick access to Kanban.',
        route: '/dashboards/dashboard2',
      },
      {
        ...asyncStep,
        anchorId: 'dash-schedule',
        title: 'Schedule and planning',
        content: 'View weekly load to balance tasks.',
        route: '/dashboards/dashboard2',
      },
    ];
  }
}
