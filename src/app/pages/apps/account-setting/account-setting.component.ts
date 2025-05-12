import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTabsModule } from '@angular/material/tabs';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MatDividerModule } from '@angular/material/divider';
import { CompaniesService } from 'src/app/services/companies.service';
import { PlansService } from 'src/app/services/plans.service';

@Component({
  standalone: true,
  selector: 'app-account-setting',
  imports: [
    MatCardModule, 
    MatIconModule, 
    TablerIconsModule, 
    MatTabsModule, 
    MatFormFieldModule, 
    MatSlideToggleModule, 
    MatSelectModule, 
    MatInputModule, 
    MatButtonModule, 
    MatDividerModule
  ],
  templateUrl: './account-setting.component.html',
  styleUrl: './account-setting.component.scss'
})
export class AppAccountSettingComponent implements OnInit {
  userRole = localStorage.getItem('role');
  currentPlan!: { id:number, name:string };

  constructor(private companiesService: CompaniesService, private plansService: PlansService) {}

  ngOnInit(): void {
    console.log('userRole:', this.userRole, 'Type:', typeof this.userRole); // Add this line

    if(this.userRole == '3'){
      this.companiesService.getByOwner().subscribe((company: any) => {
        this.plansService.getCurrentPlan(company.company_id).subscribe((plan: any) => {
          console.log(plan);
          this.currentPlan.id = plan.plan.id
          this.currentPlan.name = plan.plan.name;
        });
      });
    }
  }
} 
