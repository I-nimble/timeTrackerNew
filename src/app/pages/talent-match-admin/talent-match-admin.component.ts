import { Component, OnInit, ViewChild, TemplateRef, AfterViewInit, ChangeDetectorRef } from '@angular/core';
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
import { animate, state, style, transition, trigger } from '@angular/animations';
import { SelectionModel } from '@angular/cdk/collections';
import { ApplicationMatchScoresService, PositionCategory } from 'src/app/services/application-match-scores.service';
import { formatEnglishLevelDisplay, getEnglishLevelPercent } from 'src/app/utils/english-level';
import { FormsModule } from '@angular/forms';
import { MatchComponent } from 'src/app/components/match-search/match.component';
import { AIService } from 'src/app/services/ai.service';
import { CandidateEvaluationResponse, CandidateEvaluationFilters } from 'src/app/models/ai.model';
import { MarkdownPipe, LinebreakPipe } from 'src/app/pipe/markdown.pipe';

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
    FormsModule,
    MatchComponent,
    MarkdownPipe,
    LinebreakPipe,
    DynamicTableComponent,
    FormatNamePipe
  ],
  templateUrl: './talent-match-admin.component.html',
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ])
  ]
})
export class AppTalentMatchAdminComponent implements OnInit, AfterViewInit {
  @ViewChild('selectHeaderTemplate') selectHeaderTemplate!: TemplateRef<any>;
  @ViewChild('selectCellTemplate') selectCellTemplate!: TemplateRef<any>;
  @ViewChild('expandCellTemplate') expandCellTemplate!: TemplateRef<any>;
  @ViewChild('expandedDetailTemplate') expandedDetailTemplate!: TemplateRef<any>;

  tableColumns: DynamicTableColumn<Application>[] = [];
  tableActions: DynamicTableActionItem<Application>[] = [];
  rows: Application[] = [];
  applicationsData: Application[] = [];
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

  selectedRole: string | null = null;
  selectedPracticeArea: string | null = null;
  roleDescription: string = '';
  query: string = '';
  useManualSearch = false;
  aiLoading = false;
  aiAnswer: string = '';
  hasSearchResults = false;
  activeAISearchSessionId = '';
  showCustomFilterInput = false;

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

  expandedElement: any | null = null;
  selection = new SelectionModel<any>(true, []);
  positionCategories: PositionCategory[] = [];

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
    private discProfilesService: DiscProfilesService,
    private matchScoresService: ApplicationMatchScoresService,
    private aiService: AIService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.getPositions();
    this.getPositionCategories();

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

