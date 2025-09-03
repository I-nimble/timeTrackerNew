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
    LinebreakPipe
  ]
})
export class AppExpertComponent implements OnInit {
  clients: any[] = [];
  filteredClients: any[] = [];
  departmentFilter: string = '';
  selectedClient: any = null;
  aiQuestion: string = '';
  aiAnswer: string = '';
  aiLoading: boolean = false;

  constructor(private usersService: UsersService, private aiService: AIService) {}

  ngOnInit(): void {
    this.usersService.getUsers({}).subscribe((users) => {
      this.clients = users.filter((u: any) => u.role == 3 && u.active == 1);
      this.filteredClients = [...this.clients];
    });
  }

  applyDepartmentFilter() {
    const filter = this.departmentFilter.trim().toLowerCase();
    if (!filter) {
      this.filteredClients = [...this.clients];
      return;
    }
    this.filteredClients = this.clients.filter(client => {
      const departments = client.company?.departmentsString?.toLowerCase() || '';
      return departments.includes(filter);
    });
  }

  onClientSelected(client: any) {
    this.selectedClient = client;
  }

  onBackFromDetails() {
    this.selectedClient = null;
  }

  async askGemini() {
    if (!this.aiQuestion) return;
    this.aiLoading = true;
    this.aiAnswer = '';
    try {
      this.aiService.evaluateExperts(this.clients, this.aiQuestion).subscribe({
        next: (res) => {
          this.aiAnswer = res.answer;
          this.aiLoading = false;
        },
        error: (err) => {
          this.aiAnswer = 'Error getting answer from AI.';
          this.aiLoading = false;
        }
      });
    } catch (err) {
      this.aiAnswer = 'Error getting answer from AI.';
      this.aiLoading = false;
    }
  }
}