import { Component, OnInit } from '@angular/core';
import { SelectionModel } from '@angular/cdk/collections';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { Highlight, HighlightAuto } from 'ngx-highlightjs';
import { HighlightLineNumbers } from 'ngx-highlightjs/line-numbers';
import { ApplicationsService } from 'src/app/services/applications.service';
import { PositionsService } from 'src/app/services/positions.service';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Optional, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { InterviewsService } from 'src/app/services/interviews.service';
import { CompaniesService } from 'src/app/services/companies.service';
import moment from 'moment';

@Component({
  standalone: true,
  selector: 'app-talent-match-client',
  imports: [
    MatCardModule,
    MatTableModule,
    CommonModule,
    MatCheckboxModule,
    MatDividerModule,
    Highlight,
    HighlightAuto,
    HighlightLineNumbers,
    MaterialModule,
    TablerIconsModule,
    FormsModule,
  ],
  templateUrl: './client.component.html',
})
export class AppTalentMatchClientComponent implements OnInit {
  userRole = localStorage.getItem('role');
  resumesUrl: string = 'https://inimble-app.s3.us-east-1.amazonaws.com/resumes';
  picturesUrl: string = 'https://inimble-app.s3.us-east-1.amazonaws.com/photos';
  positions: any[] = [];
  searchText: string = '';
  displayedColumns: string[] = [
    'select',
    'name',
    'skills',
    'english level',
    'availability',
    'resume',
    'interview',
    'actions',
  ];
  dataSource!: MatTableDataSource<any>;
  selection = new SelectionModel<any>(true, []);
  companyId: number | null = null;
  interviews: any[] = [];
  assetsPath: string = 'assets/images/default-user-profile-pic.png';

  constructor(
    private applicationsService: ApplicationsService,
    private positionsService: PositionsService,
    public dialog: MatDialog,
    private companiesService: CompaniesService,
    private interviewsService: InterviewsService
  ) {}

  ngOnInit(): void {
    this.getApplications();
    this.getPositions();
    this.getCompany();
    this.getInterviews();
  }

  getInterviewDateTime(applicationId: number) {
    const interview = this.interviews.find(
      (interview) => interview.application_id === applicationId
    );
    if (interview) {
      return interview.date_time;
    }
    return null;
  }

  getInterviews() {
    this.interviewsService.get().subscribe({
      next: (interviews: any) => {
        this.interviews = interviews;
      },
      error: (err: any) => {
        console.error('Error fetching interviews:', err);
      },
    });
  }

  getCompany() {
    this.companiesService.getByOwner().subscribe((company: any) => {
      this.companyId = company.company.id;
    });
  }

  openDialog(action: string, row?: any): void {
    if (row && !this.selection.isSelected(row)) {
      this.selection.toggle(row);
    }
    let interview = null;
    if (action === 'Reeschedule' && row) {
      interview = this.interviews.find(
        (interview) => interview.application_id === row.id
      );
    }
    const dialogRef = this.dialog.open(AppInterviewDialogContentComponent, {
      data: {
        action,
        date_time: interview?.date_time || null,
        interviewId: interview?.id || null,
        selected: this.selection.selected,
        companyId: this.companyId,
      },
      autoFocus: false,
    });

    dialogRef.afterClosed().subscribe((result) => {
      this.getInterviews();
      this.selection.clear();
    });
  }

  cancelInterview(applicationId: number) {
    const interview = this.interviews.find(
      (interview) => interview.application_id === applicationId
    );
    this.interviewsService.cancel(interview.id).subscribe({
      next: (response: any) => {
        this.getInterviews();
      },
      error: (err: any) => {
        console.error('Error cancelling interview:', err);
      },
    });
  }

  applyFilter() {
    if (this.dataSource) {
      this.dataSource.filter = this.searchText.trim().toLowerCase();
    }
  }

  getApplications() {
    this.applicationsService.get().subscribe({
      next: (applications: any) => {
        let filteredApplications: any[] = this.applicationsService.getFilteredApplicationsByDay(applications);
       
        this.dataSource = new MatTableDataSource(filteredApplications);

        if (filteredApplications.find((app: any) => app.status_id === 1)) {
          this.applicationsService.markAsSeen().subscribe();
        }
      },
      error: (err: any) => {
        console.error('Error fetching applications:', err);
      },
    });
  }

  getPositions() {
    this.positionsService.get().subscribe({
      next: (positions: any) => {
        this.positions = positions;
      },
      error: (err: any) => {
        console.error('Error fetching positions:', err);
      },
    });
  }

