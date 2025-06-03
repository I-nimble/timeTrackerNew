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
    FormsModule
  ],
  templateUrl: './client.component.html',
})
export class AppTalentMatchClientComponent implements OnInit {
  userRole = localStorage.getItem('role');
  resumesUrl: string = 'https://inimble-app.s3.us-east-1.amazonaws.com/applications/resumes';
  picturesUrl: string = 'https://inimble-app.s3.us-east-1.amazonaws.com/applications/photos';
  positions: any[] = [];
  searchText: string = '';
  displayedColumns: string[] = [
    'select',
    'name',
    'skills',
    'english level',
    'availability',
    'interview',
    'resume',
  ];
  dataSource!: MatTableDataSource<any>;
  selection = new SelectionModel<any>(true, []);
  companyId: number | null = null;
  interviews: any[] = [];

  constructor(
    private applicationsService: ApplicationsService,
    private positionsService: PositionsService,
    public dialog: MatDialog,
    private companiesService: CompaniesService,
    private interviewsService: InterviewsService,
  ) {}

  ngOnInit(): void {
    this.getApplications();
    this.getPositions();
    this.getCompany();
    this.getInterviews();
  }

  getInterviewDateTime(applicationId: number) {
    const interview = this.interviews.find(interview => interview.application_id === applicationId);
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

  openDialog(): void {
    const dialogRef = this.dialog.open(AppInterviewDialogContentComponent, {
      data: { selected: this.selection.selected, companyId: this.companyId },
      autoFocus: false,
    });

    dialogRef.afterClosed().subscribe((result) => {
      this.getInterviews();
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
        this.dataSource = new MatTableDataSource(applications);
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
      .then(response => response.blob())
      .then(blob => {
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
      time: [null, Validators.required]
    });
  }

  onScheduleInterview() {
    if (this.interviewForm.valid) {
      const date = this.interviewForm.value.date;
      const time = this.interviewForm.value.time;
      const dateTime = new Date(date);
      const [hours, minutes] = time.split(':');
      dateTime.setHours(+hours, +minutes, 0, 0);
      const date_time = dateTime.toISOString();

      const applicants = this.applicationsService.getSelectedApplicant();
      const company_id = this.data.companyId;

      const data = {
        date_time,
        applicants,
        company_id
      };
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
