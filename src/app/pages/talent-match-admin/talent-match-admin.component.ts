import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
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
import { PermissionService } from 'src/app/services/permission.service';
import { Router } from '@angular/router';
import { DiscProfilesService } from 'src/app/services/disc-profiles.service';
import { getTrainingNames } from 'src/app/utils/candidate.utils';
import { FormatNamePipe } from 'src/app/pipe/format-name.pipe';
import { DynamicTableComponent } from 'src/app/shared/components/dynamic-table/dynamic-table.component';
import {
  Application,
  ApplicationListResponse,
} from 'src/app/models/application.model';
import {
  DynamicTableActionItem,
  DynamicTableColumn,
  DynamicTablePageChange,
  DynamicTableRowActionEvent,
  DynamicTableSortChange,
} from 'src/app/shared/models/dynamic-table.model';

@Component({
  standalone: true,
  selector: 'app-talent-match-admin',
  styleUrls: ['./talent-match-admin.component.scss'],
  imports: [
    MatCardModule,
    CommonModule,
    MatDividerModule,
    MaterialModule,
    TablerIconsModule,
    DynamicTableComponent,
  ],
  templateUrl: './talent-match-admin.component.html',
})
export class AppTalentMatchAdminComponent implements OnInit {
  tableColumns: DynamicTableColumn<Application>[] = [];
  tableActions: DynamicTableActionItem<Application>[] = [];
  rows: Application[] = [];
  applicationsData: Application[] = [];
  interviews: any[] = [];
  picturesUrl: string = 'https://inimble-app.s3.us-east-1.amazonaws.com/photos';
  resumesUrl: string = 'https://inimble-app.s3.us-east-1.amazonaws.com/resumes';
  assetsPath: string = environment.assets + '/default-user-profile-pic.webp';
  companiesData: any[] = [];
  positions: any[] = [];
  userRole = localStorage.getItem('role');
  canManage: boolean = false;
  canEdit: boolean = false;
  canDelete: boolean = false;
  searchTerm = '';
  currentPage = 1;
  totalPages = 1;
  pageSize = 10;
  sortBy = 'name';
  sortOrder: 'asc' | 'desc' = 'asc';
  backendMessage = '';
  tableLoading = false;
  private readonly formatNamePipe = new FormatNamePipe();
  
  constructor(
    private applicationService: ApplicationsService,
    private interviewsService: InterviewsService,
    private companiesService: CompaniesService,
    private positionsService: PositionsService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private permissionService: PermissionService,
    private router: Router,
    private discProfilesService: DiscProfilesService
  ) { }
  