  getPositionTitle(positionId: any) {
    return this.positions.find((p: any) => p.id == positionId)?.title;
  }

  downloadFile(url: string, filename: string) {
    fetch(this.resumesUrl + '/' + url)
      .then((response) => response.blob())
      .then((blob) => {
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = filename + '.pdf';
        link.click();
        window.URL.revokeObjectURL(link.href);
      });
  }

  onRowSelectionChange() {
    this.applicationsService.clearSelectedApplicants();
    this.applicationsService.setSelectedApplicants(this.selection.selected);
  }

  masterToggleAndSyncSelection() {
    this.masterToggle();
    this.onRowSelectionChange();
  }

  isAllSelected(): boolean {
    if (!this.dataSource || !this.dataSource.data) {
      return false;
    }
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  masterToggle(): void {
    if (!this.dataSource || !this.dataSource.data) {
      return;
    }
    this.isAllSelected()
      ? this.selection.clear()
      : this.dataSource.data.forEach((row) => this.selection.select(row));
  }

  checkboxLabel(row?: any): string {
    if (!row) {
      return `${this.isAllSelected() ? 'select' : 'deselect'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${
      row.position + 1
    }`;
  }

  onRowClick(row: any) {
    if (!this.getInterviewDateTime(row.id)) {
      this.selection.toggle(row);
      this.onRowSelectionChange();
    }
  }

  handleImageError(event: Event) {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = this.assetsPath;
    imgElement.onerror = null;
  }
}

// Interview modal component
@Component({
  selector: 'app-dialog-content',
  standalone: true,
  imports: [
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    TablerIconsModule,
  ],
  templateUrl: 'interview-dialog-content.html',
})
export class AppInterviewDialogContentComponent {
  local_data: any;
  interviewForm: FormGroup;
  interviewScheduled = false;
  availableDaysFilter = (d: Date | null): boolean => {
    if (!d) return false;

    // Get today and normalize to 00:00:00
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate the Monday of the current week
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1);

    // Calculate the Sunday of the current week
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    // Normalize the selected date
    const date = new Date(d);
    date.setHours(0, 0, 0, 0);

    // Only allow Wednesday and Thursday of the current week, and not before today
    const day = date.getDay();
    const isThisWeek = date >= monday && date <= sunday;
    const isWedOrThu = day === 3 || day === 4;
    const isTodayOrFuture = date >= today;

    return isThisWeek && isWedOrThu && isTodayOrFuture;
  };

  constructor(
    public dialog: MatDialog,
    public dialogRef: MatDialogRef<AppInterviewDialogContentComponent>,
    private snackBar: MatSnackBar,
    private fb: FormBuilder,
    private interviewsService: InterviewsService,
    private applicationsService: ApplicationsService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.local_data = data;
    this.interviewForm = this.fb.group({
      date: [null, Validators.required],
      time: [null, Validators.required],
    });
    const m = moment(this.local_data.date_time).local();
    if (this.local_data.action === 'Reeschedule' && this.local_data.date_time) {
      this.interviewForm.patchValue({
        date: m.toDate(),
        time: m.format('HH:mm'),
      });
    }
  }

  onScheduleInterview() {
    if (this.interviewForm.valid) {
      const date = this.interviewForm.value.date;
      const time = this.interviewForm.value.time;
      const dateTime = new Date(date);
      const [hours, minutes] = time.split(':');
      dateTime.setHours(+hours, +minutes, 0, 0);
      const date_time = dateTime.toISOString();

      const applicants = this.local_data.selected;
      const company_id = this.data.companyId;

      const data = {
        date_time,
        applicants,
        company_id,
      };
      if (this.local_data.action === 'Schedule') {
        this.interviewsService.post(data).subscribe({
          next: (response: any) => {
            this.interviewScheduled = true;
          },
          error: (err: any) => {
            console.error('Error scheduling interview:', err);
            this.openSnackBar('Error scheduling interview', 'Close');
            this.dialogRef.close({ event: 'Cancel' });
          },
        });
      } else if (this.local_data.action === 'Reeschedule') {
        this.interviewsService
          .put(data, this.local_data.interviewId)
          .subscribe({
            next: (response: any) => {
              this.interviewScheduled = true;
            },
            error: (err: any) => {
              console.error('Error reescheduling interview:', err);
              this.openSnackBar('Error reescheduling interview', 'Close');
              this.dialogRef.close({ event: 'Cancel' });
            },
          });
      }
    }
  }

  openSnackBar(message: string, action: string) {
    this.snackBar.open(message, action, {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }

  closeDialog(): void {
    this.dialogRef.close({ event: 'Cancel' });
  }
}
