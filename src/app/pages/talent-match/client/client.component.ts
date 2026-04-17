import { AfterViewInit, ChangeDetectorRef, Component, OnInit, ViewChild, Inject, TemplateRef } from '@angular/core';
import { SelectionModel } from '@angular/cdk/collections';
import { MatTableDataSource } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { ApplicationsService } from 'src/app/services/applications.service';
import { PositionsService } from 'src/app/services/positions.service';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, NgModel } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CompaniesService } from 'src/app/services/companies.service';
import { UsersService } from 'src/app/services/users.service';
import moment from 'moment';
import { ModalComponent } from 'src/app/components/confirmation-modal/modal.component';
import { MatchComponent } from 'src/app/components/match-search/match.component';
import { AIService } from 'src/app/services/ai.service';
import { CandidateEvaluationResponse, CandidateEvaluationFilters } from 'src/app/models/ai.model';
import { MarkdownPipe, LinebreakPipe } from 'src/app/pipe/markdown.pipe';
import { Router } from '@angular/router';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { ApplicationMatchScoresService, PositionCategory } from 'src/app/services/application-match-scores.service';
import { FormatNamePipe } from 'src/app/pipe/format-name.pipe';
import { DiscProfilesService } from 'src/app/services/disc-profiles.service';
import { TourMatMenuModule } from 'ngx-ui-tour-md-menu';
import { formatEnglishLevelDisplay, getEnglishLevelPercent } from 'src/app/utils/english-level';
import { getTrainingNames } from 'src/app/utils/candidate.utils';
import { ApplicationListResponse } from 'src/app/models/application.model';
import { NotificationsService } from 'src/app/services/notifications.service';
import { PageEvent } from '@angular/material/paginator';
import { of, forkJoin } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { TalentMatchIntakeComponent, IntakeInitialValues } from 'src/app/components/talent-match-intake/talent-match-intake.component';

@Component({
  standalone: true,
  selector: 'app-talent-match-client',
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
    TalentMatchIntakeComponent,
  ],
  templateUrl: './client.component.html',
  styleUrls: ['./client.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ])
  ]
})
export class AppTalentMatchClientComponent implements OnInit, AfterViewInit {
  userRole = localStorage.getItem('role');
  resumesUrl: string = 'https://inimble-app.s3.us-east-1.amazonaws.com/resumes';
  positions: any[] = [];
  searchText: string = '';
  rows: any[] = [];
  dataSource = new MatTableDataSource<any>([]);
  paginatedRows: any[] = [];
  selection = new SelectionModel<any>(true, []);
  companyId: number | null = null;
  assetsPath: string = 'assets/images/default-user-profile-pic.png';
  aiLoading = false;
  tableLoading = false;
  aiAnswer: string = '';
  hasSearchResults = false;
  allCandidates: any[] = [];
  useManualSearch = false;
  expandedElement: any | null = null;
  matchStats: { [applicationId: number]: { icon: string; value: number; label: string }[] } = {};
  positionCategories: PositionCategory[] = [];
  expandedWorkExp: { [key: number]: boolean } = {};
  selectedPositionFilters: any[] = [];
  customPositionFilter: string = '';
  showCustomFilterInput: boolean = false;
  filterPositions: any[] = [];
  query: string = '';
  selectedRole: string | null = null;
  selectedPracticeArea: string | null = null;
  roleDescription: string = '';
  pageSize = 10;
  currentPage = 1;
  totalPages = 1;
  totalRecords = 0;
  backendMessage = '';
  searchTerm = '';
  sortBy = 'match_percentage';
  sortOrder: 'asc' | 'desc' = 'desc';
  activeAISearchSessionId = '';
  private hasRestoredStoredSearch = false;

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

  @ViewChild('selectHeaderTemplate')
  selectHeaderTemplate!: TemplateRef<any>;
  @ViewChild('selectCellTemplate')
  selectCellTemplate!: TemplateRef<any>;
  @ViewChild('expandCellTemplate')
  expandCellTemplate!: TemplateRef<any>;
  @ViewChild('actionsCellTemplate')
  actionsCellTemplate!: TemplateRef<any>;
  @ViewChild('expandedDetailTemplate')
  expandedDetailTemplate!: TemplateRef<any>;

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

