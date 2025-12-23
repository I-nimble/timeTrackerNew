import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/material.module';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { R3Service } from 'src/app/services/r3.service';
import { FormBuilder, FormsModule, FormGroup, FormControl, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatLabel } from '@angular/material/form-field';
import { MatDivider } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CompaniesService } from 'src/app/services/companies.service';
import { EmployeesService } from 'src/app/services/employees.service';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';
import { catchError, of } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-r3-action',
  standalone: true,
  templateUrl: './r3.action.component.html',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
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
    MaterialModule,
    MatTableModule,
  ],
})
export class R3ActionComponent implements OnInit {
  rocks: any[] = [];
  users: any[] = [];
  deleted_rock_ids: number[] = [];
  deleted_rock_item_ids: number[] = [];
  isEditing = false;
  loading = false;

  constructor(
    private r3Service: R3Service,
    public snackBar: MatSnackBar,
    private companiesService: CompaniesService,
    private employeesService: EmployeesService,
    private cd: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadAll();
  }

  async loadAll() {
    this.loading = true;
    try {
      await this.getCompany();
      const data: any = await this.r3Service.getR3Module().toPromise();
      this.mapRocks(data?.rocks || []);
    } catch (err) {
      console.error('Error loading Action module', err);
    } finally {
      this.loading = false;
    }
  }

  private mapRocks(rocksFromBackend: any[]) {
    this.rocks = (rocksFromBackend || []).map(r => {
      const items = (r.r3_rock_items || []).map((it: any) => ({
        id: it.id || null,
        subtask: it.subtask || '',
        date: it.date || '',
        metric: it.metric || ''
      }));
      if (r.assigned_user_id && !this.users.find(u => u.id === r.assigned_user_id)) {
        this.users.push({ id: r.assigned_user_id, name: 'Unknown', last_name: '' });
        this.users.sort((a, b) => this.fullName(a).localeCompare(this.fullName(b)));
      }
      return {
        id: r.id || null,
        one_year_plan_id: r.one_year_plan_id || null,
        title: r.title || '',
        assigned_user_id: r.assigned_user_id || null,
        rock_items: items
      };
    });
    if (this.rocks.length === 0) {
    }
  }

  getCompany(): Promise<void> {
    const role = localStorage.getItem('role');
    return new Promise((resolve) => {
      if (role === '3') {
        this.companiesService.getByOwner().subscribe((company: any) => {
          this.getUsers(company.company_id).then(() => resolve());
        }, () => resolve());
      } else if (role === '2') {
        this.employeesService.getByEmployee().subscribe((employee: any) => {
          this.getUsers(employee.company_id).then(() => resolve());
        }, () => resolve());
      } else if (role === '1') {
        this.companiesService.getCompanies().subscribe((companies: any) => {
          if (companies?.length) {
            const company = companies[0];
            this.getUsers(company.id).then(() => resolve());
          } else {
            this.getUsers().then(() => resolve());
          }
        }, () => {
          this.getUsers().then(() => resolve());
        });
      } else {
        this.getUsers().then(() => resolve());
      }
    });
  }

  getUsers(companyId?: number): Promise<void> {
    return new Promise((resolve) => {
      if (companyId) {
        this.companiesService.getEmployees(companyId).subscribe((employees: any) => {
          this.users = employees.map((e: any) => e.user || e);
          this.companiesService.getEmployer(companyId).subscribe((employer: any) => {
            if (employer?.user) this.users.push(employer.user);
            this.users = this.uniqueUsers(this.users);
            this.users.sort((a, b) => this.fullName(a).localeCompare(this.fullName(b)));
            resolve();
          }, () => {
            this.users = this.uniqueUsers(this.users);
            this.users.sort((a, b) => this.fullName(a).localeCompare(this.fullName(b)));
            resolve();
          });
        }, () => {
          this.employeesService.getOrphanEmployees().subscribe((orphans: any[]) => {
            this.users = orphans.map((o: any) => o.user || o);
            this.users.sort((a, b) => this.fullName(a).localeCompare(this.fullName(b)));
            resolve();
          }, () => resolve());
        });
      } else {
        this.employeesService.getOrphanEmployees().subscribe((orphans: any[]) => {
          this.users = orphans.map((o: any) => o.user || o);
          this.users = this.uniqueUsers(this.users);
          this.users.sort((a, b) => this.fullName(a).localeCompare(this.fullName(b)));
          resolve();
        }, () => resolve());
      }
    });
  }

  private uniqueUsers(list: any[]) {
    const map = new Map<number, any>();
    list.forEach(u => { if (u && u.id != null) map.set(u.id, u); });
    return Array.from(map.values());
  }

  fullName(u: any) {
    if (!u) return '';
    const n = (u.name || '').trim();
    const ln = (u.last_name || u.lastName || '').trim();
    return (n + (ln ? ' ' + ln : '')).trim() || (u.email || 'Unknown');
  }

  addRock() {
    this.rocks.push({
      id: null,
      one_year_plan_id: null,
      title: '',
      assigned_user_id: null,
      rock_items: []
    });
  }

  deleteRock(rockIndex: number) {
    const rock = this.rocks[rockIndex];
    if (!rock) return;
    if (rock.id) this.deleted_rock_ids.push(rock.id);
    rock._deleted = true;
    this.cd.detectChanges();
  }

  addSubtaskByRock(rock: any) {
    if (!rock.rock_items) rock.rock_items = [];
    rock.rock_items.push({ id: null, subtask: '', date: '', metric: '' });
    rock.rock_items = [...rock.rock_items];
  }

  deleteSubtaskByRock(rock: any, subIndex: number) {
    const item = rock.rock_items[subIndex];
    if (!item) return;
    if (item.id) this.deleted_rock_item_ids.push(item.id);
    rock.rock_items.splice(subIndex, 1);
    rock.rock_items = [...rock.rock_items];
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      this.loadAll();
      this.deleted_rock_ids = [];
      this.deleted_rock_item_ids = [];
    }
  }

  saveChanges() {
    const payloadRocks = this.rocks.map(r => ({
      id: r.id,
      one_year_plan_id: r.one_year_plan_id,
      title: r.title,
      assigned_user_id: r.assigned_user_id,
      rock_items: (r.rock_items || []).map((it: any) => ({
        id: it.id,
        subtask: it.subtask,
        date: it.date,
        metric: it.metric
      }))
    }));

    this.loading = true;
    this.r3Service.saveAction(payloadRocks, this.deleted_rock_ids, this.deleted_rock_item_ids)
      .pipe(
        catchError(err => {
          console.error('Save action failed', err);
          return of(null);
        })
      )
      .subscribe((res: any) => {
        this.loading = false;
        this.deleted_rock_ids = [];
        this.deleted_rock_item_ids = [];
        this.isEditing = false;
        this.loadAll();
        this.openSnackBar('Rocks saved!', 'close');
      });
  }

  get displayedColumns(): string[] {
    const cols = ['subtask', 'date', 'metric'];
    if (this.isEditing) cols.push('actions');
    return cols;
  }

  getUserDisplayName(userId: number | null) {
    const u = this.users.find(x => x.id === userId);
    return u ? this.fullName(u) : (userId ? 'Unknown' : '');
  }

  openSnackBar(message: string, action: string): void {
    this.snackBar.open(message, action, {
      duration: 2000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }
}