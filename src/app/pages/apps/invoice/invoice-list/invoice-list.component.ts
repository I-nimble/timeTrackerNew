import {
  Component,
  AfterViewInit,
  ViewChild,
  Signal,
  signal,
} from '@angular/core';
import { InvoiceService } from 'src/app/services/apps/invoice/invoice.service';
import { InvoiceList } from '../invoice';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { MaterialModule } from 'src/app/material.module';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TablerIconsModule } from 'angular-tabler-icons';
import { RouterModule } from '@angular/router';
import { AppConfirmDeleteDialogComponent } from './confirm-delete-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StripeService } from 'src/app/services/stripe.service';
import { CompaniesService } from 'src/app/services/companies.service';
import { StripeComponent } from 'src/app/components/stripe/stripe.component';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';

@Component({
  selector: 'app-invoice-list',
  templateUrl: './invoice-list.component.html',
  styleUrls: ['./invoice-list.component.scss'],
  imports: [
    MaterialModule,
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    TablerIconsModule,
    StripeComponent,
  ]
})
export class AppInvoiceListComponent implements AfterViewInit {
  role: any = localStorage.getItem('role');
  allComplete = signal<boolean>(false);
  invoiceList = new MatTableDataSource<any>([]);
  activeTab = signal<string>('All');
  displayedColumns: string[] = [];
  companies: any[] = [];
  companyMap: { [key: number]: string } = {};
  paidInvoices = signal<any[]>([]);
  pendingInvoices = signal<any[]>([]);
  overdueInvoices = signal<any[]>([]);
  selectedCompanyId = signal<number | null>(null);
  allowedPaymentsManager: boolean = false;
  allowedReportsManager: boolean = false;
  startDate: Date | null = null;
  endDate: Date | null = null;

  @ViewChild(MatSort) sort: MatSort = Object.create(null);
  @ViewChild(MatPaginator) paginator: MatPaginator = Object.create(null);

  constructor(
    private invoiceService: InvoiceService, 
    private dialog: MatDialog, 
    private snackBar: MatSnackBar, 
    private stripeService: StripeService, 
    private companiesService: CompaniesService,
    public router: Router,
  ) { }

  ngOnInit(): void {
    const allowedPaymentsEmails = environment.allowedPaymentsEmails;
    const allowedReportsEmails = environment.allowedReportEmails;
    const email = localStorage.getItem('email');
    this.allowedReportsManager = this.role === '2' && allowedReportsEmails.includes(email || '');
    this.allowedPaymentsManager = this.role === '2' && allowedPaymentsEmails.includes(email || '');
    if (this.role == '3' || this.allowedPaymentsManager == true) {
      this.displayedColumns = [
        'paymentDate',
        'amount',
        'status',
        'action',
      ];
    } else {
      this.displayedColumns = [
        'paymentDate',
        'client',
        'amount',
        'status',
        'action',
      ];
    }
    this.companiesService.getCompanies().subscribe({
      next: (companies: any[]) => {
        this.companies = companies;
        this.companyMap = {};
        companies.forEach(c => this.companyMap[c.id] = c.name);
      }
    });

    this.loadInvoices();
  }

  ngAfterViewInit(): void {
    this.invoiceList.paginator = this.paginator;
    this.invoiceList.sort = this.sort;
  }

  onDateRangeChange(): void {
    if (this.startDate && this.endDate) {
      this.filterInvoices();
    }
  }

  onRowClick(row: any, event: MouseEvent): void {
    if ((event?.target as HTMLElement).parentElement?.classList.contains('actions-btn')) {
      return;
    }
    if(this.role == '1' || this.allowedPaymentsManager) {
      this.router.navigate(['/apps/editinvoice', row.id]);
      return;
    }
    this.router.navigate(['/apps/viewinvoice', row.id]);
  }

