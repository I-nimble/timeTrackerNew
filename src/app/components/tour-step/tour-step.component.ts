import { ChangeDetectionStrategy, Component, HostListener, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/material.module';
import { TourService } from 'ngx-ui-tour-md-menu';
import { RoleTourStep } from 'src/app/services/role-tour-steps';
import { RoleTourService } from 'src/app/services/role-tour.service';

@Component({
  selector: 'app-tour-step',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './tour-step.component.html',
  styleUrls: ['./tour-step.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TourStepComponent {
  @Input({ required: true }) step!: RoleTourStep;
  private readonly emptyKanbanAnchors = ['side-kanban', 'kanban-boards', 'kanban-new-board'];
  private readonly noTaskKanbanHiddenAnchors = ['kanban-search-tasks', 'kanban-task-actions', 'kanban-add-column'];

  constructor(
    public tourService: TourService<RoleTourStep>,
    private roleTourService: RoleTourService,
  ) {}

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
    return this.step.anchorId.startsWith('kanban-') &&
      localStorage.getItem('kanban.hasBoards') === 'true' &&
      localStorage.getItem('kanban.hasTasks') !== 'true';
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
      this.tourService.next();
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