  intakeForm?: FormGroup;
  intakeInitialValues: IntakeInitialValues = {};
  intakeValuesReady = false;
  sessionInterestedCandidates: any[] = [];
  isSubmittingTalentMatch = false;

  onIntakeFormReady(form: FormGroup) {
    this.intakeForm = form;
  }

  constructor(
    private applicationsService: ApplicationsService,
    private positionsService: PositionsService,
    public dialog: MatDialog,
    private companiesService: CompaniesService,
    private usersService: UsersService,
    private aiService: AIService,
    private router: Router,
    private matchScoresService: ApplicationMatchScoresService,
    private discProfilesService: DiscProfilesService,
    private cdr: ChangeDetectorRef,
    private notificationsService: NotificationsService,
    public snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.applicationsService.loadApplicationStatuses().subscribe();
    this.getApplications();
    this.getPositions();
    this.getCompany();
    this.getPositionCategories();
  }

  ngAfterViewInit(): void {
    this.cdr.detectChanges();
  }

  searchCandidatesWithAI(question: string) {
    const searchQuery = String(question || this.query || '').trim();
    if (this.useManualSearch) {
      this.onManualSearch(question);
      return;
    }

    this.currentPage = 1;
    this.sortBy = 'match_percentage';
    this.sortOrder = 'asc';
    this.aiLoading = true;
    this.tableLoading = false;
    this.aiAnswer = '';
    this.hasSearchResults = false;

    this.aiService.evaluateCandidates({
      question: searchQuery,
      filters: this.buildAISearchFilters(),
      ...(this.intakeForm?.valid ? { intakeInfo: this.intakeForm.value } : {}),
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
          if (err.error?.type === 'AI_QUOTA_EXCEEDED'){
            this.useManualSearch = true;
            this.aiAnswer = 'Error getting answer from AI, try again later.';
            this.onManualSearch(question);
          } else {
            this.aiAnswer = 'You have reached the limit of 50 AI requests per day. Manual search has been enabled until your limit resets tomorrow. Upgrade your plan to continue using AI-powered search without interruptions.';
            this.useManualSearch = true;
            this.onManualSearch(this.query);
            this.clearAISearchState();
            this.resetActiveAISearch();
          }
          this.aiLoading = false;
          this.tableLoading = false;
        } else {
          this.aiAnswer = 'Error getting answer from AI, try again later. You are getting manual search results this time.';
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
    const searchQuery = (query || this.query || '').trim();
    this.query = searchQuery;
    const additionalSearchText = this.buildApplicationsSearchTerm();
    this.tableLoading = true;
    this.applicationsService.get({
      page: 1,
      offset: 1000,
      sortBy: this.sortBy || 'submission_date',
      sortOrder: this.sortOrder || 'desc',
      search: additionalSearchText,
    }).subscribe({
      next: (response: ApplicationListResponse) => {
        this.allCandidates = response.items;
        this.applyApplicationListResponse(response);
        this.hasSearchResults = response.items.length > 0;
        this.tableLoading = false;
      },
      error: (err) => {
        console.error('Manual search error:', err);
        this.tableLoading = false;
      }
    });
  }

  getCompany() {
    forkJoin({
      company: this.companiesService.getByOwner(),
      users: this.usersService.getUsers({ searchField: '', filter: { currentUser: true } }),
    }).subscribe(({ company, users }: any) => {
      this.companyId = company.company.id;
      const currentUser = users?.[0];
      this.intakeInitialValues = {
        name: currentUser ? `${currentUser.name} ${currentUser.last_name}`.trim() : '',
        email: currentUser?.email ?? '',
        phone: currentUser?.phone ?? '',
        company: company.company.name ?? '',
      };
      this.intakeValuesReady = true;
    });
  }

  deleteApplication(applicationId: number) {
    const dialog = this.dialog.open(ModalComponent, {
      data: { subject: 'application', action: 'delete' },
    });
    dialog.afterClosed().subscribe((option: boolean) => {
      if (option) {
        this.applicationsService.delete(applicationId).subscribe({
          next: (response: any) => {
            if (this.isAISearchActive()) {
              this.fetchAICandidates();
              return;
            }
            this.getApplications();
          },
          error: (err: any) => {
            console.error('Error deleting application:', err);
          },
        });
      }
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

    if (this.isAISearchActive()) {
      this.fetchAICandidates(true);
      return;
    }

    this.applicationsService.getStatusIdsByNames(['talent match']).pipe(
      switchMap((statusIds) => {
        if (statusIds.length === 0) {
          return of(this.applicationsService.buildEmptyListResponse({
            page: this.currentPage,
            offset: this.pageSize,
            sortBy: this.sortBy,
            sortOrder: this.sortOrder,
          }));
        }

        return this.applicationsService.get({
          page: this.currentPage,
          offset: this.pageSize,
          sortBy: this.sortBy,
          sortOrder: this.sortOrder,
          statusIds,
          search: '',
        });
      }),
    ).subscribe({
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

  getTrainingNames(certifications: any[] | undefined): string {
    return getTrainingNames(certifications);
  }

  togglePositionFilter(position: string): void {
    const index = this.selectedPositionFilters.indexOf(position);
    if (index > -1) {
      this.selectedPositionFilters.splice(index, 1);
    } else {
      this.selectedPositionFilters.push(position);
    }
    this.showCustomFilterInput = false;
    this.customPositionFilter = '';
    
    this.updateSearchQueryFromFilters();
  }

  toggleOtherFilter(): void {
    if (this.selectedPositionFilters.includes('other')) {
      const index = this.selectedPositionFilters.indexOf('other');
      this.selectedPositionFilters.splice(index, 1);
      this.showCustomFilterInput = false;
      this.customPositionFilter = '';
    } else {
      this.selectedPositionFilters.push('other');
      this.showCustomFilterInput = true;
      this.customPositionFilter = '';
    }
    this.updateSearchQueryFromFilters();
  }

  executeFilterSearch(): void {
    if (!this.query.trim()) {
      this.setDisplayedCandidates([...this.allCandidates]);
      this.hasSearchResults = false;
      return;
    }
    if (this.useManualSearch) {
      this.onManualSearch(this.query);
    } else {
      this.searchCandidatesWithAI(this.query);
    }
  }

  updateSearchQueryFromFilters(): void {
    if (this.selectedPositionFilters.length === 0) {
      this.query = '';
      return;
    }

    let searchText = '';
    
    if (this.selectedPositionFilters.includes('other') && this.customPositionFilter) {
      searchText = this.customPositionFilter;
    } else {
      const positions = this.selectedPositionFilters.filter(filter => filter !== 'other');
      searchText = positions.join(', ');
    }

    this.query = searchText;
  }

  onCustomFilterChange(): void {
    this.updateSearchQueryFromFilters();
  }


  applyPositionFilter(): void {
    if (this.selectedPositionFilters.length === 0) {
      this.setDisplayedCandidates([...this.allCandidates]);
      this.hasSearchResults = false;
      return;
    }

    if (this.query.trim()) {
      this.searchCandidatesWithAI(this.query);
    }
  }

  isPositionSelected(position: string): boolean {
    return this.selectedPositionFilters.includes(position);
  }


  getPositions() {
    this.positionsService.get().subscribe({
      next: (positions: any) => {
        this.positions = positions;
        this.filterPositions = [...new Set(positions.map((p: any) => p.title))];
      },
      error: (err: any) => {
        console.error('Error fetching positions:', err);
      },
    });
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

  getAllMatchScores() {
    this.allCandidates.forEach(candidate => {
      this.getMatchScores(candidate.id);
    });
  }

  getMatchScores(applicationId: number) {
    this.matchScoresService.getByApplicationId(applicationId).subscribe({
      next: (scores) => {
        this.matchStats[applicationId] = scores.map(score => {
          const category = this.positionCategories.find(cat => cat.id === score.position_category_id);
          return {
            icon: this.getIconForCategory(category?.category_name || 'Unknown'),
            value: score.match_percentage,
            label: category?.category_name || 'Unknown'
          };
        });
      },
      error: (err) => {
        console.error(`Error fetching match scores for application ${applicationId}:`, err);
        this.matchStats[applicationId] = [];
      }
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

  getIconForCategory(categoryName: string): string {
    switch (categoryName.toLowerCase()) {
      case 'legal': return 'file-description';
      case 'technical': return 'device-desktop';
      case 'marketing': return 'user-check';
      default: return 'user-circle';
    }
  }

  async downloadFile(url: string, filename: string, applicationId?: number) {
    const resumeUrl = await this.applicationsService.getResumeUrl(url, applicationId);
    if (!resumeUrl) {
      return;
    }
    fetch(resumeUrl)
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
      return;
    }

    this.rows.forEach((row) => this.selection.select(row));
  }

  checkboxLabel(row?: any): string {
    if (!row) {
      return `${this.isAllSelected() ? 'select' : 'deselect'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${
      row.position + 1
    }`;
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

  onExpandToggle(row: any, event: MouseEvent): void {
    event.stopPropagation();
    this.expandedElement = this.expandedElement === row ? null : row;
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.expandedElement = null;
    if (this.isAISearchActive()) {
      this.fetchAICandidates();
      return;
    }
    this.getApplications();
  }

  isSessionInterested(candidate: any): boolean {
    return this.sessionInterestedCandidates.some(c => c.id === candidate.id);
  }

  markInterested(candidate: any): void {
    if (!(this.selectedRole && this.selectedPracticeArea)) {
      this.snackBar.open('Complete role and practice area before marking interest.', 'Close', { duration: 2000 });
      return;
    }
    if (this.isSessionInterested(candidate)) {
      this.sessionInterestedCandidates = this.sessionInterestedCandidates.filter(c => c.id !== candidate.id);
      this.snackBar.open('Candidate removed from your selection.', 'Close', { duration: 2000 });
    } else {
      this.sessionInterestedCandidates.push({
        id: candidate.id,
        name: candidate.name,
        position: this.getPositionTitle(candidate.position_id) || this.selectedRole || '',
      });
      this.snackBar.open('Candidate added to your selection.', 'Close', { duration: 2000 });
    }
  }

  submitTalentMatch(): void {
    if (this.sessionInterestedCandidates.length === 0) {
      this.snackBar.open('Please mark at least one candidate as interested before submitting.', 'Close', { duration: 3000 });
      return;
    }
    if (!this.intakeForm?.valid) {
      this.snackBar.open('Please complete all intake fields before submitting.', 'Close', { duration: 3000 });
      return;
    }
    this.isSubmittingTalentMatch = true;
    this.notificationsService.submitTalentMatch({
      searchParams: {
        filters: this.buildAISearchFilters(),
        question: this.query,
      },
      intakeInfo: this.intakeForm.value,
      interestedCandidates: this.sessionInterestedCandidates,
    }).subscribe({
      next: () => {
        this.snackBar.open('Your selection has been submitted. Our team will follow up shortly.', 'Close', { duration: 4000 });
        this.sessionInterestedCandidates = [];
        this.isSubmittingTalentMatch = false;
      },
      error: () => {
        this.snackBar.open('Error submitting your selection. Please try again.', 'Close', { duration: 3000 });
        this.isSubmittingTalentMatch = false;
      }
    });
  }

  goToCandidate(id: number, event: MouseEvent) {
    event.stopPropagation();
    this.router.navigate([`apps/talent-match/${id}`]);
  }

  goToCustomSearch() {
    this.router.navigate([`apps/talent-match/custom-search`]);
  }

  get canSearchAI(): boolean {
    const hasRequiredFilters =
      !!this.selectedRole &&
      !!this.selectedPracticeArea &&
      (this.intakeForm?.valid ?? false);
    if (!!this.query && (this.intakeForm?.valid ?? false)) return true;
    return hasRequiredFilters;
  }

  handleImageError(event: Event) {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = this.assetsPath;
    imgElement.onerror = null;
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

  hasDescription(element: any): boolean {
    return !!element?.description && element.description.trim() !== '';
  }

  private buildApplicationsSearchTerm(): string {
    const terms = [
      this.selectedRole,
      this.selectedPracticeArea,
      this.query,
      this.roleDescription,
    ]
      .map((value) => String(value || '').trim())
      .filter((value, index, values) => value.length > 0 && values.indexOf(value) === index);

    return terms.join(' ');
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
    this.dataSource.data = response.items;
    this.rows = response.items;
    this.totalRecords = response.meta.total;
    this.totalPages = response.meta.totalPages;
    this.currentPage = response.meta.currentPage;
    this.pageSize = response.meta.limit;
    this.sortBy = response.meta.sortBy;
    this.sortOrder = response.meta.sortOrder.toLowerCase() as 'asc' | 'desc';
    this.backendMessage = response.message || '';
    this.expandedElement = null;
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

  private isAISearchActive(): boolean {
    return !this.useManualSearch && this.activeAISearchSessionId.length > 0;
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
}