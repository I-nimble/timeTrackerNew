import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/material.module';
import { ScrapperTableComponent } from './scrapper-table/scrapper-table.component';
import { ScrapperService } from 'src/app/services/apps/scrapper/scrapper.service';
import { AIService } from 'src/app/services/ai.service';
import { MatchComponent } from 'src/app/components/match-search/match.component';
import { MarkdownPipe, LinebreakPipe } from 'src/app/pipe/markdown.pipe';
import { FormsModule } from '@angular/forms';
import { environment } from 'src/environments/environment';
import { TablerIconsModule } from 'angular-tabler-icons';

@Component({
  selector: 'app-scrapper',
  templateUrl: './scrapper.component.html',
  styleUrls: ['./scrapper.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MaterialModule,
    ScrapperTableComponent,
    MatchComponent,
    MarkdownPipe,
    LinebreakPipe,
    TablerIconsModule
  ]
})
export class ScrapperComponent implements OnInit {
  posts: any[] = [];
  filteredPosts: any[] = [];
  aiAnswer: string = '';
  aiLoading: boolean = false;
  useManualSearch: boolean = false;
  manualSearchQuery: string = '';
  availableKeywords: string[] = [];
  selectedKeywords: string[] = []; 
  showKeywordFilter: boolean = true;

  constructor(
    private scrapperService: ScrapperService,
    private aiService: AIService
  ) {}

  ngOnInit(): void {
    this.getPosts();
    this.loadKeywords();
  }

  getPosts() {
    this.scrapperService.getPosts().subscribe(posts => {
      this.posts = posts.sort((a:any, b:any) => {
        return new Date(b.created_utc).getTime() - new Date(a.created_utc).getTime();
      });
      this.filteredPosts = this.posts.slice(0, 5);
    });
  }

  loadKeywords(): void {
    this.availableKeywords = environment.keywords || [];
    this.selectedKeywords = [];
  }

  async askGemini(question: string) {
    if (!question && this.selectedKeywords.length === 0) return;
    
    if (this.useManualSearch) {
      this.onManualSearch(question || '');
      return;
    }

    this.aiLoading = true;
    this.aiAnswer = '';
    this.filteredPosts = [];

    const searchQuery = question || this.selectedKeywords.join(', ');
    
    this.aiService.evaluatePosts(searchQuery).subscribe({
      next: (res) => {
        const returnedIds = res.posts.map((p: any) => p.id);
        this.filteredPosts = this.posts
          .filter(post => returnedIds.includes(post.id))
          .slice(0, 5);        
        this.aiLoading = false;
        if (this.filteredPosts.length === 0) {
          this.aiAnswer = 'No matches found.';
        } else {
          this.aiAnswer = '';
        }
      },
      error: (err) => {
        if (err.status === 429) {
          this.aiAnswer = 'AI request limit reached. Please use manual search until tomorrow.';
          this.useManualSearch = true;
        } else {
          this.aiAnswer = 'Error getting answer from AI, try again later.';
        }
        this.aiLoading = false;
      }
    });
  }

  onManualSearch(query: string): void {
    this.manualSearchQuery = query; 
    this.applySearchWithKeywords();
  }

  applySearchWithKeywords(): void {
    let filtered = [...this.posts];
    if (this.manualSearchQuery.trim()) {
      const lower = this.manualSearchQuery.toLowerCase().trim();
      filtered = filtered.filter(post =>
        post.title?.toLowerCase().includes(lower) ||
        post.content?.toLowerCase().includes(lower)
      );
    }

    if (this.selectedKeywords.length > 0) {
      filtered = filtered.filter(post => {
        const title = post.title?.toLowerCase() || '';
        const content = post.content?.toLowerCase() || '';
        const postText = title + ' ' + content;
        
        return this.selectedKeywords.some(keyword => 
          postText.includes(keyword.toLowerCase())
        );
      });
    }

    this.filteredPosts = filtered.slice(0, 5);
  }

  onKeywordFilterChange(): void {
    if (this.manualSearchQuery.trim() || this.filteredPosts.length > 0) {
      this.applySearchWithKeywords();
    }
  }

  applyKeywordFilter(): void {
    this.applySearchWithKeywords();
  }
}