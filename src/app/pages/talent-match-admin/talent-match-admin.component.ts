import { Component, OnInit } from '@angular/core';
import { SelectionModel } from '@angular/cdk/collections';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { ApplicationsService } from 'src/app/services/applications.service';
import { InterviewsService } from 'src/app/services/interviews.service';
import { environment } from 'src/environments/environment';
import { CompaniesService } from 'src/app/services/companies.service';
import { PositionsService } from 'src/app/services/positions.service';
import { MatDialog } from '@angular/material/dialog';
import { AddCandidateDialogComponent } from './new-candidate-dialog/add-candidate-dialog.component'; 
import { MatSnackBar } from '@angular/material/snack-bar';
import { ModalComponent } from 'src/app/components/confirmation-modal/modal.component';

import { AppCodeViewComponent } from 'src/app/components/code-view/code-view.component';

import { Highlight, HighlightAuto } from 'ngx-highlightjs';
import { HighlightLineNumbers } from 'ngx-highlightjs/line-numbers';

export interface PeriodicElement {
  id: number;
  imagePath: string;
  uname: string;
  position: string;
  productName: string;
  budget: number;
  priority: string;
}

@Component({
  standalone: true,
  selector: 'app-talent-match-admin',
  imports: [
    MatCardModule,
    MatTableModule,
    CommonModule,
    MatCheckboxModule,
    MatDividerModule,
    Highlight,
    HighlightAuto,
    HighlightLineNumbers,
    AppCodeViewComponent,
    MaterialModule,
    TablerIconsModule,
  ],
  templateUrl: './talent-match-admin.component.html',
})
export class AppTalentMatchAdminComponent implements OnInit {
  displayedColumns: string[] = [
    // 'select',
    'name',
    'position',
    'skills',
    'location',
    'status',
    'interviewing on',
    'company',
    'actions',
  ];
  dataSource = new MatTableDataSource<any>([]);
  selection = new SelectionModel<any>(true, []);
  applicationsData: any[] = [];
  interviews: any[] = [];
  picturesUrl: string = 'https://inimble-app.s3.us-east-1.amazonaws.com/photos';
  resumesUrl: string = 'https://inimble-app.s3.us-east-1.amazonaws.com/resumes';
  assetsPath: string = environment.assets + '/default-user-profile-pic.webp';
  companiesData: any[] = [];
  positions: any[] = [];

  constructor(
    private applicationService: ApplicationsService,
    private interviewsService: InterviewsService,
    private companiesService: CompaniesService,
    private positionsService: PositionsService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }
  
  
  ngOnInit(): void {
    this.getApplications();
    this.getPositions();
    this.getInterviews();
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

  getApplications() {
    this.applicationService.get().subscribe((applications) => {
      this.applicationsData = applications;
      this.dataSource.data = applications;
    });
    this.companiesService.getCompanies().subscribe({
      next: companies => {
        this.companiesData = companies;
      },
    });
  }
  getInterviews() {
    this.interviewsService.get().subscribe({
      next: interviews => {
        this.interviews = interviews;
      },
    });
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

  getPositionTitle(positionId: any) {
    return this.positions.find((p: any) => p.id == positionId)?.title;
  }

  handleImageError(event: Event) {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = this.assetsPath;

    imgElement.onerror = null;
  }

  getCompanyName(company_id: number): string {
    if (company_id === -1) return 'N/A';
    const company = this.companiesData.find((c: any) => c.id === company_id);
    return company ? company.name : 'N/A';
  }

  openAddCandidateDialog(): void {
    const dialogRef = this.dialog.open(AddCandidateDialogComponent, {
      width: '600px',
      data: { companies: this.companiesData }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'success') {
        this.getApplications();
      }
    });
  }

  openEditCandidateDialog(candidate: any): void {
    const dialogRef = this.dialog.open(AddCandidateDialogComponent, {
      width: '600px',
      data: {
        candidate, 
        companies: this.companiesData
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'success') {
        this.getApplications();
      }
    });
  }

  openCandidateResume(resumeUrl: string) {
    if(!resumeUrl) {
      this.openSnackBar('No resume found for this candidate', 'Close');
      return;
    }
    const url = this.resumesUrl + '/' + resumeUrl;
    window.open(url, '_blank');
  }

  deleteCandidate(id: number) {
    const dialogRef = this.dialog.open(ModalComponent, {
      width: '400px',
      data: {
        action: 'Delete',
        subject: 'candidate',
      },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.applicationService.delete(id).subscribe({
          next: () => {
            this.getApplications();
          },
          error: (err) => {
            this.openSnackBar('Error deleting candidate', 'Close');
          },
        });
      }
    });

  }

  openSnackBar(message: string, action: string) {
    this.snackBar.open(message, action, {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }
}
