import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/material.module';
import { ScrapperTableComponent } from './scrapper-table/scrapper-table.component';
import { ScrapperService } from 'src/app/services/apps/scrapper/scrapper.service';
import { AIService } from 'src/app/services/ai.service';
import { MatchComponent } from 'src/app/components/match-search/match.component';
import { MarkdownPipe, LinebreakPipe } from 'src/app/pipe/markdown.pipe';

@Component({
  selector: 'app-scrapper',
  templateUrl: './scrapper.component.html',
  styleUrls: ['./scrapper.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    ScrapperTableComponent,
    MatchComponent,
    MarkdownPipe,
    LinebreakPipe
  ]
})
export class ScrapperComponent implements OnInit {
  posts: any[] = [];
  filteredPosts: any[] = [];
  aiAnswer: string = '';
  aiLoading: boolean = false;
  useManualSearch: boolean = false;

  constructor(
    private scrapperService: ScrapperService,
    private aiService: AIService
  ) {}

  ngOnInit(): void {
    this.getPosts();
  }

  getPosts() {
    this.scrapperService.getPosts().subscribe(posts => {
      this.posts = posts.sort((a:any, b:any) => {
        return new Date(b.created_utc).getTime() - new Date(a.created_utc).getTime();
      });
    });
  }

  async askGemini(question: string) {
    if (!question) return;
    if (this.useManualSearch) {
      this.onManualSearch(question);
      return;
    }

    this.aiLoading = true;
    this.aiAnswer = '';
    this.filteredPosts = [];

    this.aiService.evaluatePosts(question).subscribe({
      next: (res) => {
        const returnedIds = res.posts.map((p: any) => p.id);
        this.filteredPosts = this.posts.filter(post => returnedIds.includes(post.id));
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

  onManualSearch(query: string) {
    if (!query) {
      this.filteredPosts = [];
      return;
    }

    const lower = query.toLowerCase();
    this.filteredPosts = this.posts.filter(post =>
      post.title?.toLowerCase().includes(lower) ||
      post.content?.toLowerCase().includes(lower)
    );
  }
}