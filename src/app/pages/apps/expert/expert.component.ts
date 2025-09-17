import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { UsersService } from 'src/app/services/users.service';
import { AIService } from 'src/app/services/ai.service';
import { ClientTableComponent } from './client-table/client-table.component';
import { ClientDetailsComponent } from './client-detail/client-details.component';
import { MarkdownPipe, LinebreakPipe } from 'src/app/pipe/markdown.pipe';
import { MatchComponent } from 'src/app/components/match-search/match.component';

@Component({
  selector: 'app-expert',
  templateUrl: './expert.component.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MaterialModule,
    TablerIconsModule,
    ClientTableComponent,
    ClientDetailsComponent, 
    MarkdownPipe,
    LinebreakPipe,
    MatchComponent
  ]
})
export class AppExpertComponent implements OnInit {
  clients: any[] = [];
  filteredClients: any[] = [];
  selectedClient: any = null;
  aiQuestion: string = '';
  aiAnswer: string = '';
  aiLoading: boolean = false;
  useManualSearch: boolean = false;

  constructor(private usersService: UsersService, private aiService: AIService) {}

  ngOnInit(): void {
    this.usersService.getUsers({}).subscribe((users) => {
      this.clients = users.filter((u: any) => u.role == 3 && u.active == 1);
      // this.filteredClients = [...this.clients];
    });
  }

  onClientSelected(client: any) {
    this.selectedClient = client;
  }

  onBackFromDetails() {
    this.selectedClient = null;
  }

  async askGemini(question: string) {
    if (!question) return;
    if (this.useManualSearch) {
      this.onManualSearch(question);
      return;
    }
    this.aiQuestion = question;    
    this.aiLoading = true;
    this.aiAnswer = '';
    this.filteredClients = [];

    this.aiService.evaluateExperts(this.clients, question).subscribe({
      next: (res) => {
      this.aiAnswer = res.answer;

      const selectedCompanies = this.extractCompaniesFromAiAnswer(this.aiAnswer);

      this.filteredClients = this.clients.filter(client =>
        selectedCompanies.includes(client.company?.name)
      );
        this.aiLoading = false;
      },
      error: (err) => {
        if (err.status === 429) {
          this.aiAnswer = 'You have reached the limit of 50 AI requests per day. You can keep searching manually until tomorrow.';
          this.useManualSearch = true;
          this.aiLoading = false;
        } else {
          this.aiAnswer = 'Error getting answer from AI, try again later.';
        }
        this.aiLoading = false;
      }
    });
  }

  extractCompaniesFromAiAnswer(answer: string): string[] {
    const regex = /"([^"]+)"/g;
    const matches: string[] = [];
    let match;
    while ((match = regex.exec(answer)) !== null) {
      matches.push(match[1].trim());
    }
    return matches;
  }

  onManualSearch(query: string) {
    if (!query) {
      this.filteredClients = [];
      return;
    }

    const lower = query.toLowerCase();
    this.filteredClients = this.clients.filter(client =>
      client.name.toLowerCase().includes(lower) ||
      client.company?.name?.toLowerCase().includes(lower) ||
      client.company?.departments?.some((d: any) =>
        d.name?.toLowerCase().includes(lower)
      )
    );
  }
}