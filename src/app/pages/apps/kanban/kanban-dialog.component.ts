import { CommonModule } from '@angular/common';
import { Component, Inject, Optional } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MaterialModule } from 'src/app/material.module';
import { DatePipe } from '@angular/common';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, provideNativeDateAdapter } from '@angular/material/core';
import { RatingsService } from 'src/app/services/ratings.service';
@Component({
    selector: 'app-kanban-dialog',
    templateUrl: './kanban-dialog.component.html',
    standalone: true,
    imports: [
        MaterialModule,
        CommonModule,
        TablerIconsModule,
        FormsModule,
        ReactiveFormsModule,
        MatDatepickerModule,
        MatNativeDateModule
    ],
    providers: [DatePipe, provideNativeDateAdapter()]
})
export class AppKanbanDialogComponent {
  action: string;
  local_data: any;
  priorities: any[] = [];

  constructor(
    public dialogRef: MatDialogRef<AppKanbanDialogComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any,
    private datePipe: DatePipe,
    public ratingsService: RatingsService
  ) {
    this.getPriorities();
    this.local_data = { ...data };
    this.action = this.local_data.action;
    
    if (data.type === 'board') {
      this.local_data.type = 'board';
    } else {
      this.local_data.type = 'task';
      this.local_data.date = this.datePipe.transform(new Date(), 'd MMMM')!;
      this.local_data.taskProperty ||= 'Design';
      this.local_data.imageUrl ||= '/assets/images/taskboard/kanban-img-1.jpg';
    }
  }

  getPriorities() {
    this.ratingsService.getPriorities().subscribe((priorities: any[]) => {
      this.priorities = priorities;
    });
  }

  doAction(): void {
    this.dialogRef.close({ event: this.action, data: this.local_data });
  }

  closeDialog(): void {
    this.dialogRef.close({ event: 'Cancel' });
  }
}
