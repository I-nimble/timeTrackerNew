import {
  Component,
  ViewChild,
  signal,
} from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { MaterialModule } from 'src/app/material.module';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TablerIconsModule } from 'angular-tabler-icons';
import { RouterModule } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApplicationsService } from 'src/app/services/applications.service';
import { StripeComponent } from 'src/app/components/stripe/stripe.component';
import { Router } from '@angular/router';
import { PositionsService } from 'src/app/services/positions.service';
import { ModalComponent } from 'src/app/components/confirmation-modal/modal.component';
import { CompaniesService } from 'src/app/services/companies.service';
import { PermissionService } from 'src/app/services/permission.service';
import { DiscProfilesService } from 'src/app/services/disc-profiles.service';
import { RejectionDialogComponent } from './rejection-dialog/rejection-dialog.component';

@Component({
  selector: 'app-rejected',
  imports: [
    MaterialModule,
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    TablerIconsModule,
    StripeComponent,
  ],
  templateUrl: './rejected.component.html',
  styleUrl: './rejected.component.scss'
})
export class RejectedComponent {
  role: any = localStorage.getItem('role');
  candidatesList = new MatTableDataSource<any>([]);
	rejectedCandidates: any[] = [];
  displayedColumns: string[] = [];
  startDate: Date | null = null;
  endDate: Date | null = null;
  positions = signal<any[]>([]);
  companiesData: any[] = [];
  canView: boolean = false;
  canManage: boolean = false;
  canEdit: boolean = false;
	canDelete: boolean = false;

  @ViewChild(MatSort) sort: MatSort = Object.create(null);
  @ViewChild(MatPaginator) paginator: MatPaginator = Object.create(null);

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    public router: Router,
    private applicationsService: ApplicationsService,
    private positionsService: PositionsService,
    private companiesService: CompaniesService,
    private permissionService: PermissionService,
    private discProfilesService: DiscProfilesService
  ) { }

  ngOnInit(): void {
    this.loadCandidates();
    this.loadPositions();

    this.companiesService.getCompanies().subscribe({
      next: companies => {
        this.companiesData = companies;
      },
    });

    const userId = Number(localStorage.getItem('id'));
    this.permissionService.getUserPermissions(userId).subscribe({
      next: (userPerms: any) => {
        const effective = userPerms.effectivePermissions || [];
        this.canManage = effective.includes('rejected.manage');
        this.canEdit = effective.includes('rejected.edit');
        this.canView = effective.includes('rejected.view');
				this.canDelete = effective.includes('rejected.delete');

        if (this.role != '1' && !this.canView) {
          this.router.navigate(['/dashboard']);
        }

        if (this.role == '1' || this.canView) {
          this.displayedColumns = [
            'name',
            'position',
            'skills',
            'location',
            'submission_date',
            'rejection_reason',
            'actions',
          ];
        } else {
          this.displayedColumns = [
            'name',
            'skills',
            'location',
            'submission_date',
            'rejection_reason',
            'actions',
          ];
        }
      },
      error: (err) => {
        console.error('Error fetching user permissions', err);
      },
    });
  }

  ngAfterViewInit(): void {
    this.candidatesList.paginator = this.paginator;
    this.candidatesList.sort = this.sort;
  }
	
  onDateRangeChange(): void {
    this.applyFilters();
  }

  private applyFilters(): void {
    let filtered = [...this.rejectedCandidates];
    if (this.startDate && this.endDate) {
      const start = new Date(this.startDate).setHours(0, 0, 0, 0);
      const end = new Date(this.endDate).setHours(23, 59, 59, 999);
      filtered = filtered.filter(c => {
        const submission = new Date(c.submission_date).getTime();
        return submission >= start && submission <= end;
      });
    }
    this.candidatesList.data = filtered;
  }

  loadPositions(): void {
    this.positionsService.get().subscribe({
      next: (positions: any[]) => {
        this.positions.set(positions);
      }
    });
  }

  getPositionName(positionId: number): string {
    const position = this.positions().find((position: any) => position.id === positionId);
    return position ? position.title : '';
  }

  getPositionById(positionId: number): any {
    return this.positions().find((position: any) => position.id === positionId);
  }

  getDiscProfileColor(profileName: string): string {
    return this.discProfilesService.getDiscProfileColor(profileName);
  }

  downloadCandidateInfo(id: number, format: string): void {
    this.applicationsService.getCandidateFile(id, format).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `candidate-${id}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
        document.body.appendChild(link);
        link.click();

        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
      },
      error: (err: any) => {
        console.error('Error downloading candidate info:', err);
      },
    });
  }

  private loadCandidates(): void {
    this.applicationsService.get().subscribe((applications: any[]) => {
      this.rejectedCandidates = applications.filter(a => a.status === 'rejected' || a.status === 6);
      this.applyFilters();
    });
  }

	openRejectDialog(candidate: any): void {
		const dialogRef = this.dialog.open(RejectionDialogComponent, {
			width: '500px',
			data: {
				mode: 'reject',
				candidate: candidate
			}
		});

		dialogRef.afterClosed().subscribe(result => {
			if (result?.success) {
				this.showSnackbar('Reason updated successfully');
				this.loadCandidates();
			}
		});
	}

  deleteApplication(id: number): void {
    const dialogRef = this.dialog.open(ModalComponent, {
      data: {
        action: 'delete',
        type: 'application',
      }
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      this.loadCandidates();
      if (result) {
        this.applicationsService.delete(id).subscribe({
          next: () => {
            this.loadCandidates();
            this.showSnackbar('Invoice deleted successfully!');
          },
          error: () => {
            this.showSnackbar('Error deleting invoice.');
          }
        });
      }
    });
  }

	sendToCandidates(candidate: any) {
		this.applicationsService.sendToCandidates(candidate.id).subscribe({
			next: (res) => {
				console.log('Candidate sent', res);
				this.loadCandidates();
			},
			error: (err) => {
				console.error('Error sending candidate:', err);
			}
		});
	}

  showSnackbar(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }

  goToCandidate(id: number, event: MouseEvent) {
    event.stopPropagation();
    this.router.navigate(['apps/candidates', id]);
  }
}