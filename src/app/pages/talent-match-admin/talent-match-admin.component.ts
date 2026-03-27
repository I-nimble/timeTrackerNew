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
import { MatSnackBar } from '@angular/material/snack-bar';
import { ModalComponent } from 'src/app/components/confirmation-modal/modal.component';
import { PermissionService } from 'src/app/services/permission.service';
import { Router } from '@angular/router';
import { DiscProfilesService } from 'src/app/services/disc-profiles.service';
import { FormatNamePipe } from 'src/app/pipe/format-name.pipe';
import { getTrainingNames } from 'src/app/utils/candidate.utils';
import { ApplicationListResponse } from 'src/app/models/application.model';
import { AIService } from 'src/app/services/ai.service';
import { CandidateEvaluationFilters, CandidateEvaluationResponse } from 'src/app/models/ai.model';
import { formatEnglishLevelDisplay, getEnglishLevelPercent } from 'src/app/utils/english-level';
import { LinebreakPipe, MarkdownPipe } from 'src/app/pipe/markdown.pipe';
import { MatchComponent } from 'src/app/components/match-search/match.component';
import { TourMatMenuModule } from 'ngx-ui-tour-md-menu';
import { FormsModule } from '@angular/forms';

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
  styleUrls: ['./talent-match-admin.component.scss'],
  imports: [
    MatCardModule,
    CommonModule,
    MatCheckboxModule,
    MatDividerModule,
    MaterialModule,
    TablerIconsModule,
    FormsModule,
    MatchComponent,
    MarkdownPipe,
    LinebreakPipe,
    FormatNamePipe,
    TourMatMenuModule,
  ],
  templateUrl: './talent-match-admin.component.html',
})
export class AppTalentMatchAdminComponent implements OnInit {
  dataSource = new MatTableDataSource<any>([]);
  selection = new SelectionModel<any>(true, []);
  applicationsData: any[] = [];
  interviews: any[] = [];
  picturesUrl: string = 'https://inimble-app.s3.us-east-1.amazonaws.com/photos';
  resumesUrl: string = 'https://inimble-app.s3.us-east-1.amazonaws.com/resumes';
  assetsPath: string = environment.assets + '/default-user-profile-pic.webp';
  rows: any[] = [];
  paginatedRows: any[] = [];
  companiesData: any[] = [];
  positions: any[] = [];
  userRole = localStorage.getItem('role');
  canManage: boolean = false;
  canEdit: boolean = false;
  canDelete: boolean = false;
  query: string = '';
  selectedRole: string | null = null;
  selectedPracticeArea: string | null = null;
  roleDescription: string = '';
  pageSize = 10;
  currentPage = 1;
  totalPages = 1;
  backendMessage = '';
  tableLoading = false;
  searchTerm = '';
  sortBy = 'match_percentage';
  sortOrder: 'asc' | 'desc' = 'desc';
  activeAISearchSessionId = '';
  private hasRestoredStoredSearch = false;
  aiAnswer: string = '';
  hasSearchResults = false;
  allCandidates: any[] = [];
  useManualSearch = false;
  expandedElement: any | null = null;
  aiLoading = false;
  showCustomFilterInput: boolean = false;

  practiceAreas: string[] = [
    'Personal Injury',
    'Immigration Law',
    'Family Law',
    'Criminal Defense',
    'Real Estate Law',
    'Civil Litigation',
    'Employment Law',
    'Estate Planning',
    'Bankruptcy Law',
    'Corporate / Business Law',
    'General Practice'
  ];

  displayedColumns: string[] = [
    'select',
    'name',
    'personality profile',
    'position',
    'experience',    
    'trainings',
    'actions',
  ];
  columnsToDisplayWithExpand = [...this.displayedColumns, 'expand'];
  activeSortBy: string = '';
  activeSortOrder: 'asc' | 'desc' = 'asc';

  formatEnglishLevelDisplay(value: number): string {
      return formatEnglishLevelDisplay(value);
    }
  
  getEnglishLevelPercent(value: number): number {
    return getEnglishLevelPercent(value);
  }
  
