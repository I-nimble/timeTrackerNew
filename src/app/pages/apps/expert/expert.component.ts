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
import { DepartmentsService } from 'src/app/services/departments.service';
import { Department } from 'src/app/models/Department.model';

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
  currentSearchText = '';
  departments: Department[] = [];
  searchResults: any[] = [];
  selectedDepartmentId: number | null = null;

  constructor(private usersService: UsersService, private aiService: AIService, private companiesService: CompaniesService, private plansService: PlansService, private departmentsService: DepartmentsService) {}

  ngOnInit(): void {
    this.usersService.getUsers({}).subscribe((users) => {
      this.clients = users.filter(
        (u: any) => u.role == 3 && u.active == 1 && u.company?.show_info == 1
      );
      this.filteredClients = this.clients;
    });
    this.departmentsService.get().subscribe((deps) => {
      this.departments = deps;
    });
    this.companiesService.getByOwner().subscribe((company: any) => {
      this.plansService.getCurrentPlan(company.company.id).subscribe((companyPlan: any) => {
        this.plan = companyPlan.plan;
        this.plansService.setCurrentPlan(this.plan);
      });
    });
  }

  applyDepartmentFilter(source: any[]): any[] {
    if (!this.selectedDepartmentId) {
      return source;
    }
    return source.filter(client =>
      client.company?.departments?.some(
        (d: any) => d.id === this.selectedDepartmentId
      )
    );
  }

  onClientSelected(client: any) {
    this.selectedClient = client;
  }

  onBackFromDetails() {
    this.selectedClient = null;
  }

  async askGemini(question: string) {
    if (!question && this.selectedDepartmentId !== null) {
      question = 'Show all experts';
    }
    if (!question) return;
    if (this.useManualSearch) {
      this.onManualSearch(question);
      return;
    }
    this.aiLoading = true;
    this.aiAnswer = '';
    this.filteredClients = [];

    this.aiService.evaluateExperts(this.clients, question).subscribe({
      next: (res) => {
        const rawText = res.answer?.parts?.[0]?.text ?? '';
        const selectedCompanies = this.extractCompaniesFromAiAnswer(rawText);
        this.filteredClients = this.clients.filter(client => {
          const matchesCompany =
            selectedCompanies.includes(client.company?.name);
          const matchesDepartment =
            !this.selectedDepartmentId ||
            client.company?.departments?.some(
              (d: any) => d.id === this.selectedDepartmentId
            );
          return matchesCompany && matchesDepartment;
        });
        this.aiLoading = false;
        this.aiAnswer = this.filteredClients.length ? '' : 'No matches.';
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

  onSearchTextChange(value: string) {
    this.currentSearchText = value;
  }

  onDepartmentChange(departmentId: number | null) {
    this.selectedDepartmentId = departmentId;
    
    if (this.canSearch) {
      this.askGemini(this.currentSearchText);
    }
  }

  get canSearch(): boolean {
    return (
      !!this.currentSearchText?.trim() ||
      this.selectedDepartmentId !== null
    );
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