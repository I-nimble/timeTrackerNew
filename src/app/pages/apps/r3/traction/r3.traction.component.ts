import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatLabel } from '@angular/material/form-field';
import { MatDivider } from '@angular/material/divider';
import { R3Service } from 'src/app/services/r3.service';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CompaniesService } from 'src/app/services/companies.service';
import { EmployeesService } from 'src/app/services/employees.service';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
  selector: 'app-r3-traction',
  templateUrl: './r3.traction.component.html',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTabsModule,
    MatSelectModule,
    MatOptionModule,
    MatLabel,
    MatDivider,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ]
})
export class R3TractionComponent implements OnInit {
  form!: FormGroup;
  users: any[] = [];
  companies: any[] = [];
  deletedAnnualGoalIds: number[] = [];
  deletedRockIds: number[] = [];
  today = new Date();

  constructor(
    private fb: FormBuilder,
    private r3Service: R3Service,
    public snackBar: MatSnackBar,
    private companiesService: CompaniesService,
    private employeesService: EmployeesService,
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.getCompany();
    this.loadData();
  }

  getCompany(): Promise<void> {
    const role = localStorage.getItem('role');
    return new Promise((resolve) => {
      if (role === '3') {
        this.companiesService.getByOwner().subscribe((company: any) => {
          this.getUsers(company.company_id).then(() => resolve());
        });
      } else if (role === '2') {
        this.employeesService.getByEmployee().subscribe((employee: any) => {
          this.getUsers(employee.company_id).then(() => resolve());
        });
      } else if (role === '1') {
        this.companiesService.getCompanies().subscribe((companies: any) => {
          this.companies = companies;
          if (this.form.value.oneYearPlan?.company_id) {
            const company = companies.find((c: any) => c.id === this.form.value.oneYearPlan.company_id);
            this.getUsers(company.id).then(() => resolve());
          } else {
            this.getUsers().then(() => resolve());
          }
        });
      }
    });
  }

  getUsers(companyId?: number): Promise<void> {
    return new Promise((resolve) => {
      if (companyId) {
        this.companiesService.getEmployees(companyId).subscribe((employees: any) => {
          this.users = employees.map((e: any) => e.user);

          this.companiesService.getEmployer(companyId).subscribe((employer: any) => {
            this.users.push(employer.user);
            this.users.sort((a, b) => a.name.localeCompare(b.name));
            resolve();
          });
        });
      } else {
        this.employeesService.getOrphanEmployees().subscribe((orphans: any[]) => {
          this.users = orphans.map((o: any) => o.user);
          this.users.sort((a, b) => a.name.localeCompare(b.name));
          resolve();
        });
      }
    });
  }

  buildForm() {
    this.form = this.fb.group({
      oneYearPlan: this.fb.group({
        id: [null],
        future_date: [null],
        revenue: [
          '',
          [
            Validators.min(0)
          ]
        ],
        net_margin: [
          '',
          [
            Validators.min(0),
            Validators.max(100)
          ]
        ]
      }),
      annualGoals: this.fb.array([]),
      rocks: this.fb.array([])
    });
  }

  get annualGoals(): FormArray {
    return this.form.get('annualGoals') as FormArray;
  }

  get rocks(): FormArray {
    return this.form.get('rocks') as FormArray;
  }

  async loadData() {
    const data: any = await this.r3Service.getR3Module().toPromise();
    if (!data) return;
    await this.getCompany();
    const traction = data.traction?.[0];
    if (traction) {
      this.annualGoals.clear();
      this.form.get('oneYearPlan')?.patchValue({
        id: traction.id,
        future_date: traction.future_date || '',
        revenue: traction.revenue || '',
        net_margin: traction.net_margin || ''
      });
      traction.r3_annual_goals?.forEach((g: any) => this.addAnnualGoal(g));
    }
    this.rocks.clear();
    data.rocks?.forEach((r: any) => {
      if (r.assigned_user_id && !this.users.find(u => u.id === r.assigned_user_id)) {
        this.users.push({ id: r.assigned_user_id, name: 'Unknown' });
      }
      this.addRock(r);
    });
  }

  addAnnualGoal(goal: any = null) {
    this.annualGoals.push(
      this.fb.group({
        id: [goal?.id || null],
        goal_text: [goal?.goal_text || '', Validators.required]
      })
    );
  }

  addRock(rock: any = null) {
    this.rocks.push(
      this.fb.group({
        id: [rock?.id || null],
        title: [rock?.title || '', Validators.required],
        assigned_user_id: [rock?.assigned_user_id || null]
      })
    );
  }

  removeAnnualGoal(i: number) {
    const id = this.annualGoals.at(i).value.id;
    if (id) this.deletedAnnualGoalIds.push(id);
    this.annualGoals.removeAt(i);
  }

  removeRock(i: number) {
    const id = this.rocks.at(i).value.id;
    if (id) this.deletedRockIds.push(id);
    this.rocks.removeAt(i);
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const body = {
      traction: [
        {
          ...this.form.value.oneYearPlan,
          annual_goals: this.form.value.annualGoals,
        }
      ],
      rocks: this.form.value.rocks,
      deleted_annual_goal_ids: this.deletedAnnualGoalIds,
      deleted_rock_ids: this.deletedRockIds
    };
    this.r3Service.saveTraction(body).subscribe(() => {
      this.openSnackBar('Traction saved!', 'close');
      this.deletedAnnualGoalIds = [];
      this.deletedRockIds = [];
      this.loadData();
    });
  }

  openSnackBar(message: string, action: string): void {
    this.snackBar.open(message, action, {
      duration: 2000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }
}