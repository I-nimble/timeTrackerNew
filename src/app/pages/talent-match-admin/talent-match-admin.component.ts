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
    'skills',
    'status',
    'email',
    'company',
    'actions',
  ];
  dataSource = new MatTableDataSource<any>([]);
  selection = new SelectionModel<any>(true, []);
  applicationsData: any[] = [];
  interviews: any[] = [];
  picturesUrl: string = 'https://inimble-app.s3.us-east-1.amazonaws.com/applications/photos';
  resumesUrl: string = 'https://inimble-app.s3.us-east-1.amazonaws.com/applications/resumes';
  assetsPath: string = environment.assets + '/default-user-profile-pic.webp';
  companiesData: any[] = [];

  constructor(
    private applicationService: ApplicationsService,
    private interviewsService: InterviewsService,
    private companiesService: CompaniesService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  // /** Whether the number of selected elements matches the total number of rows. */
  // isAllSelected(): any {
  //   const numSelected = this.selection.selected.length;
  //   const numRows = this.dataSource.data.length;
  //   return numSelected === numRows;
  // }

  // /** Selects all rows if they are not all selected; otherwise clear selection. */
  // masterToggle(): void {
  //   this.isAllSelected()
  //     ? this.selection.clear()
  //     : this.dataSource.data.forEach((row) => this.selection.select(row));
  // }

  // /** The label for the checkbox on the passed row */
  // checkboxLabel(row?: PeriodicElement): string {
  //   if (!row) {
  //     return `${this.isAllSelected() ? 'select' : 'deselect'} all`;
  //   }
  //   return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${
  //     row.position + 1
  //   }`;
  // }

  getApplications() {
    this.applicationService.get().subscribe((applications) => {
      this.applicationsData = applications;
      this.dataSource.data = applications;
      console.log(applications)
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

  getStatus(application: any): { label: string, color: string } {
    if (application.company_id === -1) {
      return { label: 'On Hold', color: 'bg-light-error text-error' }; // high
    }
    if (this.interviews.some(i => i.company_id === application.company_id)) {
      return { label: 'Waiting for Interview', color: 'bg-light-warning text-warning' }; // medium
    }
    return { label: 'Assigned', color: 'bg-light-success text-success' }; // low
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

  ngOnInit(): void {
    this.getApplications();
    this.getInterviews();
  }

  openSnackBar(message: string, action: string) {
    this.snackBar.open(message, action, {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }
}