  ngOnInit(): void {
    this.initializeColumns();
    this.getPositions();
    this.getInterviews();

    const userId = Number(localStorage.getItem('id'));
    this.permissionService.getUserPermissions(userId).subscribe({
      next: (userPerms: any) => {
        const effective = userPerms.effectivePermissions || [];
        this.canManage = effective.includes('talent-match.manage');
        this.canEdit = effective.includes('talent-match.edit');
        this.canDelete = effective.includes('talent-match.delete');
        this.getApplications();
      },
      error: (err) => {
        console.error('Error fetching user permissions', err);
        this.canManage = false;
        this.getApplications();
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

  getApplications() {
    this.tableLoading = true;

    this.applicationService.get({
      onlyTalentPool: true,
      page: this.currentPage,
      offset: this.pageSize,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder,
      search: this.searchTerm,
    }).subscribe({
      next: (response: ApplicationListResponse) => {
        this.applicationsData = response.items;
        this.rows = response.items;
        this.totalPages = response.meta.totalPages;
        this.currentPage = response.meta.currentPage;
        this.pageSize = response.meta.limit;
        this.sortBy = response.meta.sortBy;
        this.sortOrder = response.meta.sortOrder.toLowerCase() as 'asc' | 'desc';
        this.backendMessage = response.message || '';
        this.tableLoading = false;
      },
      error: (err) => {
        console.error('Error fetching applications:', err);
        this.rows = [];
        this.tableLoading = false;
      }
    });
    this.companiesService.getCompanies().subscribe({
      next: companies => {
        this.companiesData = companies;
      },
    });
  }
  
  applyFilter(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value.trim();
    this.currentPage = 1;
    this.getApplications();
  }

  handleSortChange(event: DynamicTableSortChange): void {
    this.sortBy = event.sortBy;
    this.sortOrder = event.sortOrder;
    this.currentPage = event.page;
    this.pageSize = event.pageSize;
    this.getApplications();
  }

  handlePageChange(event: DynamicTablePageChange): void {
    this.currentPage = event.page;
    this.pageSize = event.pageSize;
    this.getApplications();
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

  getPositionById(positionId: any): any {
    return this.positions.find((p: any) => p.id == positionId);
  }

  getDiscProfileColor(profileName: string): string {
    return this.discProfilesService.getDiscProfileColor(profileName);
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
        companies: this.companiesData,
        action: 'edit'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'success') {
        this.getApplications();
      }
    });
  }

  async openCandidateResume(resumeUrl: string | null | undefined, applicationId?: number) {
    if(!resumeUrl) {
      this.openSnackBar('No resume found for this candidate', 'Close');
      return;
    }
    const url = await this.applicationService.getResumeUrl(resumeUrl, applicationId);
    if (!url) {
      this.openSnackBar('No resume found for this candidate', 'Close');
      return;
    }
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

  getTrainingNames(certifications: Application['certifications']): string {
    return getTrainingNames(certifications);
  }

  goToCandidate(id: number) {
    this.router.navigate([`apps/talent-match/${id}`]);
  }

  handleRowAction(event: DynamicTableRowActionEvent<Application>): void {
    switch (event.action.id) {
      case 'view':
        this.openCandidateResume(event.row.resume_url, event.row.id);
        break;
      case 'edit':
        this.goToCandidate(event.row.id);
        break;
      case 'delete':
        this.deleteCandidate(event.row.id);
        break;
      default:
        break;
    }
  }

  openSnackBar(message: string, action: string) {
    this.snackBar.open(message, action, {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }

  private initializeColumns(): void {
    this.tableActions = [
      {
        id: 'view',
        label: 'View',
        icon: 'visibility',
      },
      {
        id: 'edit',
        label: 'Edit',
        icon: 'edit',
        visible: () => this.canEdit,
      },
      {
        id: 'delete',
        label: 'Delete',
        icon: 'delete',
        visible: () => this.canDelete,
      },
    ];

    this.tableColumns = [
      {
        id: 'name',
        header: 'Name',
        sortable: true,
        sortKey: 'name',
        accessor: 'name',
        renderer: {
          type: 'avatar-name',
          imageAccessor: (row) => row.profile_pic_url || this.assetsPath,
          imageFallback: this.assetsPath,
          titleAccessor: 'name',
          subtitleAccessor: 'current_position',
          titleTransform: (value) => this.formatNamePipe.transform(value),
          badges: {
            accessor: (row) => row.disc_profiles || [],
            labelAccessor: (profile) => profile?.name || '',
            colorAccessor: (profile) => this.getDiscProfileColor(profile?.name || ''),
          },
        },
      },
      {
        id: 'personalityProfile',
        header: 'Personality profile',
        sortable: true,
        sortKey: 'match_percentage',
        accessor: 'match_percentage',
        renderer: {
          type: 'metric',
          primaryAccessor: (row) => row.match_percentage || '0',
          primarySuffix: '%',
          secondaryAccessor: 'position_category',
        },
      },
      {
        id: 'position',
        header: 'Position',
        sortable: true,
        sortKey: 'position',
        accessor: 'current_position',
        renderer: {
          type: 'text-badges',
          textAccessor: (row) => this.getPositionTitle(row.position_id),
          badges: {
            accessor: (row) => this.getPositionById(row.position_id)?.disc_profiles || [],
            labelAccessor: (profile) => profile?.name || '',
            colorAccessor: (profile) => this.getDiscProfileColor(profile?.name || ''),
          },
        },
      },
      {
        id: 'experience',
        header: 'Experience',
        sortable: true,
        sortKey: 'experience',
        accessor: (row: any) => row.work_experience_summary || row.work_experience,
        renderer: {
          type: 'truncated-text',
          textAccessor: 'work_experience_summary',
          fallbackAccessor: 'work_experience',
          maxLength: 50,
        },
      },
      {
        id: 'trainings',
        header: 'Trainings',
        sortable: true,
        sortKey: 'trainings',
        accessor: (row: any) => this.getTrainingNames(row.certifications),
      },
      {
        id: 'status',
        header: 'Status',
        sortable: true,
        sortKey: 'status',
        accessor: 'status',
        renderer: {
          type: 'status-pill',
          valueAccessor: 'status',
          palettes: {
            pending: { backgroundColor: 'var(--mat-sys-error)' },
            'talent match': { backgroundColor: 'rgb(253, 253, 150)', color: 'black' },
            hired: { backgroundColor: 'var(--mat-sys-primary)' },
            reviewing: { backgroundColor: 'rgb(255, 174, 105)' },
          },
          defaultPalette: { backgroundColor: 'rgb(72, 72, 72)' },
        },
      },
      {
        id: 'interviewingOn',
        header: 'Interviewing on',
        accessor: (row: any) => this.getInterviewDateTime(row.id) || 'No scheduled',
        renderer: {
          type: 'date',
          valueAccessor: (row) => this.getInterviewDateTime(row.id),
          format: 'short',
          fallbackText: 'No scheduled',
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        renderer: {
          type: 'actions',
          items: this.tableActions,
        },
      },
    ];
  }

}
