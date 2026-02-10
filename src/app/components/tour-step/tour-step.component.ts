import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, Input, NgZone, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/material.module';
import { TourService } from 'ngx-ui-tour-md-menu';
import { RoleTourStep } from 'src/app/services/role-tour-steps';
import { RoleTourService } from 'src/app/services/role-tour.service';
import { Subscription, firstValueFrom } from 'rxjs';
import { filter, take, timeout } from 'rxjs/operators';

@Component({
  selector: 'app-tour-step',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './tour-step.component.html',
  styleUrls: ['./tour-step.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TourStepComponent implements AfterViewInit, OnDestroy {
  @Input({ required: true }) step!: RoleTourStep;
  private readonly emptyKanbanAnchors = ['side-kanban', 'kanban-boards', 'kanban-new-board'];
  private readonly noTaskKanbanHiddenAnchors = ['kanban-task-actions', 'kanban-add-column'];
  private kanbanObserver?: MutationObserver;
  private kanbanTasksSub?: Subscription;

  constructor(
    public tourService: TourService<RoleTourStep>,
    private roleTourService: RoleTourService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
  ) {}

  ngAfterViewInit(): void {
    this.initKanbanTaskObserver();
    this.kanbanTasksSub = this.roleTourService.kanbanTasksState$.subscribe(() => {
      this.cdr.markForCheck();
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    try { this.kanbanObserver?.disconnect(); } catch (e) {}
    try { this.kanbanTasksSub?.unsubscribe(); } catch (e) {}
  }

  onTourSkip(): void {
    this.roleTourService.skipActiveTour();
  }

  onKanbanOpenNext(): void {
    this.roleTourService.requestKanbanBoardOpen();
  }

  onChatOpenNext(): void {
    this.roleTourService.requestChatConversationOpen();
  }

  onEmployeeDetailsOpenNext(): void {
    this.roleTourService.requestEmployeeDetailsOpen();
  }

  onNoTaskKanbanEnd(): void {
    this.roleTourService.setPendingResume('kanban-task-actions');
    this.tourService.end();
  }

  async onKanbanTaskActionsNext(): Promise<void> {
    const steps = this.tourService.steps;
    const currentIndex = steps.indexOf(this.step);
    const nextStep = currentIndex >= 0 ? steps[currentIndex + 1] : undefined;
    const hasNext = this.tourService.hasNext(this.step);
    const svc: any = this.tourService as any;
    const nextAnchor = nextStep?.anchorId;
    const hasNextAnchor = nextAnchor ? !!svc?.anchors?.[nextAnchor] : false;

    if (hasNext && hasNextAnchor) {
      this.tourService.next();
      return;
    }

    if (nextAnchor) {
      const registered = await this.waitForAnchor(nextAnchor, 2500);
      if (registered) {
        this.tourService.next();
        return;
      }
    }
    this.roleTourService.markResumeInProgress('kanban-add-column');
    void this.roleTourService.resumeAtAnchor('kanban-add-column', { ignoreCompleted: true });
  }

  private async waitForAnchor(anchorId: string, timeoutMs: number): Promise<boolean> {
    const svc: any = this.tourService as any;
    if (svc?.anchors?.[anchorId]) return true;

    await firstValueFrom(
      svc.anchorRegister$?.pipe(
        filter((id: string) => id === anchorId),
        take(1),
        timeout({ first: timeoutMs })
      ) ?? new Promise(() => undefined)
    ).catch(() => undefined);

    return !!svc?.anchors?.[anchorId];
  }

  getProgressIndex(): number {
    const anchors = this.getProgressAnchors();
    const index = anchors.indexOf(this.step.anchorId);
    if (index >= 0) {
      return index + 1;
    }
    return this.tourService.steps.indexOf(this.step) + 1;
  }

  getProgressTotal(): number {
    return this.getProgressAnchors().length || this.tourService.steps.length;
  }

  private getProgressAnchors(): string[] {
    if (this.isEmptyKanbanTour()) {
      return this.emptyKanbanAnchors;
    }
    if (this.isNoTaskKanbanTour()) {
      return this.tourService.steps
        .map((s) => s.anchorId)
        .filter((anchorId) => !this.noTaskKanbanHiddenAnchors.includes(anchorId));
    }
    return this.tourService.steps.map((s) => s.anchorId);
  }

  private isEmptyKanbanTour(): boolean {
    return this.emptyKanbanAnchors.includes(this.step.anchorId) && localStorage.getItem('kanban.hasBoards') !== 'true';
  }

  private isNoTaskKanbanTour(): boolean {
    const anchorId = this.step?.anchorId;
    if (!anchorId) {
      return false;
    }
    const isKanbanStep = anchorId.startsWith('kanban-') || anchorId === 'side-kanban';
    if (!isKanbanStep) {
      return false;
    }

    return isKanbanStep &&
      localStorage.getItem('kanban.hasBoards') === 'true' &&
      localStorage.getItem('kanban.hasTasks') !== 'true';
  }

  isNoTaskKanbanEndStep(): boolean {
    return this.isNoTaskKanbanTour() && this.step?.anchorId === 'kanban-create-task';
  }

  private hasTaskAnchorsInDom(): boolean {
    if (typeof document === 'undefined') return false;
    return !!document.querySelector('[tourAnchor="kanban-task-actions"], .kanban-task-card');
  }

  private initKanbanTaskObserver(): void {
    if (typeof document === 'undefined') return;

    this.updateKanbanTaskState();

    this.kanbanObserver = new MutationObserver(() => {
      this.updateKanbanTaskState();
    });

    this.kanbanObserver.observe(document.body, { childList: true, subtree: true });
  }

  private updateKanbanTaskState(): void {
    const hasTasksDom = this.hasTaskAnchorsInDom();
    if (!hasTasksDom) return;

    this.ngZone.run(() => {
      if (localStorage.getItem('kanban.hasTasks') !== 'true') {
        localStorage.setItem('kanban.hasTasks', 'true');
      }

      this.cdr.markForCheck();
      this.cdr.detectChanges();
    });
  }

  @HostListener('document:keydown', ['$event'])
  onTourKeydown(event: KeyboardEvent): void {
    if (event.key !== 'ArrowRight') return;
    const target = event.target as HTMLElement | null;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
      return;
    }

    const current = this.tourService.currentStep;
    if (!current?.anchorId) return;

    if (current.anchorId === 'kanban-first-board') {
      event.preventDefault();
      event.stopPropagation();
      this.onKanbanOpenNext();
      return;
    }
    if (current.anchorId === 'kanban-create-task') {
      event.preventDefault();
      event.stopPropagation();
      if (this.isNoTaskKanbanEndStep()) {
        this.onNoTaskKanbanEnd();
        return;
      }
      this.tourService.next();
      return;
    }
    if (current.anchorId === 'kanban-task-actions') {
      event.preventDefault();
      event.stopPropagation();
      this.onKanbanTaskActionsNext();
      return;
    }
    if (current.anchorId === 'chat-first-conversation') {
      event.preventDefault();
      event.stopPropagation();
      this.onChatOpenNext();
      return;
    }
    if (current.anchorId === 'employee-first-name') {
      event.preventDefault();
      event.stopPropagation();
      this.onEmployeeDetailsOpenNext();
    }
  }
}
