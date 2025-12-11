import { Component, OnInit } from '@angular/core';
import { SelectionModel } from '@angular/cdk/collections';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { ApplicationsService } from 'src/app/services/applications.service';
import { InterviewsService } from 'src/app/services/interviews.service';
import { environment } from 'src/environments/environment';
import { CompaniesService } from 'src/app/services/companies.service';
import { PositionsService } from 'src/app/services/positions.service';
import { MatDialog } from '@angular/material/dialog';
import { AddCandidateDialogComponent } from './new-candidate-dialog/add-candidate-dialog.component'; 
import { MatSnackBar } from '@angular/material/snack-bar';
import { ModalComponent } from 'src/app/components/confirmation-modal/modal.component';
import { PermissionService } from 'src/app/services/permission.service';
import { AppCodeViewComponent } from 'src/app/components/code-view/code-view.component';
import { Router } from '@angular/router';
import { Highlight, HighlightAuto } from 'ngx-highlightjs';
import { HighlightLineNumbers } from 'ngx-highlightjs/line-numbers';
import { DepartmentsService } from 'src/app/services/departments.service';
import { EmployeesService } from 'src/app/services/employees.service';
import { DiscProfilesService } from 'src/app/services/disc-profiles.service';
import { FormatNamePipe } from 'src/app/pipe/format-name.pipe';

export interface PeriodicElement {
  id: number;
  imagePath: string;
  uname: string;
  position: string;
  productName: string;
  budget: number;
  priority: string;
}

@Component({
  standalone: true,
  selector: 'app-talent-match-admin',
  styleUrls: ['./talent-match-admin.component.scss'],
  imports: [
    MatCardModule,
    MatTableModule,
    CommonModule,
    MatCheckboxModule,
    MatDividerModule,
    Highlight,
    HighlightAuto,
    HighlightLineNumbers,
    AppCodeViewComponent,
    MaterialModule,
    TablerIconsModule,
    FormatNamePipe
  ],
  templateUrl: './talent-match-admin.component.html',
})
export class AppTalentMatchAdminComponent implements OnInit {
  displayedColumns: string[] = [
    // 'select',
    'name',
    'personality profile',
    'trainings',
    'rate',
    'status',
    'interviewing on',
    'actions',
  ];
  dataSource = new MatTableDataSource<any>([]);
  selection = new SelectionModel<any>(true, []);
  applicationsData: any[] = [];
  interviews: any[] = [];
  picturesUrl: string = 'https://inimble-app.s3.us-east-1.amazonaws.com/photos';
  resumesUrl: string = 'https://inimble-app.s3.us-east-1.amazonaws.com/resumes';
  assetsPath: string = environment.assets + '/default-user-profile-pic.webp';
  companiesData: any[] = [];
  positions: any[] = [];
  departments: any[] = [];
  userRole = localStorage.getItem('role');
  canManage: boolean = false;
  canEdit: boolean = false;
  canDelete: boolean = false;
  
  constructor(
    private applicationService: ApplicationsService,
    private interviewsService: InterviewsService,
    private companiesService: CompaniesService,
    private positionsService: PositionsService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private permissionService: PermissionService,
    private router: Router,
    private departmentsService: DepartmentsService,
    private employeesService: EmployeesService,
    private discProfilesService: DiscProfilesService
  ) { }
  
  
  ngOnInit(): void {
    this.getPositions();
    this.getInterviews();
    this.getDepartments();

    const userId = Number(localStorage.getItem('id'));
    this.permissionService.getUserPermissions(userId).subscribe({
      next: (userPerms: any) => {
        const effective = userPerms.effectivePermissions || [];
        this.canManage = effective.includes('talent-match.manage');
        this.canEdit = effective.includes('talent-match.edit');
        this.canDelete = effective.includes('talent-match.delete');
        this.getApplications();
      },
      error: (err) => {
        console.error('Error fetching user permissions', err);
        this.canManage = false;
        this.getApplications();
      },
    });
  }

  getPositions() {
    this.positionsService.get().subscribe({
      next: (positions: any) => {
        this.positions = positions;
      },
      error: (err: any) => {
        console.error('Error fetching positions:', err);
      },
    });
  }

  getDepartments() {
    this.departmentsService.get().subscribe({
      next: (departments: any) => {
        this.departments = departments;
      },
      error: (err: any) => {
        console.error('Error fetching departments:', err);
      },
    });
  }

