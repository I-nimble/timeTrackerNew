import { Component, AfterViewInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { DownloadService } from 'src/app/services/download.service';
import { InvoiceService } from 'src/app/services/apps/invoice/invoice.service';
import { MatDialog } from '@angular/material/dialog';
import { AppConfirmDeleteDialogComponent } from '../invoice-list/confirm-delete-dialog.component';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons'; 
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-payments-reports',
  templateUrl: './payments-reports.component.html',
  imports: [
    CommonModule,
    RouterModule,
    MaterialModule,
    TablerIconsModule,
  ],
})
export class PaymentsReportsComponent implements AfterViewInit {
  reportsList = new MatTableDataSource<any>([]);
  displayedColumns: string[] = ['id', 'created_at', 'status', 'action'];
  reportsUrl: string = 'https://inimble-app.s3.us-east-1.amazonaws.com/reports';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  allowedPaymentsManager: boolean = false;

  constructor(
    private invoiceService: InvoiceService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private http: HttpClient,
    private downloadService: DownloadService
  ) {}

  ngOnInit(): void {
    const email = localStorage.getItem('email') || '';
    this.allowedPaymentsManager = environment.allowedPaymentsEmails.includes(email);
    this.loadReports();
  }

  ngAfterViewInit(): void {
    this.reportsList.paginator = this.paginator;
    this.reportsList.sort = this.sort;
  }

  loadReports(): void {
    this.invoiceService.getReportsList().subscribe({
      next: (reports) => {
        this.reportsList.data = reports;
      },
      error: () => {
        this.showSnackbar('Error loading payment reports.');
      },
    });
  }

  deleteReport(id: number): void {
    if (this.allowedPaymentsManager) return;
    const dialogRef = this.dialog.open(AppConfirmDeleteDialogComponent);

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.invoiceService.deleteReport(id).subscribe({
          next: () => {
            this.showSnackbar('Report deleted successfully!');
            this.loadReports();
          },
          error: () => {
            this.showSnackbar('Error deleting report.');
          },
        });
      }
    });
  }

  onFileSelected(event: any): void {
    if (this.allowedPaymentsManager) return;
    const file: File = event.target.files[0];
    if (file) {
        const reportData = { file };
        this.invoiceService.submitReport({ file }).subscribe({
        next: () => {
            this.showSnackbar('Report uploaded successfully!');
            this.loadReports();
        },
        error: () => {
            this.showSnackbar('Error uploading report.');
        },
        });
    }
  }

  async downloadReport(key: string, reportId: number) {
    if (!key) {
      this.snackBar.open('No report found', 'Close', { duration: 3000 });
      return;
    }

    const url = `${this.reportsUrl}/${key}`;
    try {
      const blob = await this.http.get(url, { responseType: 'blob' }).toPromise();
      if (blob) {
        await this.downloadService.downloadFile(blob, key);
      } else {
        this.snackBar.open('Failed to download report', 'Close', { duration: 3000 });
      }
    } catch (error) {
      this.snackBar.open('Error downloading report', 'Close', { duration: 3000 });
    }

    if (this.allowedPaymentsManager) {
      this.invoiceService.markReportAsSeen(reportId).subscribe({
        next: () => {
          const updated = this.reportsList.data.map(r =>
            r.id === reportId ? { ...r, status: true } : r
          );
          this.reportsList.data = updated;
        },
        error: () => {
          this.showSnackbar('Failed to mark report as seen.');
        },
      });
    }
  }

  
  showSnackbar(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }
}