import { Component, OnInit, ViewChild, AfterViewInit, Optional, Inject } from '@angular/core';
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
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, NgModel } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { InterviewsService } from 'src/app/services/interviews.service';
import { CompaniesService } from 'src/app/services/companies.service';
import moment from 'moment';
import { ModalComponent } from 'src/app/components/confirmation-modal/modal.component';
import { MatchComponent } from 'src/app/components/match-search/match.component';
import { AIService } from 'src/app/services/ai.service';
import { MarkdownPipe, LinebreakPipe } from 'src/app/pipe/markdown.pipe';
import { Router } from '@angular/router';
import { MatTabHeader, MatTabBody } from '@angular/material/tabs';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { ApplicationMatchScoresService, PositionCategory } from 'src/app/services/application-match-scores.service';
import { MatSliderModule } from '@angular/material/slider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { NgxSliderModule } from '@angular-slider/ngx-slider';
import { Options } from '@angular-slider/ngx-slider';
import { DiscProfilesService } from 'src/app/services/disc-profiles.service';
import { TourMatMenuModule } from 'ngx-ui-tour-md-menu';
import { FormatNamePipe } from 'src/app/pipe/format-name.pipe';

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
    FormsModule,
    MatchComponent,
    MarkdownPipe,
    LinebreakPipe,
    MatTabHeader,
    MatTabBody,
    MatSliderModule,
    MatSlideToggleModule,
    MatChipsModule,
    NgxSliderModule,
    FormatNamePipe,
    TourMatMenuModule
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
  picturesUrl: string = 'https://inimble-app.s3.us-east-1.amazonaws.com/photos';
  positions: any[] = [];
  searchText: string = '';
  displayedColumns: string[] = [
    'select',
    'name',
    'personality profile',
    'trainings',
    'rate',
    'actions',
  ];
  dataSource = new MatTableDataSource<any>([]);
  selection = new SelectionModel<any>(true, []);
  companyId: number | null = null;
  interviews: any[] = [];
  assetsPath: string = 'assets/images/default-user-profile-pic.png';
  aiLoading = false;
  aiAnswer: string = '';
  hasSearchResults = false;
  allCandidates: any[] = [];
  useManualSearch = false;
  expandedElement: any | null = null;
  columnsToDisplayWithExpand = [...this.displayedColumns, 'expand'];
  matchStats: { [applicationId: number]: { icon: string; value: number; label: string }[] } = {};
  positionCategories: PositionCategory[] = [];
  selectedPositionFilters: any[] = [];
  customPositionFilter: string = '';
  showCustomFilterInput: boolean = false;
  filterPositions: any[] = [];
  query: string = '';
  selectedRole: string | null = null;
  selectedPracticeArea: string | null = null;
  selectedSkillsTools: string[] = [];
  selectedCertifications: string[] = [];
  selectedBackground: string[] = [];
  roleDescription: string = '';
  budgetMin: number = 4;
  budgetMax: number = 15;
  originalBudgetRange = { 
    min: 4, 
    max: 15 
  };
  budgetRange = {
    min: 4,
    max: 15
  };
  isMonthlyRate: boolean = false;
  budgetPresets = [
    { label: 'Entry level (6–7/hr)', min: 6, max: 7 },
    { label: 'Standard (7–9/hr)', min: 7, max: 9 },
    { label: 'Senior (9–12/hr)', min: 9, max: 12 },
    { label: 'Expert (12–15/hr)', min: 12, max: 15 }
  ];

  budgetOptions: Options = {
    floor: this.budgetMin,
    ceil: this.budgetMax,
    step: 0.5,
    showSelectionBar: true,
    translate: (value: number): string => {
      return this.isMonthlyRate ? `$${value * 160}` : `$${value}/hr`;
    }
  };

  positionsOptions: string[] = [
    'Legal Assistant',
    'Paralegal',
    'Case Manager',
    'Intake Specialist',
    'Demand Writer',
    'Medical Records Specialist',
    'Litigation Support Assistant',
    'Executive Assistant',
    'Administrative Assistant',
    'Virtual Assistant (General)'
  ];

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

  skillsList: string[] = [
    'Intake',
    'Client Communication',
    'Case Management',
    'Legal Research',
    'Drafting',
    'Demand Letter Drafting',
    'Discovery',
    'Medical Records Review',
    'Billing and Invoicing',
    'Calendar Management',
    'CRM Management',
    'Lead Intake',
    'Trial Preparation'
  ];

  toolsList: string[] = [
    'Clio',
    'CASEpeer',
    'Filevine',
    'MyCase',
    'RingCentral',
    'Dialpad',
    'Zoom',
    'Google Workspace',
    'Microsoft Office',
    'Slack',
    'Notion',
    'Trello',
    'QuickBooks'
  ];

  certificationsOptions: string[] = [
    'Paralegal Certificate',
    'Bilingual Certification',
    'Medical Background',
    'Accounting / Finance Training',
    'Customer Support Training',
    'AI Tools Training'
  ];

  relatedBackgroundOptions: string[] = [
    'Law Student / Pre-Law',
    'Legal Studies',
    'Criminology',
    'Political Science',
    'Sociology',
    'Psychology',
    'Public Administration',
    'Business Administration',
    'Accounting',
    'Finance',
    'Human Resources',
    'Communications',
    'Journalism',
    'English / Literature',
    'Healthcare Administration',
    'Medical Assistant / Nursing Assistant',
    'Customer Service / Call Center',
    'Marketing / Advertising',
    'Project Management',
    'Office Administration',
    'International Relations'
  ];

  constructor(
    private applicationsService: ApplicationsService,
    private positionsService: PositionsService,
    public dialog: MatDialog,
    private companiesService: CompaniesService,
    private interviewsService: InterviewsService,
    private aiService: AIService,
    private router: Router,
    private matchScoresService: ApplicationMatchScoresService,
    private discProfilesService: DiscProfilesService
  ) {}
  
  ngOnInit(): void {
    this.getApplications();
    this.getPositions();
    this.getCompany();
    this.getInterviews();
    this.getPositionCategories();
  }

  ngAfterViewInit(): void {
  }

  searchCandidatesWithAI(question: string) {
    const searchQuery = question || this.buildFullSearchQuery();
    if (this.useManualSearch) {
      this.onManualSearch(question);
      return;
    }
    this.aiLoading = true;
    this.aiAnswer = '';
    this.hasSearchResults = false;

    const candidates = [...this.allCandidates];

    const simplifiedCandidates = candidates.map(c => ({
      id: c.id,
      name: c.name,
      skills: c.skills,
      work_experience: c.work_experience,
      position: this.getPositionTitle(c.position_id) ?? '',
      location: c.location,
    }));

    this.aiService.evaluateCandidates(simplifiedCandidates, searchQuery).subscribe({
      next: (res) => {
        const enhancedResults = res.enhanced_results || [];

        const enhancedMap = new Map();
        enhancedResults.forEach(enhanced => {
          enhancedMap.set(enhanced.name, enhanced);
        });

        const orderedCandidates = enhancedResults
          .map(enhanced => {
            const originalCandidate = candidates.find(c => 
              c.name.toLowerCase() === enhanced.name.toLowerCase()
            );
            if (originalCandidate) {
              return { 
                ...originalCandidate,
                match_percentage: enhanced.match_percentage,
                overall_match_percentage: enhanced.overall_match_percentage || enhanced.match_percentage,
                position_category: enhanced.position_category,
                best_position_category_id: enhanced.best_position_category_id
              };
            }
            return null;
          })
          .filter((c): c is any => c !== undefined);

        this.dataSource.data = orderedCandidates;

        this.hasSearchResults = true;
        this.aiLoading = false;
        if (orderedCandidates.length > 0) {
          this.aiAnswer = '';
        } else {
          this.aiAnswer = 'No matches.';
        }

        const orderedIds = orderedCandidates.map(c => c.id);
        this.saveAISearchState(searchQuery, orderedIds, {
          selectedRole: this.selectedRole,
          selectedPracticeArea: this.selectedPracticeArea,
          budgetRange: this.budgetRange,
          isMonthlyRate: this.isMonthlyRate,
          selectedSkillsTools: this.selectedSkillsTools,
          selectedCertifications: this.selectedCertifications,
          selectedBackground: this.selectedBackground,
          roleDescription: this.roleDescription,
          query: this.query
        });
      },
      error: (err) => {
        if (err.status === 429) {
          this.aiAnswer = 'You have reached the limit of 50 AI requests per day. Manual search has been enabled until your limit resets tomorrow. Upgrade your plan to continue using AI-powered search without interruptions.';
          this.useManualSearch = true;
          this.aiLoading = false;
        } else {
          this.aiAnswer = 'Error getting answer from AI, try again later.';
          console.error('AI evaluation error:', err);
        }
        this.aiLoading = false;
      }
    });
  }

  buildFullSearchQuery(): string {
    const stage1: string[] = [];
    const stage2: string[] = [];
    if (this.selectedRole) {
      stage1.push(`Primary role: ${this.selectedRole}`);
    }
    if (this.selectedPracticeArea) {
      stage1.push(`Practice area: ${this.selectedPracticeArea}`);
    }
    if (this.roleDescription) {
      stage1.push(`Role description: ${this.roleDescription}`);
    }
    if (this.selectedSkillsTools?.length > 0) {
      stage2.push(`Preferred skills/tools: ${this.selectedSkillsTools.join(', ')}`);
    }
    if (this.selectedCertifications?.length > 0) {
      stage2.push(`Relevant certifications: ${this.selectedCertifications.join(', ')}`);
    }
    if (this.selectedBackground?.length > 0) {
      stage2.push(`Related background: ${this.selectedBackground.join(', ')}`);
    }
    if (this.budgetRange.min !== this.budgetMin || this.budgetRange.max !== this.budgetMax) {
      stage2.push(
        this.isMonthlyRate
          ? `Budget range: $${this.budgetRange.min}–$${this.budgetRange.max} monthly`
          : `Budget range: $${this.budgetRange.min}/hr – $${this.budgetRange.max}/hr`
      );
    }
    let finalQuery = `FIRST filter candidates ONLY by the following primary criteria: 
  ${stage1.join('; ') || 'None provided'}
  THEN refine the remaining candidates using these optional preferences (only if available):
  ${stage2.join('; ') || 'No additional refinements'}`;
    return finalQuery;
  }

  onManualSearch(query?: string) {
    this.clearAISearchState();

    const searchQuery = query || this.query;
    this.query = searchQuery;
    const lower = searchQuery.toLowerCase();
    this.dataSource.data = this.allCandidates.filter(c =>
      c.name?.toLowerCase().includes(lower) ||
      this.getPositionTitle(c.position_id)?.toLowerCase().includes(lower) ||
      c.skills?.toLowerCase().includes(lower) ||
      c.location?.toLowerCase().includes(lower)
    );
    this.hasSearchResults = this.dataSource.data.length > 0;
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

  openDialog(action: string, row?: any): void {
    if (row && !this.selection.isSelected(row)) {
      this.selection.toggle(row);
    }
    let interview = null;
    if (action === 'Reeschedule' && row) {
      interview = this.interviews.find(
        (interview) => interview.application_id === row.id
      );
    }
    const dialogRef = this.dialog.open(AppInterviewDialogContentComponent, {
      data: {
        action,
        date_time: interview?.date_time || null,
        interviewId: interview?.id || null,
        selected: this.selection.selected,
        companyId: this.companyId,
      },
      autoFocus: false,
    });

    dialogRef.afterClosed().subscribe((result) => {
      this.getInterviews();
      this.selection.clear();
    });
  }

  cancelInterview(applicationId: number) {
    const interview = this.interviews.find(
      (interview) => interview.application_id === applicationId
    );
    this.interviewsService.cancel(interview.id).subscribe({
      next: (response: any) => {
        this.getInterviews();
      },
      error: (err: any) => {
        console.error('Error cancelling interview:', err);
      },
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
    this.applicationsService.get().subscribe({
      next: (applications: any[]) => {
        const sortedApplications = applications
          .map((a: any) => ({ ...a }))
          .sort((a, b) => {
            const aMatch = a.overall_match_percentage || a.match_percentage || 0;
            const bMatch = b.overall_match_percentage || b.match_percentage || 0;
            return bMatch - aMatch;
          });

        this.allCandidates = sortedApplications;
        this.dataSource = new MatTableDataSource(this.allCandidates);
        // this.getAllMatchScores(); TODO: UNCOMMENT THIS LATER

        const stored = this.loadAISearchState();

        if (stored && stored.ids.length > 0 && this.allCandidates.length > 0) {
          if (stored.filters.selectedRole !== undefined) this.selectedRole = stored.filters.selectedRole;
          if (stored.filters.selectedPracticeArea !== undefined) this.selectedPracticeArea = stored.filters.selectedPracticeArea;
          if (stored.filters.budgetRange) this.budgetRange = stored.filters.budgetRange;
          if (stored.filters.isMonthlyRate !== undefined) this.isMonthlyRate = stored.filters.isMonthlyRate;
          if (stored.filters.selectedSkillsTools) this.selectedSkillsTools = stored.filters.selectedSkillsTools;
          if (stored.filters.selectedCertifications) this.selectedCertifications = stored.filters.selectedCertifications;
          if (stored.filters.selectedBackground) this.selectedBackground = stored.filters.selectedBackground;
          if (stored.filters.roleDescription !== undefined) this.roleDescription = stored.filters.roleDescription;
          if (stored.filters.query !== undefined) this.query = stored.filters.query;

          const orderedCandidates = stored.ids
            .map((id: string | number) => this.allCandidates.find(c => c.id === id))
            .filter(Boolean);

          if (orderedCandidates.length > 0) {
            this.dataSource.data = orderedCandidates;
            this.hasSearchResults = true;
            this.aiAnswer = '';
          }
        }
      },
      error: (err: any) => {
        console.error('Error fetching applications:', err);
      },
    });
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
    if (this.selectedPositionFilters.length === 0) {
      this.dataSource.data = [...this.allCandidates];
      this.hasSearchResults = false;
      return;
    }

    if (this.query.trim()) {
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
      this.dataSource.data = [...this.allCandidates];
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

  getIconForCategory(categoryName: string): string {
    switch (categoryName.toLowerCase()) {
      case 'legal': return 'file-description';
      case 'technical': return 'device-desktop';
      case 'marketing': return 'user-check';
      default: return 'user-circle';
    }
  }

  downloadFile(url: string, filename: string) {
    const resumeUrl = this.applicationsService.getResumeUrl(url);
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

  onRowClick(row: any) {
    this.expandedElement = this.expandedElement === row ? null : row;
    if (!this.getInterviewDateTime(row.id)) {
      this.selection.toggle(row);
      this.onRowSelectionChange();
    }
  }

  goToCandidate(id: number, event: MouseEvent) {
    event.stopPropagation();
    this.router.navigate([`apps/talent-match/${id}`]);
  }

  goToCustomSearch() {
    this.router.navigate([`apps/talent-match/custom-search`]);
  }

  convertToMonthly(value: number): number {
    return value * 160;
  }

  convertToHourly(value: number): number {
    return value / 160;
  }

  toggleRateType() {
    this.isMonthlyRate = !this.isMonthlyRate;
    if (this.isMonthlyRate) {
      const min = this.originalBudgetRange.min * 160;
      const max = this.originalBudgetRange.max * 160;
      this.budgetOptions = {
        ...this.budgetOptions,
        floor: this.budgetMin * 160,
        ceil: this.budgetMax * 160,
        translate: (value: number): string => `$${value}`
      };
      this.budgetRange = { min, max };
    } else {
      const min = this.originalBudgetRange.min;
      const max = this.originalBudgetRange.max;
      this.budgetOptions = {
        ...this.budgetOptions,
        floor: this.budgetMin,
        ceil: this.budgetMax,
        translate: (value: number): string => `$${value}/hr`
      };
      this.budgetRange = { min, max };
    }
  }

  onPresetClick(preset: any) {
    if (this.isMonthlyRate) {
      this.budgetRange.min = preset.min * 160;
      this.budgetRange.max = preset.max * 160;
    } else {
      this.budgetRange.min = preset.min;
      this.budgetRange.max = preset.max;
    }
    this.originalBudgetRange = { min: preset.min, max: preset.max };
  }

  onBudgetChange(event: any) {
    this.budgetRange = event;
    if (!this.isMonthlyRate) {
      this.originalBudgetRange = { ...this.budgetRange };
    } else {
      this.originalBudgetRange = {
        min: this.budgetRange.min / 160,
        max: this.budgetRange.max / 160
      };
    }
  }
  
  get canSearchAI(): boolean {
    const hasRequiredFilters =
      !!this.selectedRole &&
      !!this.selectedPracticeArea;
    if (!!this.query) return true;
    return hasRequiredFilters;
  }

  handleImageError(event: Event) {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = this.assetsPath;
    imgElement.onerror = null;
  }

  private saveAISearchState(searchQuery: string, orderedIds: number[], filters: any) {
    localStorage.setItem('aiSearchQuery', searchQuery);
    localStorage.setItem('aiOrderedIds', JSON.stringify(orderedIds));
    localStorage.setItem('aiFilters', JSON.stringify(filters));
  }

  private loadAISearchState(): { query: string; ids: number[]; filters: any } | null {
    const query = localStorage.getItem('aiSearchQuery');
    const idsStr = localStorage.getItem('aiOrderedIds');
    const filtersStr = localStorage.getItem('aiFilters');
    if (!query || !idsStr || !filtersStr) return null;
    try {
      const ids = JSON.parse(idsStr);
      const filters = JSON.parse(filtersStr);
      return { query, ids, filters };
    } catch {
      return null;
    }
  }

  private clearAISearchState() {
    localStorage.removeItem('aiSearchQuery');
    localStorage.removeItem('aiOrderedIds');
    localStorage.removeItem('aiFilters');
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
  dateTime: Date | null = null;
  interviewScheduled = false;
  availableDaysFilter = (d: Date | null): boolean => {
    if (!d) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentMonday = new Date(today);
    currentMonday.setDate(today.getDate() - today.getDay() + 1);

    const nextMonday = new Date(currentMonday);
    nextMonday.setDate(currentMonday.getDate() + 7);

    const date = new Date(d);
    date.setHours(0, 0, 0, 0);

    // Only allow Wednesday and Thursday of any week starting from next week
    const day = date.getDay();
    const isWedOrThu = day === 3 || day === 4;
    const isFromNextWeekOnward = date >= nextMonday;

    return isWedOrThu && isFromNextWeekOnward;
  };

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
    const m = moment(this.local_data.date_time).local();
    if (this.local_data.action === 'Reeschedule' && this.local_data.date_time) {
      this.dateTime = m.toDate();
    }
  }

  onScheduleInterview() {
    if(!this.dateTime) {
      this.openSnackBar('Please select a date and time', 'Close');
      return;
    }

    const applicants = this.local_data.selected;
    const company_id = this.data.companyId;

    const data = {
      date_time: this.dateTime,
      applicants,
      company_id,
    };
    if (this.local_data.action === 'Schedule') {
      this.interviewsService.post(data).subscribe({
        next: () => {
          this.interviewScheduled = true;
        },
        error: (err: any) => {
          console.error('Error scheduling interview:', err);
          this.openSnackBar('Error scheduling interview', 'Close');
          this.dialogRef.close({ event: 'Cancel' });
        },
      });
    } else if (this.local_data.action === 'Reeschedule') {
      this.interviewsService
        .put(data, this.local_data.interviewId)
        .subscribe({
          next: (response: any) => {
            this.interviewScheduled = true;
          },
          error: (err: any) => {
            console.error('Error reescheduling interview:', err);
            this.openSnackBar('Error reescheduling interview', 'Close');
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