import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableDataSource } from '@angular/material/table';
import { Positions } from 'src/app/models/Position.model';
import { MatchComponent } from 'src/app/components/match-search/match.component';
import { TalentMatchTableComponent } from 'src/app/components/talent-match-table/talent-match-table.component';
import { TalentMatchFiltersComponent } from 'src/app/components/talent-match-filters/talent-match-filters.component';
import { PositionsService } from 'src/app/services/positions.service';
import { PublicService } from 'src/app/services/public.service';
import { AIService } from 'src/app/services/ai.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-public-talent-match',
  templateUrl: './public-talent-match.component.html',
  styleUrls: ['./public-talent-match.component.scss'],
  imports: [
    CommonModule,
    MatCardModule,
    TalentMatchTableComponent,
    TalentMatchFiltersComponent,
    MatchComponent,
  ]
})

export class AppPublicTalentMatchComponent implements OnInit {

  dataSource = new MatTableDataSource<any>([]);
  selectedRole: number | null = null;
  selectedPracticeArea: string | null = null;
  aiLoading = false;
  aiAnswer = '';
  allCandidates: any[] = [];
  hasSearchResults = false;
  filters: { position_id?: number | null; practiceArea?: string | null } = {};
  positions: Positions[] = [];
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
  displayedColumns = [
    'name',
    'personality_profile',
    'position',
    'skills',
    'experience',
    'trainings'
  ];
  loading: boolean = false;
  errorMessage = '';
  page = 1;
  pageSize = 5;
  totalRecords = 0;
  query = '';
  sortBy: string | null = null;
  sortOrder: 'asc' | 'desc' | null = null;

  constructor(private publicService: PublicService, private positionsService: PositionsService, private aiService: AIService) {}

  ngOnInit() {
    this.loadRecords();
    this.loadPositions();
  }

  loadRecords() {
    this.loading = true;
    this.aiLoading = true;
    const payload = {
      page: this.page,
      offset: this.pageSize,
      sortBy: this.sortBy || undefined,
      sortOrder: this.sortOrder || undefined,
      question: this.query || '',
      filters: {
        selectedRole: this.filters.position_id ? String(this.filters.position_id) : undefined,
        selectedPracticeArea: this.filters.practiceArea || undefined,
        query: this.query || undefined
      }
    };
    this.publicService.getRecords(payload).subscribe({
      next: (res: any) => {
        const mapped = res.items.map((c: any) => {
          const bestMatch = c.all_match_scores?.reduce(
            (max: any, curr: any) =>
              curr.match_percentage > (max?.match_percentage || 0) ? curr : max,
            null
          );
          const trainings = c.certifications?.length
            ? c.certifications.map((cert: any) => cert.name).join(', ')
            : 'No trainings';
          return {
            ...c,
            position: c.position_category,
            experience: c.work_experience_summary || c.work_experience,
            personality_profile: bestMatch
              ? `${bestMatch.match_percentage}% ${bestMatch.category_name}`
              : 'N/A',
            trainings
          };
        });
        this.loading = false;
        this.aiLoading = false;
        this.errorMessage = '';
        this.dataSource.data = mapped;
        this.totalRecords = res.meta.total;
      },
      error: err => {
        this.loading = false;
        this.aiLoading = false;
        if (err.status === 429) {
          this.errorMessage = 'The AI search limit has been reached. Please try again later.';
          this.dataSource.data = [];
          this.totalRecords = 0;
        } else {
          this.errorMessage = 'An error occurred while searching. Please try again.';
          console.error(err);
        }
      }
    });
  }

  loadPositions() {
    this.positionsService.get().subscribe({
      next: (positions: Positions[]) => {
        this.positions = positions;
      },
      error: err => console.error('Error loading positions', err)
    });
  }

  searchCandidates(keyword?: string) {
    if (!this.filters.position_id) return;
    if (keyword !== undefined) {
      this.query = keyword;
    }
    this.page = 1;
    this.aiLoading = true;
    this.loadRecords();
  }

  onManualSearch(text: string) {
    this.searchCandidates(text);
  } 

  onFiltersChange(filters: any) {
    this.page = 1;
    this.filters = {
      position_id: filters.position_id ?? undefined,
      practiceArea: filters.practiceArea ?? undefined
    };
  }

  onSortChange(event: any) {
    if (!event.active || event.direction === '') {
      this.sortBy = null;
      this.sortOrder = null;
    } else {
      this.sortBy = event.active;
      this.sortOrder = event.direction;
    }
    this.page = 1;
    this.loadRecords();
  }  

  onPageChange(event: any) {
    this.page = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadRecords();
  }
}