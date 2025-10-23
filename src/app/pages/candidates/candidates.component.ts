import {
  Component,
  ViewChild,
  signal,
} from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { MaterialModule } from 'src/app/material.module';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TablerIconsModule } from 'angular-tabler-icons';
import { RouterModule } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApplicationsService } from 'src/app/services/applications.service';
import { StripeComponent } from 'src/app/components/stripe/stripe.component';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';
import { PositionsService } from 'src/app/services/positions.service';
import { ModalComponent } from 'src/app/components/confirmation-modal/modal.component';
import { AddCandidateDialogComponent } from '../talent-match-admin/new-candidate-dialog/add-candidate-dialog.component'; 
import { CompaniesService } from 'src/app/services/companies.service';

@Component({
  selector: 'app-candidates',
  imports: [
    MaterialModule,
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    TablerIconsModule,
    StripeComponent,
  ],
  templateUrl: './candidates.component.html',
  styleUrl: './candidates.component.scss'
})
export class CandidatesComponent {
  role: any = localStorage.getItem('role');
  candidatesList = new MatTableDataSource<any>([]);
  activeTab = signal<string>('all');
  displayedColumns: string[] = [];
  pendingCandidates = signal<any[]>([]);
  reviewingCandidates = signal<any[]>([]);
  talentMatchCandidates = signal<any[]>([]);
  allowedTM: boolean = false;
  startDate: Date | null = null;
  endDate: Date | null = null;
  positions = signal<any[]>([]);
  companiesData: any[] = [];

  @ViewChild(MatSort) sort: MatSort = Object.create(null);
  @ViewChild(MatPaginator) paginator: MatPaginator = Object.create(null);

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    public router: Router,
    private applicationsService: ApplicationsService,
    private positionsService: PositionsService,
    private companiesService: CompaniesService,
  ) { }

  ngOnInit(): void {
    const email = localStorage.getItem('email');
    const allowedPaymentsEmails = environment.allowedPaymentsEmails;
    const allowedReportsEmails = environment.allowedReportEmails;
    this.allowedTM = this.role === '2' && allowedReportsEmails.includes(email || '') || allowedPaymentsEmails.includes(email || '');

    if (this.role != '1' && !this.allowedTM) {
      this.router.navigate(['/dashboard']);
    }

    this.displayedColumns = [
      'name',
      'position',
      'skills',
      'location',
      'submission_date',
      'status',
      'actions',
    ];

    this.loadCandidates();
    this.loadPositions();

    this.companiesService.getCompanies().subscribe({
      next: companies => {
        this.companiesData = companies;
      },
    });
  }

  ngAfterViewInit(): void {
    this.candidatesList.paginator = this.paginator;
    this.candidatesList.sort = this.sort;
  }

  onDateRangeChange(): void {
    if (this.startDate && this.endDate) {
      this.filterCandidates();
    }
  }

  loadPositions(): void {
    this.positionsService.get().subscribe({
      next: (positions: any[]) => {
        this.positions.set(positions);
      }
    });
  }

  getPositionName(positionId: number): string {
    const position = this.positions().find((position: any) => position.id === positionId);
    return position ? position.title : '';
  }

  downloadCandidateInfo(id: number, format: string): void {
    this.applicationsService.getCandidateFile(id, format).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `candidate-${id}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
        document.body.appendChild(link);
        link.click();

        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
      },
      error: (err: any) => {
        console.error('Error downloading candidate info:', err);
      },
    });
  }

  handleTabClick(tab: string): void {
    this.activeTab.set(tab);
    this.filterCandidates();
  }

  filterCandidates(): void {
    const currentTab = this.activeTab();
    let filteredCandidates: any[] = [];

    if (currentTab === 'all') {
      filteredCandidates = [
        ...this.pendingCandidates(),
        ...this.reviewingCandidates(),
        ...this.talentMatchCandidates()
      ];
    } else if (currentTab === 'pending') {
      filteredCandidates = [...this.pendingCandidates()];
    } else if (currentTab === 'reviewing') {
      filteredCandidates = [...this.reviewingCandidates()];
    }
    else if (currentTab === 'talent match') {
      filteredCandidates = [...this.talentMatchCandidates()];
    }

    if (this.startDate && this.endDate) {
      const [start, end] = [this.startDate, this.endDate].map(d => new Date(d).setHours(0, 0, 0, 0));
      filteredCandidates = filteredCandidates.filter((candidate: any) => {
        const submission = new Date(candidate.submission_date).setHours(0, 0, 0, 0);
        return submission >= start && submission <= end;
      });
    }

    this.candidatesList.data = filteredCandidates;
  }

  private loadCandidates(): void {
    this.applicationsService.get().subscribe((applications: any[]) => {
      this.pendingCandidates.set(applications.filter((application: any) => application.status === 'pending'));
      this.reviewingCandidates.set(applications.filter((application: any) => application.status === 'reviewing'));
      this.talentMatchCandidates.set(applications.filter((application: any) => application.status === 'talent match'));

      this.candidatesList = new MatTableDataSource(applications);
      this.candidatesList.paginator = this.paginator;
      this.candidatesList.sort = this.sort;
    });
  }

  countInvoicesByStatus(status: string): number {
    return this.candidatesList.data.filter((application) => application.status === status)
      .length;
  }

  openEditCandidateDialog(candidate: any): void {
    const dialogRef = this.dialog.open(AddCandidateDialogComponent, {
      width: '600px',
      data: { 
        companies: this.companiesData, 
        action: 'edit', 
        candidate: candidate 
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'success') {
        this.loadCandidates();
      }
    });
  }

  deleteApplication(id: number): void {
    const dialogRef = this.dialog.open(ModalComponent, {
      data: {
        action: 'delete',
        type: 'application',
      }
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      this.loadCandidates();
      if (result) {
        this.applicationsService.delete(id).subscribe({
          next: () => {
            this.loadCandidates();
            this.filterCandidates();
            this.showSnackbar('Invoice deleted successfully!');
          },
          error: () => {
            this.showSnackbar('Error deleting invoice.');
          }
        });
      }
    });
  }

  sendToTalentMatch(id: number): void {
    this.applicationsService.sendToTalentMatch(id).subscribe({
      next: () => {
        this.showSnackbar('Candidate sent to talent match successfully!');
        this.loadCandidates();
        this.filterCandidates();
      },
      error: () => {
        this.showSnackbar('Error sending candidate to client.');
      }
    });
  }

  showSnackbar(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }

  mapStatus(statusId: number): string {
    switch (statusId) {
      case 1:
        return 'pending';
      case 2:
        return 'reviewing';
      case 3:
        return 'talent match';
      default:
        return 'unknown';
    }
  }

  uploadCV(candidateId: number): void {
    let file = null;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    input.onchange = (e: any) => {
      file = e.target.files[0];
      if (!file) return;

      const validTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      const extension = file.name.split('.').pop()?.toLowerCase();
      const validExts = ['pdf', 'doc', 'docx'];

      if (!validTypes.includes(file.type) && !(extension && validExts.includes(extension))) {
        this.showSnackbar('Invalid file format. Please upload a PDF or Word.');
        return;
      }

      this.applicationsService.uploadCV(file, candidateId).subscribe({
        next: () => {
          this.showSnackbar("CV uploaded successfully");
        },
        error: () => {
          this.showSnackbar("Error uploading CV");
        },
      });
    };
    input.click();
  }
}
