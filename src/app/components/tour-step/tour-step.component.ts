import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
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
}