  downloadInvoice(id: number, format: string): void {
    this.invoiceService.getInvoiceFile(id, format).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `invoice-${id}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
        document.body.appendChild(link);
        link.click();
        
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
      },
      error: (err) => {
        console.error('Error downloading invoice:', err);
      },
    });
  }

  generateInvoice(): void {
    if(!this.selectedCompanyId() || !this.startDate || !this.endDate) {
      this.showSnackbar('Please select a company and a date range');
      return;
    }

    this.invoiceService.createInvoice({
      company_id: this.selectedCompanyId(),
      billing_period_start: this.startDate,
      billing_period_end: this.endDate,
    }).subscribe({
      next: (response: any) => {
        this.selectedCompanyId.set(null);
        this.startDate = null;
        this.endDate = null;
        this.invoiceList.data.push(response);
        this.activeTab.set('All');
        this.loadInvoices();
      },
      error: (err: any) => {
        console.error('Error creating invoice:', err);
      },
    });
  }

  handleTabClick(tab: string): void {
    this.activeTab.set(tab);
    this.filterInvoices();
  }

  filterInvoices(): void {
    const currentTab = this.activeTab();
    let filteredInvoices: any[] = [];

    if (currentTab === 'All') {
      filteredInvoices = [
        ...this.paidInvoices(), 
        ...this.pendingInvoices(), 
        ...this.overdueInvoices(),
        ...this.invoiceList.data.filter((inv: any) => inv.status.name === 'Draft')
      ];
    } else if (currentTab === 'Paid') {
      filteredInvoices = [...this.paidInvoices()];
    } else if (currentTab === 'Pending') {
      filteredInvoices = [...this.pendingInvoices()];
    }
    else if (currentTab === 'Overdue') {
      filteredInvoices = [...this.overdueInvoices()];
    }

    if (this.selectedCompanyId() !== null) {
      filteredInvoices = filteredInvoices.filter(
        invoice => invoice.user?.company?.id === this.selectedCompanyId()
      );
    } 

    if (this.startDate && this.endDate) {
      const [start, end] = [this.startDate, this.endDate].map(d => new Date(d).setHours(0,0,0,0));
      filteredInvoices = filteredInvoices.filter((invoice: any) => {
        const dueDate = new Date(invoice.due_date).setHours(0,0,0,0);
        return dueDate >= start && dueDate <= end;
      });
    }

    this.invoiceList.data = filteredInvoices;
    this.updateAllComplete();
  }

  private loadInvoices(): void {
    this.invoiceService.getInvoiceList().subscribe((invoices) => {
      this.paidInvoices.set(invoices.filter((invoice: any) => invoice.status.name === 'Paid'));
      this.pendingInvoices.set(invoices.filter((invoice: any) => invoice.status.name === 'Pending'));
      this.overdueInvoices.set(invoices.filter((invoice: any) => invoice.status.name === 'Overdue'));

      this.invoiceList = new MatTableDataSource(invoices);
      this.invoiceList.paginator = this.paginator;
      this.invoiceList.sort = this.sort;
    });
  }

  updateAllComplete(): void {
    const allInvoices = this.invoiceList.data;
    this.allComplete.set(
      allInvoices.length > 0 && allInvoices.every((t) => t.completed)
    );
  }

  someComplete(): boolean {
    return (
      this.invoiceList.data.filter((t) => t.completed).length > 0 &&
      !this.allComplete()
    );
  }

  setAll(completed: boolean): void {
    this.allComplete.set(completed);
    this.invoiceList.data.forEach((t) => (t.completed = completed));
    this.invoiceList._updateChangeSubscription();
  }

  countInvoicesByStatus(status: string): number {
    return this.paidInvoices().filter((invoice) => invoice.status === status)
      .length;
  }


  deleteInvoice(id: number): void {
    const dialogRef = this.dialog.open(AppConfirmDeleteDialogComponent);

    dialogRef.afterClosed().subscribe((result: any) => {
      this.loadInvoices();
      if (result) {
        this.invoiceService.deleteInvoice(id).subscribe({
          next: () => {
            this.loadInvoices();
            this.filterInvoices();
            this.showSnackbar('Invoice deleted successfully!');
          },
          error: () => {
            this.showSnackbar('Error deleting invoice.');
          }
        });
      }
    });
  }

  sendToClient(id: number): void {
    this.invoiceService.approveInvoice(id).subscribe({
      next: () => {
        this.showSnackbar('Invoice sent to client successfully!');
        this.invoiceList.data.forEach((invoice: any) => {
          if (invoice.id === id) {
            invoice.status = {
              id: 2,
              name: 'Pending',
            };
          }
        });
      },
      error: () => {
        this.showSnackbar('Error sending invoice to client.');
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

  mapStatus(statusId: number): string {
    switch (statusId) {
      case 1:
        return 'Paid';
      case 2:
        return 'Pending';
      case 3:
        return 'Shipped';
      default:
        return 'Unknown';
    }
  }

  handleCompanySelection(event: any): void {
    const companyId = event.value;
    this.selectedCompanyId.set(companyId);
    this.filterInvoices();
  }
}