  ngAfterViewInit(): void {
    this.initializeColumns();
    this.cdr.detectChanges();
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

  getPositionCategories() {
    this.matchScoresService.getPositionCategories().subscribe({
      next: (categories) => {
        this.positionCategories = categories;
      },
      error: (err) => {
        console.error('Error loading position categories:', err);
      }
    });
  }

  getApplications() {
    if (this.activeAISearchSessionId) {
      this.fetchAICandidates(true);
      return;
    }

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
        this.selection.clear();
        this.expandedElement = null;
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

  searchCandidatesWithAI(question: string) {
    const searchQuery = String(question || this.query || '').trim();
    if (this.useManualSearch) {
      this.onManualSearch(question);
      return;
    }

    this.currentPage = 1;
    this.sortBy = 'match_percentage';
    this.sortOrder = 'desc';
    this.aiLoading = true;
    this.tableLoading = false;
    this.aiAnswer = '';
    this.hasSearchResults = false;

    this.aiService.evaluateCandidates({
      question: searchQuery,
      filters: this.buildAISearchFilters(),
    }).subscribe({
      next: (response: CandidateEvaluationResponse) => {
        this.applyApplicationListResponse(response);
        this.activeAISearchSessionId = response.sessionId || '';
        this.hasSearchResults = response.meta.total > 0;
        this.aiLoading = false;
        this.tableLoading = false;
        this.aiAnswer = response.meta.total > 0 ? '' : 'No matches.';

        this.saveAISearchState(this.activeAISearchSessionId, this.buildAISearchFilters());
      },
      error: (err) => {
        if (err.status === 429) {
          this.aiAnswer = 'You have reached the limit of 50 AI requests per day. Manual search has been enabled until your limit resets tomorrow. Upgrade your plan to continue using AI-powered search without interruptions.';
          this.useManualSearch = true;
          this.aiLoading = false;
          this.tableLoading = false;
        } else {
          this.aiAnswer = 'Error getting answer from AI, try again later.';
          console.error('AI evaluation error:', err);
        }
        this.aiLoading = false;
        this.tableLoading = false;
      }
    });
  }

  onManualSearch(query?: string) {
    this.clearAISearchState();
    this.resetActiveAISearch();

    const searchQuery = query || this.query;
    this.query = searchQuery;
    const lower = searchQuery.toLowerCase();
    this.setDisplayedCandidates(this.applicationsData.filter(c =>
      c.name?.toLowerCase().includes(lower) ||
      this.getPositionTitle(c.position_id)?.toLowerCase().includes(lower) ||
      c.skills?.toLowerCase().includes(lower) ||
      c.location?.toLowerCase().includes(lower)
    ));
    this.hasSearchResults = this.rows.length > 0;
  }

  handleSortChange(event: DynamicTableSortChange): void {
    this.sortBy = event.sortBy;
    this.sortOrder = event.sortOrder;
    this.currentPage = event.page;
    this.pageSize = event.pageSize;
    if (this.activeAISearchSessionId) {
      this.fetchAICandidates();
    } else {
      this.getApplications();
    }
  }

  handlePageChange(event: DynamicTablePageChange): void {
    this.currentPage = event.page;
    this.pageSize = event.pageSize;
    if (this.activeAISearchSessionId) {
      this.fetchAICandidates();
    } else {
      this.getApplications();
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

  getSeparatedDescription(description: string): { baseText: string, role: string } {
    if (!description) {
      return { baseText: '', role: '' };
    }
    const separatorIndex = description.indexOf(': ');
    if (separatorIndex !== -1) {
      const baseText = description.substring(0, separatorIndex + 1);
      const role = description.substring(separatorIndex + 2);
      return { baseText: baseText.trim(), role: role.trim() };
    } else {
      const colonIndex = description.indexOf(':');
      if (colonIndex !== -1) {
        const baseText = description.substring(0, colonIndex + 1);
        const role = description.substring(colonIndex + 1);
        return { baseText: baseText.trim(), role: role.trim() };
      }
      return { baseText: '', role: '' };
    }
  }

  hasDescription(element: any): boolean {
    return !!element?.description && element.description.trim() !== '';
  }

  formatEnglishLevelDisplay(value: number): string {
    return formatEnglishLevelDisplay(value);
  }

  getEnglishLevelPercent(value: number): number {
    return getEnglishLevelPercent(value);
  }

  handleImageError(event: Event) {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = this.assetsPath;
    imgElement.onerror = null;
  }

  onRowClick(row: any) {
    this.expandedElement = this.expandedElement === row ? null : row;
    this.selection.toggle(row);
  }

  onExpandToggle(row: any, event: MouseEvent): void {
    event.stopPropagation();
    this.expandedElement = this.expandedElement === row ? null : row;
  }

  masterToggleAndSyncSelection() {
    this.masterToggle();
  }

  isAllSelected(): boolean {
    if (!this.rows.length) {
      return false;
    }
    return this.rows.every((row) => this.selection.isSelected(row));
  }

  masterToggle(): void {
    if (!this.rows.length) {
      return;
    }
    if (this.isAllSelected()) {
      this.rows.forEach((row) => this.selection.deselect(row));
    } else {
      this.rows.forEach((row) => this.selection.select(row));
    }
  }

  checkboxLabel(row?: any): string {
    if (!row) {
      return `${this.isAllSelected() ? 'select' : 'deselect'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.position + 1}`;
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
      if (result === 'success') this.getApplications();
    });
  }

  openEditCandidateDialog(candidate: any): void {
    const dialogRef = this.dialog.open(AddCandidateDialogComponent, {
      width: '600px',
      data: { candidate, companies: this.companiesData, action: 'edit' }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'success') this.getApplications();
    });
  }

  async openCandidateResume(resumeUrl: string | null | undefined, applicationId?: number) {
    if (!resumeUrl) {
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
      data: { action: 'Delete', subject: 'candidate' }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.applicationService.delete(id).subscribe({
          next: () => this.getApplications(),
          error: () => this.openSnackBar('Error deleting candidate', 'Close')
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
      default: break;
    }
  }

  openSnackBar(message: string, action: string) {
    this.snackBar.open(message, action, { duration: 3000, horizontalPosition: 'center', verticalPosition: 'top' });
  }

  goToCustomSearch() {
    this.router.navigate(['apps/talent-match/custom-search']);
  }

  get canSearchAI(): boolean {
    const hasRequiredFilters = !!this.selectedRole && !!this.selectedPracticeArea;
    if (!!this.query) return true;
    return hasRequiredFilters;
  }

  private buildAISearchFilters(): CandidateEvaluationFilters {
    return {
      selectedRole: this.selectedRole,
      selectedPracticeArea: this.selectedPracticeArea,
      roleDescription: this.roleDescription,
      query: this.query,
    };
  }

  private applyApplicationListResponse(response: ApplicationListResponse): void {
    this.rows = response.items;
    this.totalPages = response.meta.totalPages;
    this.currentPage = response.meta.currentPage;
    this.pageSize = response.meta.limit;
    this.sortBy = response.meta.sortBy;
    this.sortOrder = response.meta.sortOrder.toLowerCase() as 'asc' | 'desc';
    this.backendMessage = response.message || '';
    this.expandedElement = null;
    this.selection.clear();
  }

  private fetchAICandidates(restoreFallback = false): void {
    if (!this.activeAISearchSessionId) {
      this.getApplications();
      return;
    }

    this.tableLoading = true;
    this.aiService.getCandidateEvaluationResults(this.activeAISearchSessionId, {
      page: this.currentPage,
      offset: this.pageSize,
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

  private setDisplayedCandidates(candidates: any[]): void {
    this.rows = candidates;
    this.currentPage = 1;
    this.expandedElement = null;
    this.selection.clear();
  }

  private saveAISearchState(sessionId: string, filters: CandidateEvaluationFilters) {
    localStorage.setItem('aiFilters', JSON.stringify(filters));
    if (sessionId) {
      localStorage.setItem('aiSearchSessionId', sessionId);
    } else {
      localStorage.removeItem('aiSearchSessionId');
    }
  }

  private clearAISearchState() {
    localStorage.removeItem('aiFilters');
    localStorage.removeItem('aiSearchSessionId');
  }

  private initializeColumns(): void {
    this.tableActions = [
      { id: 'view', label: 'View', icon: 'visibility' },
      { id: 'edit', label: 'Edit', icon: 'edit', visible: () => this.canEdit },
      { id: 'delete', label: 'Delete', icon: 'delete', visible: () => this.canDelete },
    ];

    this.tableColumns = [
      {
        id: 'select',
        header: '',
        headerTemplate: this.selectHeaderTemplate,
        cellTemplate: this.selectCellTemplate,
      },
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
        id: 'expand',
        header: '',
        cellTemplate: this.expandCellTemplate,
      },
      {
        id: 'actions',
        header: 'Actions',
        renderer: { type: 'actions', items: this.tableActions },
      },
    ];
  }
}