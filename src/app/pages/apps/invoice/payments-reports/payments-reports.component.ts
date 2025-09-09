import { Component, AfterViewInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { InvoiceService } from 'src/app/services/apps/invoice/invoice.service';
import { MatDialog } from '@angular/material/dialog';
import { AppConfirmDeleteDialogComponent } from '../invoice-list/confirm-delete-dialog.component';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons'; 

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

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private invoiceService: InvoiceService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
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

  showSnackbar(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }
}