  constructor(
    private applicationsService: ApplicationsService,
    private interviewsService: InterviewsService,
    private companiesService: CompaniesService,
    private positionsService: PositionsService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private permissionService: PermissionService,
    private router: Router,
    private discProfilesService: DiscProfilesService,
    private aiService: AIService
  ) { }
  
  
  ngOnInit(): void {
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

    if (!this.hasRestoredStoredSearch) {
      const stored = this.loadAISearchState();
      if (stored?.filters) {
        if (stored.filters.selectedRole !== undefined) this.selectedRole = stored.filters.selectedRole;
        if (stored.filters.selectedPracticeArea !== undefined) this.selectedPracticeArea = stored.filters.selectedPracticeArea;
        if (stored.filters.roleDescription !== undefined) this.roleDescription = stored.filters.roleDescription;
        if (stored.filters.query !== undefined) this.query = stored.filters.query;
      }
      if (stored?.sessionId) this.activeAISearchSessionId = stored.sessionId;
      this.hasRestoredStoredSearch = true;
    }

    if (this.activeAISearchSessionId) {
      this.fetchAICandidates(true);
      return;
    }

    this.applicationsService.get({
      page: 1,
      offset: 1000,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder,
      search: '',
    }).subscribe({
      next: (response: ApplicationListResponse) => {
        this.resetActiveAISearch();
        this.allCandidates = response.items;
        this.applyApplicationListResponse(response);
        this.hasSearchResults = false;
        this.aiAnswer = '';
        this.tableLoading = false;
      },
      error: (err: any) => {
        console.error('Error fetching applications:', err);
        this.tableLoading = false;
      },
    });
  }

  private fetchAICandidates(restoreFallback = false): void {
    if (!this.activeAISearchSessionId) {
      this.getApplications();
      return;
    }

    this.tableLoading = true;
    this.aiService.getCandidateEvaluationResults(this.activeAISearchSessionId, {
      page: 1,
      offset: 1000,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder,
    }).subscribe({
      next: (response: CandidateEvaluationResponse) => {
        this.applyApplicationListResponse(response);
        this.activeAISearchSessionId = response.sessionId || this.activeAISearchSessionId;
        this.hasSearchResults = response.meta.total > 0;
        this.tableLoading = false;
        this.aiAnswer = response.meta.total > 0 ? '' : 'No matches.';
      },
      error: (err) => {
        console.error('AI evaluation error:', err);
        this.tableLoading = false;
        if (restoreFallback && err.status === 404) {
          localStorage.removeItem('aiSearchSessionId');
          this.resetActiveAISearch();
          this.getApplications();
        }
      },
    });
  }
  
  private resetActiveAISearch(): void {
    this.activeAISearchSessionId = '';
  }

  private isAISearchActive(): boolean {
    return this.activeAISearchSessionId.length > 0;
  }

  private applyApplicationListResponse(response: ApplicationListResponse): void {
    this.dataSource.data = response.items;
    this.rows = response.items;
    this.totalPages = response.meta.totalPages;
    this.currentPage = response.meta.currentPage;
    this.pageSize = response.meta.limit;
    this.sortBy = response.meta.sortBy;
    this.sortOrder = response.meta.sortOrder.toLowerCase() as 'asc' | 'desc';
    this.backendMessage = response.message || '';
    this.expandedElement = null;
  }
  
  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
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

  getPositionById(positionId: any): any {
    return this.positions.find((p: any) => p.id == positionId);
  }

  getDiscProfileColor(profileName: string): string {
    return this.discProfilesService.getDiscProfileColor(profileName);
  }

