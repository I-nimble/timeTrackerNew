import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { Router } from '@angular/router';
import { PositionsService } from 'src/app/services/positions.service';
import { DepartmentsService } from 'src/app/services/departments.service';
import { EmployeesService } from 'src/app/services/employees.service';
import { Department } from 'src/app/models/Department.model';
import { Positions } from 'src/app/models/Position.model';
import { ApplicationsService } from 'src/app/services/applications.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DynamicTableComponent } from 'src/app/shared/components/dynamic-table/dynamic-table.component';
import { DynamicTableColumn } from 'src/app/shared/models/dynamic-table.model';
import { TemplateRef, ViewChild } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-talent-match-tm',
  templateUrl: './talent-match-tm.component.html',
  imports: [
	CommonModule,
	MatCardModule,
	MaterialModule,
	TablerIconsModule,
	DynamicTableComponent,
  ],
})

export class AppTalentMatchTmComponent implements OnInit {
	tableColumns: DynamicTableColumn<Positions>[] = [];
	applicationId!: number;
	currentApplicationPositionId?: number;
  departments: Department[] = [];
  allPositions: Positions[] = [];
	rows: Positions[] = [];
  tableLoading = false;

	@ViewChild('applyActionTemplate', { static: true })
	applyActionTemplate!: TemplateRef<any>;

  constructor(
		private positionsService: PositionsService,
		private departmentsService: DepartmentsService,
		private employeesService: EmployeesService,
		private applicationsService: ApplicationsService,
		private snackBar: MatSnackBar,
		private router: Router
  ) {}

  ngOnInit(): void {
		this.initializeColumns();
		this.loadDepartments();
  }

  getPositions(): void {
		this.tableLoading = true;
		this.positionsService.get().subscribe({
			next: (positions: any[]) => {
				this.rows = positions;
				this.tableLoading = false;
			},
			error: err => {
				console.error('Error loading positions', err);
				this.tableLoading = false;
			}
		});
  }

  loadDepartments(): void {
		this.tableLoading = true;
		this.departmentsService.get().subscribe({
			next: (departments: Department[]) => {
				this.departments = departments;
				this.loadPositions();
			},
			error: err => {
				console.error('Error loading departments', err);
				this.rows = [];
				this.tableLoading = false;
			}
		});
  }

  loadPositions(): void {
	this.positionsService.get().subscribe({
		next: (positions: Positions[]) => {
			this.allPositions = positions;
			this.filterPositionsByCurrentPosition();
		},
		error: err => {
			console.error('Error loading positions', err);
			this.rows = [];
			this.tableLoading = false;
		}
		});
  }

	filterPositionsByCurrentPosition(): void {
		const userId = Number(localStorage.getItem('id'));
		this.applicationsService.getUserApplication(userId, { status: 3 }).subscribe({
			next: (application: any) => {
				if (!application) {
					console.warn('No application found for user');
					this.rows = [];
					this.tableLoading = false;
					return;
				}
				this.applicationId = application.id;
				this.currentApplicationPositionId = application.position_id;
				const currentPosition = application.current_position;
				if (!currentPosition) {
					console.warn('No current_position found for user');
					this.rows = [];
					this.tableLoading = false;
					return;
				}

				const allowedDepartmentIds = this.getAllowedDepartmentIds(currentPosition);

				this.rows = this.allPositions.filter((p: any) => {
					const deptId = p.department_id ?? p.department?.id ?? null;
					return deptId && allowedDepartmentIds.includes(Number(deptId));
				});
				this.tableLoading = false;
			},
			error: err => {
				console.error('Error fetching user application', err);
				this.rows = [];
				this.tableLoading = false;
			}
		});
	}


  getAllowedDepartmentIds(currentPosition: string): number[] {
		if (currentPosition === 'Virtual Assistant') {
			return this.departments
			.filter(d =>
				['Legal', 'Administrative', 'Customer Service and Support']
				.includes(d.name ?? '')
			)
			.map(d => d.id!)
			.filter(Boolean);
		}
		if (currentPosition === 'IT and Technology') {
			return this.departments
			.filter(d => d.name === 'IT and Technology')
			.map(d => d.id!)
			.filter(Boolean);
		}
		return [];
  }

	applyForPosition(position: any): void {
		if (!this.applicationId) {
			console.error('Application ID not found');
			return;
		}
		const payload = {
			position_id: position.id,
			current_position: position.department?.name || position.department_name
		};
		this.applicationsService.submit(payload, this.applicationId).subscribe({
			next: updatedApp => {
				// Some responses do not include position_id; fallback to clicked row id.
				this.currentApplicationPositionId = Number(updatedApp?.position_id ?? position?.id);
				this.rows = [...this.rows];
				this.snackBar.open('You successfully applied to this position.', 'Close', {
					duration: 3000
				});
			},
			error: err => {
				console.error('Failed to apply for position', err);
				this.snackBar.open('Failed to apply for position', 'Close', { duration: 3000 });
			}
		});
	}

	isPositionApplied(position: any): boolean {
		if (this.currentApplicationPositionId === undefined || this.currentApplicationPositionId === null) {
			return false;
		}

		return Number(position?.id) === Number(this.currentApplicationPositionId);
	}

  openSnackBar(message: string, action: string): void {
    this.snackBar.open(message, action, {
      duration: 2000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }

	private initializeColumns(): void {
		this.tableColumns = [
			{
				id: 'title',
				header: 'Position',
				accessor: 'title',
				renderer: {
					type: 'text-badges',
					textAccessor: 'title',
					textTransform: (value, row: any) => {
						const description = row?.description ? ` ${row.description}` : '';
						return `${String(value || '')}${description}`.trim();
					},
				},
			},
			{
				id: 'actions',
				header: 'Action',
				headerClass: 'text-center',
				cellClass: 'text-center',
				cellTemplate: this.applyActionTemplate,
			},
		];
	}
}