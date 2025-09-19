import { Component, Input, OnInit } from '@angular/core';
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
import { CompaniesService } from 'src/app/services/companies.service';
import { PlansService } from 'src/app/services/plans.service';
import { Plan } from 'src/app/models/Plan.model';

@Component({
  selector: 'app-expert',
  templateUrl: './expert.component.html',
  styleUrls: ['./expert.component.scss'],
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
  plan?: Plan;

  constructor(private usersService: UsersService, private aiService: AIService, private companiesService: CompaniesService, private plansService: PlansService) {}

  ngOnInit(): void {
    this.usersService.getUsers({}).subscribe((users) => {
      this.clients = users.filter((u: any) => u.role == 3 && u.active == 1);
      // this.filteredClients = [...this.clients];
    });
    this.companiesService.getByOwner().subscribe((company: any) => {
      this.plansService.getCurrentPlan(company.company.id).subscribe((companyPlan: any) => {
        this.plan = companyPlan.plan;
        console.log(this.plan)
      });
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
      const rawText = res.answer?.parts?.[0]?.text ?? '';
      const selectedCompanies = this.extractCompaniesFromAiAnswer(rawText);

      this.filteredClients = this.clients.filter(client =>
        selectedCompanies.includes(client.company?.name)
      );
        this.aiLoading = false;
        if (selectedCompanies.length > 0) {
          this.aiAnswer = '';
        } else {
          this.aiAnswer = 'No matches.';
        }
      },
      error: (err) => {
        if (err.status === 429) {
          this.aiAnswer = 'You have reached the limit of 50 AI requests per day. You can keep searching manually until tomorrow, or update your plan.';
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