import {
  Component,
  ViewChild,
  signal,
} from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MaterialModule } from 'src/app/material.module';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TablerIconsModule } from 'angular-tabler-icons';
import { RouterModule } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApplicationsService } from 'src/app/services/applications.service';
import { Router } from '@angular/router';
import { PositionsService } from 'src/app/services/positions.service';
import { ModalComponent } from 'src/app/components/confirmation-modal/modal.component';
import { AddCandidateDialogComponent } from '../talent-match-admin/new-candidate-dialog/add-candidate-dialog.component'; 
import { CompaniesService } from 'src/app/services/companies.service';
import { PermissionService } from 'src/app/services/permission.service';
import { MatchPercentagesModalComponent } from 'src/app/components/match-percentages-modal/match-percentages-modal.component';
import { DiscProfilesService } from 'src/app/services/disc-profiles.service';
import { ApplicationMatchScoresService } from 'src/app/services/application-match-scores.service';
import { forkJoin, of, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { PositionDiscModalComponent } from 'src/app/components/position-disc-modal/position-disc-modal.component';
import { RejectionDialogComponent } from '../rejected/rejection-dialog/rejection-dialog.component';
import { getTrainingNames } from 'src/app/utils/candidate.utils';
import { ApplicationListResponse } from 'src/app/models/application.model';

@Component({
  selector: 'app-candidates',
  imports: [
    MaterialModule,
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    TablerIconsModule,
  ],
  templateUrl: './candidates.component.html',
  styleUrl: './candidates.component.scss'
})
export class CandidatesComponent {
  role: any = localStorage.getItem('role');
  candidatesList = new MatTableDataSource<any>([]);
  activeTab = signal<string>('all');
  displayedColumns: string[] = [];
  totalRecords = 0;
  pageSize = 10;
  currentPage = 1;
  pendingCount = 0;
  reviewingCount = 0;
  talentMatchCount = 0;
  private pageCandidates: any[] = [];
  allowedTM: boolean = false;
  startDate: Date | null = null;
  endDate: Date | null = null;
  positions = signal<any[]>([]);
  companiesData: any[] = [];
  canView: boolean = false;
  canManage: boolean = false;
  canEdit: boolean = false;
  canDelete: boolean = false;

  @ViewChild(MatSort) sort: MatSort = Object.create(null);
  @ViewChild(MatPaginator) paginator: MatPaginator = Object.create(null);

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    public router: Router,
    private applicationsService: ApplicationsService,
    private positionsService: PositionsService,
    private companiesService: CompaniesService,
    private permissionService: PermissionService,
    private discProfilesService: DiscProfilesService,
    private applicationMatchScoresService: ApplicationMatchScoresService
  ) { }

  ngOnInit(): void {
    this.applicationsService.loadApplicationStatuses().subscribe();
    this.loadCandidates();
    this.loadStatusCounts();
    this.loadPositions();

    this.companiesService.getCompanies().subscribe({
      next: companies => {
        this.companiesData = companies;
      },
    });

    const userId = Number(localStorage.getItem('id'));
    this.permissionService.getUserPermissions(userId).subscribe({
      next: (userPerms: any) => {
        const effective = userPerms.effectivePermissions || [];
        this.canManage = effective.includes('candidates.manage');
        this.canEdit = effective.includes('candidates.edit');
        this.canView = effective.includes('candidates.view');
        this.canDelete = effective.includes('candidates.delete');

        if (this.role != '1' && !this.canView) {
          this.router.navigate(['/dashboard']);
        }

        if (this.role == '1' || this.canView) {
          this.displayedColumns = [
            'name',
            'position',
            'skills',
            'trainings',
            'location',
            'submission_date',
            'status',
            'actions',
          ];
        } else {
          this.displayedColumns = [
            'name',
            'skills',
            'trainings',
            'location',
            'submission_date',
            'status',
            'actions',
          ];
        }
      },
      error: (err) => {
        console.error('Error fetching user permissions', err);
      },
    });
  }

  ngAfterViewInit(): void {
    this.candidatesList.sort = this.sort;
  }

  shouldDisableActionsButton(element: any): boolean {
    if (!this.canManage && !this.canEdit) {
      return true;
    }

    if (this.canEdit && !this.canManage) {
      const isEditableStatus = element.status === 'pending' || element.status === 'reviewing';
      return !isEditableStatus;
    }

    if (this.canManage) {
      return false;
    }

    return true;
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

  getPositionById(positionId: number): any {
    return this.positions().find((position: any) => position.id === positionId);
  }

  getDiscProfileColor(profileName: string): string {
    return this.discProfilesService.getDiscProfileColor(profileName);
  }

  getTrainingNames(certifications: any[] | undefined): string {
    return getTrainingNames(certifications);
  }

  openPositionDiscModal(): void {
    const dialogRef = this.dialog.open(PositionDiscModalComponent, {
      width: '650px',
      maxHeight: '80vh',
      data: {
        positions: this.positions()
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'success') {
        this.loadPositions();
        this.loadStatusCounts();
      }
    });
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
    this.currentPage = 1;
    this.loadCandidates();
  }

  filterCandidates(): void {
    let filteredCandidates: any[] = [...this.pageCandidates];

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
    this.getStatusIdsByTab(this.activeTab()).pipe(
      switchMap((statusIds) => {
        if (statusIds.length === 0) {
          return of(this.applicationsService.buildEmptyListResponse({
            page: this.currentPage,
            offset: this.pageSize,
          }));
        }

        return this.applicationsService.get({
          page: this.currentPage,
          offset: this.pageSize,
          statusIds,
        });
      }),
    ).subscribe((response: ApplicationListResponse) => {
      const applications = response.items || [];

      this.pageCandidates = applications;
      this.totalRecords = response.meta.total;
      this.currentPage = response.meta.currentPage;
      this.pageSize = response.meta.limit;
      this.filterCandidates();
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadCandidates();
  }

  private loadStatusCounts(): void {
    forkJoin([
      this.getStatusCountByName('pending'),
      this.getStatusCountByName('reviewing'),
      this.getStatusCountByName('talent match'),
    ]).subscribe({
      next: ([pendingCount, reviewingCount, talentMatchCount]) => {
        this.pendingCount = pendingCount;
        this.reviewingCount = reviewingCount;
        this.talentMatchCount = talentMatchCount;
      },
      error: (err) => {
        console.error('Error loading candidates status counts', err);
      },
    });
  }

  private getStatusIdsByTab(tab: string): Observable<number[]> {
    if (tab === 'pending') {
      return this.applicationsService.getStatusIdsByNames(['pending']);
    }
    if (tab === 'reviewing') {
      return this.applicationsService.getStatusIdsByNames(['reviewing']);
    }
    if (tab === 'talent match') {
      return this.applicationsService.getStatusIdsByNames(['talent match']);
    }
    return this.applicationsService.getStatusIdsByNames([
      'pending',
      'reviewing',
      'talent match',
      'hired',
      'scheduled interview',
    ]);
  }

  private getStatusCountByName(statusName: string): Observable<number> {
    return this.applicationsService.getStatusIdsByNames([statusName]).pipe(
      switchMap((statusIds) => {
        if (statusIds.length === 0) {
          return of(this.applicationsService.buildEmptyListResponse({ page: 1, offset: 1 }));
        }

        return this.applicationsService.get({
          page: 1,
          offset: 1,
          statusIds,
        });
      }),
      map((response) => response.meta.total),
    );
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
        subject: 'application',
      }
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      this.loadCandidates();
      if (result) {
        this.applicationsService.delete(id, 'delete').subscribe({
          next: () => {
            this.loadCandidates();
            this.filterCandidates();
            this.loadStatusCounts();
            this.showSnackbar('Application deleted successfully!');
          },
          error: () => {
            this.showSnackbar('Error deleting application.');
          }
        });
      }
    });
  }

  sendToTalentMatch(candidate: any): void {
    const dialogRef = this.dialog.open(MatchPercentagesModalComponent, {
      width: '600px',
      maxHeight: '80vh',
      data: {
        candidate: {
          id: candidate.id,
          name: candidate.name,
          email: candidate.email,
          position_id: candidate.position_id
        }
      },
      disableClose: false,
      hasBackdrop: true,
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result?.success) {
        const discProfileIds = (result.discProfiles || []).map((p: any) => p.id);
        const matchScores = result.matchScores || [];
        const discReq = discProfileIds.length
          ? this.discProfilesService.assignToApplication(candidate.id, discProfileIds)
          : null;
        const matchReq = matchScores.length
          ? this.applicationMatchScoresService.createMatchScores({ application_id: candidate.id, match_scores: matchScores })
          : null;
        const requests: Observable<any>[] = [];
        if (discReq) requests.push(discReq);
        if (matchReq) requests.push(matchReq);
        const executePersist: Observable<any> = requests.length ? forkJoin(requests) : of(null);
        executePersist.subscribe({
          next: () => {
            this.applicationsService.sendToTalentMatch(candidate.id).subscribe({
              next: () => {
                if (result.discProfiles) candidate.disc_profiles = result.discProfiles;
                if (result.matchScores) {
                  candidate.match_scores = result.matchScores;
                  candidate.all_match_scores = result.matchScores;
                }
                this.showSnackbar('Candidate sent to talent match successfully!');
                this.loadCandidates();
                this.filterCandidates();
                this.loadStatusCounts();
              },
              error: () => {
                this.showSnackbar('Error sending candidate to talent match.');
              }
            });
          },
          error: () => {
            this.showSnackbar('Error saving DISC profiles or match scores.');
          }
        });
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
    const MAX_FILE_SIZE = 1024 * 1024;
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

      if(file.size > MAX_FILE_SIZE) {
        this.showSnackbar('File size must be less than 1MB.');
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

  markAsAvailable(candidate: any) {
    this.applicationsService.updateAvailability({application_id: candidate.id, availability: true}).subscribe(() => {
      this.showSnackbar('Candidate marked as available');
      this.loadCandidates();
      this.filterCandidates();
      this.loadStatusCounts();
    });
  }

  markAsUnavailable(candidate: any) {
    this.applicationsService.updateAvailability({application_id: candidate.id, availability: false}).subscribe(() => {
      this.showSnackbar('Candidate marked as unavailable');
      this.loadCandidates();
      this.filterCandidates();
      this.loadStatusCounts();
    });
  }

  openRejectDialog(candidate: any): void {
    const dialogRef = this.dialog.open(RejectionDialogComponent, {
      width: '500px',
      data: {
        mode: 'reject',
        candidate: candidate
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) {
        this.showSnackbar('Candidate rejected successfully');
        this.loadCandidates();
        this.filterCandidates();
        this.loadStatusCounts();
      }
    });
  }

  goToCandidate(id: number, event: MouseEvent) {
    event.stopPropagation();
    this.router.navigate(['apps/candidates', id]);
  }

  goToNewCandidate() {
    this.router.navigate(['apps/candidates/new']);
  }
}
