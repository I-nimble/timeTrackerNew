import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
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

@Component({
  standalone: true,
  selector: 'app-talent-match-tm',
  templateUrl: './talent-match-tm.component.html',
  imports: [
	CommonModule,
	MatCardModule,
	MatTableModule,
	MaterialModule,
	TablerIconsModule
  ],
})

export class AppTalentMatchTmComponent implements OnInit {
  displayedColumns: string[] = [
		'title',
		'actions'
  ];
	applicationId!: number;
	currentApplicationPositionId?: number;
  departments: Department[] = [];
  allPositions: Positions[] = [];
  dataSource = new MatTableDataSource<Positions>([]);

  constructor(
		private positionsService: PositionsService,
		private departmentsService: DepartmentsService,
		private employeesService: EmployeesService,
		private applicationsService: ApplicationsService,
		private snackBar: MatSnackBar,
		private router: Router
  ) {}

  ngOnInit(): void {
		this.loadDepartments();
  }

  getPositions(): void {
		this.positionsService.get().subscribe({
			next: (positions: any[]) => {
				this.dataSource.data = positions;
			},
			error: err => {
				console.error('Error loading positions', err);
			}
		});
  }

  loadDepartments(): void {
		this.departmentsService.get().subscribe({
			next: (departments: Department[]) => {
				this.departments = departments;
				this.loadPositions();
			},
			error: err => console.error('Error loading departments', err)
		});
  }

  loadPositions(): void {
	this.positionsService.get().subscribe({
		next: (positions: Positions[]) => {
			this.allPositions = positions;
			this.filterPositionsByCurrentPosition();
		},
		error: err => console.error('Error loading positions', err)
		});
  }

	filterPositionsByCurrentPosition(): void {
		const userId = Number(localStorage.getItem('id'));
		this.applicationsService.getUserApplication(userId).subscribe({
			next: (application: any) => {
				if (!application) {
					console.warn('No application found for user');
					this.dataSource.data = [];
					return;
				}
				this.applicationId = application.id;
				this.currentApplicationPositionId = application.position_id;
				const currentPosition = application.current_position;
				if (!currentPosition) {
					console.warn('No current_position found for user');
					this.dataSource.data = [];
					return;
				}

				const allowedDepartmentIds = this.getAllowedDepartmentIds(currentPosition);

				this.dataSource.data = this.allPositions.filter((p: any) => {
					const deptId = p.department_id ?? p.department?.id ?? null;
					return deptId && allowedDepartmentIds.includes(Number(deptId));
				});
			},
			error: err => {
				console.error('Error fetching user application', err);
				this.dataSource.data = [];
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
		if (currentPosition === 'Technology') {
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
				this.currentApplicationPositionId = updatedApp.position_id;
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

  openSnackBar(message: string, action: string): void {
    this.snackBar.open(message, action, {
      duration: 2000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }
}