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

import { AppCodeViewComponent } from 'src/app/components/code-view/code-view.component';

// snippets
// import { SELECTION_TABLE_HTML_SNIPPET } from './code/selection-table-html-snippet';
// import { SELECTION_TABLE_TS_SNIPPET } from './code/selection-table-ts-snippet';

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

// const ELEMENT_DATA: PeriodicElement[] = [
//   {
//     id: 1,
//     imagePath: 'assets/images/profile/user-1.jpg',
//     uname: 'Sunil Joshi',
//     position: 'Web Designer',
//     productName: 'Elite Admin',
//     budget: 3.9,
//     priority: 'low',
//   },
//   {
//     id: 2,
//     imagePath: 'assets/images/profile/user-2.jpg',
//     uname: 'Andrew McDownland',
//     position: 'Project Manager',
//     productName: 'Real Homes Theme',
//     budget: 24.5,
//     priority: 'medium',
//   },
//   {
//     id: 3,
//     imagePath: 'assets/images/profile/user-3.jpg',
//     uname: 'Christopher Jamil',
//     position: 'Project Manager',
//     productName: 'MedicalPro Theme',
//     budget: 12.8,
//     priority: 'high',
//   },
//   {
//     id: 4,
//     imagePath: 'assets/images/profile/user-4.jpg',
//     uname: 'Nirav Joshi',
//     position: 'Frontend Engineer',
//     productName: 'Hosting Press HTML',
//     budget: 2.4,
//     priority: 'critical',
//   },
//   {
//     id: 1,
//     imagePath: 'assets/images/profile/user-1.jpg',
//     uname: 'Sunil Joshi',
//     position: 'Web Designer',
//     productName: 'Elite Admin',
//     budget: 3.9,
//     priority: 'low',
//   },
//   {
//     id: 2,
//     imagePath: 'assets/images/profile/user-2.jpg',
//     uname: 'Andrew McDownland',
//     position: 'Project Manager',
//     productName: 'Real Homes Theme',
//     budget: 24.5,
//     priority: 'medium',
//   },
// ];

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

  // 1 [Selection with Table]
//   codeForSelectionTable = SELECTION_TABLE_HTML_SNIPPET;
//   codeForSelectionTableTs = SELECTION_TABLE_TS_SNIPPET;

  displayedColumns: string[] = [
    'select',
    'name',
    'skills',
    'status',
    'email',
    'company',
    'edit',
  ];
    dataSource = new MatTableDataSource<any>([]); // dataSource = new MatTableDataSource<PeriodicElement>(ELEMENT_DATA);
    selection = new SelectionModel<any>(true, []);// selection = new SelectionModel<PeriodicElement>(true, []);
  applicationsData: any[] = [];
  interviews: any[] = [];
  picturesUrl: string = 'https://inimble-app.s3.us-east-1.amazonaws.com/applications/photos';
  assetsPath: string = environment.assets + '/default-user-profile-pic.webp';
  companiesData: any[] = [];

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected(): any {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle(): void {
    this.isAllSelected()
      ? this.selection.clear()
      : this.dataSource.data.forEach((row) => this.selection.select(row));
  }

  /** The label for the checkbox on the passed row */
  checkboxLabel(row?: PeriodicElement): string {
    if (!row) {
      return `${this.isAllSelected() ? 'select' : 'deselect'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${
      row.position + 1
    }`;
  }

  getApplications() {
    this.applicationService.get().subscribe((applications) => {
      this.applicationsData = applications;
      this.dataSource.data = applications;
      console.log("Applications: ",this.applicationsData)
    });
    this.companiesService.getCompanies().subscribe({
      next: companies => {
        this.companiesData = companies;
        console.log("Companies: ", this.companiesData);
      },
    });
  }
  getInterviews() {
    this.interviewsService.get().subscribe({
      next: interviews => {
        this.interviews = interviews;
        console.log("Interviews: ", this.interviews);
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
      this.getApplications(); // Refrescar la lista
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
  
  constructor(
    private applicationService: ApplicationsService,
    private interviewsService: InterviewsService,
    private companiesService: CompaniesService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.getApplications();
    this.getInterviews();
  }
}
