import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatPaginator } from '@angular/material/paginator';
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
    'skills',
    'position',
    'experience',
    'profile_summary',
    'age'
  ];

  page = 1;
  pageSize = 5;
  totalRecords = 0;
  query = '';

  constructor(private publicService: PublicService, private positionsService: PositionsService, private aiService: AIService) {}

  ngOnInit() {
    this.loadRecords();
    this.loadPositions();
  }

  loadRecords(extraFilters: any = {}) {
    this.publicService.getRecords({
      page: this.page,
      pageSize: this.pageSize,
      keyword: this.query || undefined,
      ...extraFilters
    }).subscribe({
      next: (res: any) => {
        const mapped = res.data.map((c: any) => ({
          ...c,
          name: c.full_name,
          profile_pic_url: c.picture ? `${environment.upload}/profile-pictures/${c.picture}` : null
        }));
        this.allCandidates = mapped;
        this.dataSource.data = mapped;
        this.totalRecords = res.meta.total;
      },
      error: err => console.error(err)
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
    this.query = keyword || this.query;
    this.page = 1;
    this.loadRecords();
  }

  onManualSearch(text: string) {
    this.searchCandidates(text);
  } 

  onFiltersChange(filters: any) {
    this.page = 1;
    this.filters.position_id = filters.position_id ?? undefined;
    this.filters.practiceArea = filters.practiceArea ?? undefined;
    this.loadRecords(this.filters);
  }

  onPageChange(event: any) {
    this.page = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadRecords(this.filters);
  }
}