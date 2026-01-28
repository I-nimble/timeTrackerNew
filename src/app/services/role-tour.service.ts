import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { TourService, IStepOption } from 'ngx-ui-tour-md-menu';
import { BehaviorSubject, ReplaySubject, firstValueFrom, of } from 'rxjs';
import { catchError, filter, take, timeout } from 'rxjs/operators';
import { TourApiService, TourProgress } from './tour-api.service';

export type RoleTourStep = IStepOption & { anchorId: string; route?: string };

interface StartOptions {
  forceStart?: boolean;
  currentRoute?: string;
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

  constructor(
    private tourService: TourService<RoleTourStep>,
    private tourApi: TourApiService,
    private router: Router,
  ) {}

  async maybeStartForCurrentUser(forceStart = false, roleOverride?: string, currentRoute?: string) {
    console.log('maybeStartForCurrentUser');
    const jwt = localStorage.getItem('jwt');
    if (!jwt) return;
    const role = roleOverride ?? localStorage.getItem('role');
    console.log('role', role);
    if (!role) return;
    await this.startForRole(role, { forceStart, currentRoute });
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
    const tourKey = this.getTourKeyForRole(role);
    console.log('tourKey', tourKey);
    if (!tourKey) return;
    console.log('isStarting', this.isStarting);
    if (this.isStarting) return;
    console.log('isActiveSubject', this.isActiveSubject.value);
    console.log('!options.forceStart', !options.forceStart);
    if (this.isActiveSubject.value) {
      const svc: any = this.tourService as any;
      const status = svc.getStatus?.();
      const hasStep = !!svc.currentStep;
      console.log('current tour status', status);
      if (status === 0 || !hasStep) {
        try { this.tourService.end(); } catch (e) {}
        this.resetState();
      } else if (options.forceStart) {
        try { this.tourService.end(); } catch (e) { console.error('Error ending existing tour', e); }
      } else {
        return;
      }
    }

    const steps = this.getStepsForRole(role);
    console.log('steps', steps);
    if (!steps.length) return;

    this.isStarting = true;
    try {
      const progress = await this.safeFetchProgress(tourKey);
      console.log('progress', progress);
      if (!progress && !options.forceStart) {
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
      if (!options.forceStart && progress?.skipped) {
        return;
      }
      if (!options.forceStart && progress?.completed) {
        return;
      }

      let startIndex = this.getStartIndex(progress, steps, options.forceStart);
      const currentPath = options.currentRoute ?? this.router.url.split('?')[0];
      const intendedRoute = steps[startIndex]?.route;
      if (!options.forceStart && currentPath && intendedRoute && currentPath !== intendedRoute) {
        const matchIndex = steps.findIndex((step) => step.route === currentPath);
        if (matchIndex >= 0) {
          startIndex = matchIndex;
        }
      }
      console.log('startIndex', startIndex);
      const targetRoute = steps[startIndex]?.route;
      console.log('targetRoute', targetRoute);

      if (targetRoute) {
        await this.ensureRoute(targetRoute);
      }

      const targetAnchor = steps[startIndex]?.anchorId;
      console.log('targetAnchor', targetAnchor);

      this.activeTourKey = tourKey;
      this.activeSteps = steps;
      this.skipRequested = false;
      this.isActiveSubject.next(true);

      // Defer actual initialize/start to the component's TourService instance.
      console.log('emitting startRequests', { startIndex, stepsCount: steps.length });
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
    console.log('currentPath', currentPath, 'targetRoute', targetRoute);
    if (currentPath === targetRoute) return;
    

    console.log('navigating to', targetRoute, 'from', currentPath);

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
      console.log('navigation complete (or timed out)', targetRoute);
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
    if (role == '3') {
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
      allowUserInitiatedNavigation: true,
    };

    const talentMatchSteps = [
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
    ];

    const dashboardSteps = [
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

    const hasTeam = localStorage.getItem('clientHasTeam') === 'true';
    return hasTeam ? [...dashboardSteps, ...talentMatchSteps] : [...talentMatchSteps, ...dashboardSteps];
  }

  private getTourKeyForRole(role: string): string {
    if (role === '3') {
      const hasTeam = localStorage.getItem('clientHasTeam') === 'true';
      return hasTeam ? 'client-team' : 'client-solo';
    }
    return role;
  }
}