  async openCandidateResume(resumeUrl: string, applicationId?: number) {
    if(!resumeUrl) {
      this.openSnackBar('No resume found for this candidate', 'Close');
      return;
    }
    const url = await this.applicationsService.getResumeUrl(resumeUrl, applicationId);
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
        this.applicationsService.delete(id).subscribe({
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

  getTrainingNames(certifications: any[] | undefined): string {
    return getTrainingNames(certifications);
  }

  goToCandidate(id: number, event: MouseEvent) {
    event.stopPropagation();
    this.router.navigate([`apps/talent-match/${id}`]);
  }

  openSnackBar(message: string, action: string) {
    this.snackBar.open(message, action, {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }

  onRowClick(row: any, event?: MouseEvent) {
    const target = event?.target as HTMLElement | null;
    if (target?.closest('button, a, mat-checkbox, [mat-menu-item], .mat-mdc-menu-trigger')) {
      return;
    }

    this.expandedElement = this.expandedElement === row ? null : row;
    this.selection.toggle(row);
    this.onRowSelectionChange();
  }

  onRowSelectionChange() {
    this.applicationsService.clearSelectedApplicants();
    this.applicationsService.setSelectedApplicants(this.selection.selected);
  }

  hasDescription(element: any): boolean {
    return !!element?.description && element.description.trim() !== '';
  }

  getSeparatedDescription(description: string): { baseText: string, role: string } {
    if (!description) {
      return { baseText: '', role: '' };
    }
    
    const separatorIndex = description.indexOf(': ');
    
    if (separatorIndex !== -1) {
      const baseText = description.substring(0, separatorIndex + 1);
      const role = description.substring(separatorIndex + 2);
      
      return {
        baseText: baseText.trim(),
        role: role.trim()
      };
    } else {
      const colonIndex = description.indexOf(':');
      if (colonIndex !== -1) {
        const baseText = description.substring(0, colonIndex + 1);
        const role = description.substring(colonIndex + 1);
        
        return {
          baseText: baseText.trim(),
          role: role.trim()
        };
      }
      
      return {
        baseText: '',
        role: ''
      };
    }
  }

  getRankingArrowPosition(rankingId: number | string | null | undefined): number {
    const level = this.getRankingVisualLevel(rankingId);
    return ((level - 0.5) / 4) * 100;
  }

  private getRankingVisualLevel(rankingId: number | string | null | undefined): number {
    const id = Number(rankingId);
    if (!id || Number.isNaN(id)) {
      return 0;
    }
    return Math.min(4, Math.max(1, 5 - id));
  }

  checkboxLabel(row?: any): string {
    if (!row) {
      return `${this.isAllSelected() ? 'select' : 'deselect'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${
      row.position + 1
    }`;
  }

  isAllSelected(): boolean {
    if (!this.rows.length) {
      return false;
    }
    return this.rows.every((row) => this.selection.isSelected(row));
  }

  masterToggleAndSyncSelection() {
    this.masterToggle();
    this.onRowSelectionChange();
  }

  masterToggle(): void {
    if (!this.rows.length) {
      return;
    }

    if (this.isAllSelected()) {
      this.rows.forEach((row) => this.selection.deselect(row));
      return;
    }

    this.rows.forEach((row) => this.selection.select(row));
  }

  onManualSearch(query?: string) {
    this.clearAISearchState();
    this.resetActiveAISearch();

    const searchQuery = query || this.query;
    this.query = searchQuery;
    const lower = searchQuery.toLowerCase();
    this.setDisplayedCandidates(this.allCandidates.filter(c =>
      c.name?.toLowerCase().includes(lower) ||
      this.getPositionTitle(c.position_id)?.toLowerCase().includes(lower) ||
      c.skills?.toLowerCase().includes(lower) ||
      c.location?.toLowerCase().includes(lower)
    ));
    this.hasSearchResults = this.dataSource.data.length > 0;
  }

  private buildAISearchFilters(): CandidateEvaluationFilters {
    return {
      selectedRole: this.selectedRole,
      selectedPracticeArea: this.selectedPracticeArea,
      roleDescription: this.roleDescription,
      query: this.query,
    };
  }

  private saveAISearchState(
    sessionId: string,
    filters: CandidateEvaluationFilters,
  ) {
    localStorage.setItem('aiFilters', JSON.stringify(filters));
    if (sessionId) {
      localStorage.setItem('aiSearchSessionId', sessionId);
    } else {
      localStorage.removeItem('aiSearchSessionId');
    }
  }

  private loadAISearchState(): {
    filters: CandidateEvaluationFilters;
    sessionId: string | null;
  } | null {
    const filtersStr = localStorage.getItem('aiFilters');
    const sessionId = localStorage.getItem('aiSearchSessionId');
    if (!filtersStr) return null;
    try {
      const filters = JSON.parse(filtersStr);
      return { filters, sessionId };
    } catch {
      return null;
    }
  }

  private clearAISearchState() {
    localStorage.removeItem('aiFilters');
    localStorage.removeItem('aiSearchSessionId');
  }

  private setDisplayedCandidates(candidates: any[]): void {
    this.dataSource.data = candidates;
    this.rows = candidates;
    this.currentPage = 1;
    this.expandedElement = null;
    this.updateVisibleRows();
  }

  private updateVisibleRows(): void {
    const totalRows = this.dataSource.data.length;
    this.totalPages = Math.max(1, Math.ceil(totalRows / this.pageSize));
    this.currentPage = Math.min(this.currentPage, this.totalPages);

    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedRows = [...this.dataSource.data.slice(startIndex, endIndex)];
    this.rows = [...this.paginatedRows];
  }

  goToCustomSearch() {
    this.router.navigate([`apps/talent-match/custom-search`]);
  }

  get canSearchAI(): boolean {
    const hasRequiredFilters =
      !!this.selectedRole &&
      !!this.selectedPracticeArea;
    if (!!this.query) return true;
    return hasRequiredFilters;
  }
}