  getApplications() {
    this.companiesService.getCompanies().subscribe({
      next: (companies) => {
        this.companiesData = companies;
      },
      error: (err) => {
        console.error('Error fetching companies:', err);
      },
    });

    this.applicationService.get(true).subscribe({
      next: (applications: any[]) => {
        if (this.canManage) {
          this.applicationsData = applications;
          this.dataSource.data = applications;
          return;
        }
        const userId = Number(localStorage.getItem('id'));
        const proceedWithFiltering = () => {
          const lsKeys = ['position_id', 'positionId', 'position'];
          let userPositionId: any = null;
          for (const k of lsKeys) {
            const v = localStorage.getItem(k);
            if (v) {
              const n = Number(v);
              userPositionId = isNaN(n) ? v : n;
              break;
            }
          }
          const handlePositionId = (posId: any) => {
            const userPosition = this.positions.find((p: any) => p.id == posId);
            const userDepartmentId = userPosition?.department_id ?? userPosition?.department?.id ?? null;
            if (!userDepartmentId) {
              this.applicationsData = [];
              this.dataSource.data = [];
              return;
            }
            const allowedPositionIds = this.positions
              .filter((p: any) => (p.department_id ?? p.department?.id) == userDepartmentId)
              .map((p: any) => p.id);
            const filtered = applications.filter((a: any) => allowedPositionIds.includes(a.position ?? a.position_id));
            this.applicationsData = filtered;
            this.dataSource.data = filtered;
          };
          if (userPositionId) {
            handlePositionId(userPositionId);
            return;
          }
          this.employeesService.getById(userId).subscribe({
            next: (employeeRaw: any) => {
              const employee = Array.isArray(employeeRaw) ? employeeRaw[0] : employeeRaw;
              const posId = employee?.position?.id ?? employee?.position ?? employee?.position_id ?? employee?.positionId ?? null;
              if (posId) {
                handlePositionId(posId);
                return;
              }
              const nested = employee?.user ?? {};
              const nestedPos = nested?.position?.id ?? nested?.position ?? nested?.position_id ?? nested?.positionId ?? null;
              if (nestedPos) {
                handlePositionId(nestedPos);
                return;
              }
              this.applicationsData = [];
              this.dataSource.data = [];
            },
            error: (err: any) => {
              console.error('Error fetching employee:', err);
              this.applicationsData = [];
              this.dataSource.data = [];
            },
          });
        };
        if (this.positions && this.positions.length > 0) {
          proceedWithFiltering();
        } else {
          this.positionsService.get().subscribe({
            next: (positions: any[]) => {
              this.positions = positions;
              proceedWithFiltering();
            },
            error: (err: any) => {
              console.error('Error fetching positions:', err);
              this.applicationsData = [];
              this.dataSource.data = [];
            },
          });
        }
      },
      error: (err: any) => {
        console.error('Error fetching applications:', err);
      },
    });
  }
  
  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  getInterviews() {
    this.interviewsService.get().subscribe({
      next: interviews => {
        this.interviews = interviews;
      },
    });
  }

  getInterviewDateTime(applicationId: number) {
    const interview = this.interviews.find(
      (interview) => interview.application_id === applicationId
    );
    if (interview) {
      return interview.date_time;
    }
    return null;
  }

  getPositionTitle(positionId: any) {
    return this.positions.find((p: any) => p.id == positionId)?.title;
  }

  handleImageError(event: Event) {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = this.assetsPath;

    imgElement.onerror = null;
  }

  getPositionById(positionId: any): any {
    return this.positions.find((p: any) => p.id == positionId);
  }

  getDiscProfileColor(profileName: string): string {
    return this.discProfilesService.getDiscProfileColor(profileName);
  }

  openAddCandidateDialog(): void {
    const dialogRef = this.dialog.open(AddCandidateDialogComponent, {
      width: '600px',
      data: { companies: this.companiesData }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'success') {
        this.getApplications();
      }
    });
  }

  openEditCandidateDialog(candidate: any): void {
    const dialogRef = this.dialog.open(AddCandidateDialogComponent, {
      width: '600px',
      data: {
        candidate, 
        companies: this.companiesData,
        action: 'edit'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'success') {
        this.getApplications();
      }
    });
  }

  openCandidateResume(resumeUrl: string) {
    if(!resumeUrl) {
      this.openSnackBar('No resume found for this candidate', 'Close');
      return;
    }
    const url = this.applicationService.getResumeUrl(resumeUrl);
    window.open(url, '_blank');
  }

  deleteCandidate(id: number) {
    const dialogRef = this.dialog.open(ModalComponent, {
      width: '400px',
      data: {
        action: 'Delete',
        subject: 'candidate',
      },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.applicationService.delete(id).subscribe({
          next: () => {
            this.getApplications();
          },
          error: (err) => {
            this.openSnackBar('Error deleting candidate', 'Close');
          },
        });
      }
    });
  }

  goToCandidate(id: number, event: MouseEvent) {
    event.stopPropagation();
    this.router.navigate([`apps/talent-match/${id}`]);
  }

  openSnackBar(message: string, action: string) {
    this.snackBar.open(message, action, {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }
}
