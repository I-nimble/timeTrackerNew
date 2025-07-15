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

@Component({
    selector: 'app-invoice-list',
    templateUrl: './invoice-list.component.html',
    imports: [
        MaterialModule,
        CommonModule,
        RouterModule,
        FormsModule,
        ReactiveFormsModule,
        TablerIconsModule,
    ]
})
export class AppInvoiceListComponent implements AfterViewInit {
  role: any = localStorage.getItem('role');
  allComplete = signal<boolean>(false);
  invoiceList = new MatTableDataSource<any>([]);
  activeTab = signal<string>('All');
  paidInvoices = signal<any[]>([]);
  searchQuery = signal<string>('');
  displayedColumns: string[] = [];
  companies: any[] = [];
  companyMap: { [key: number]: string } = {};

  @ViewChild(MatSort) sort: MatSort = Object.create(null);
  @ViewChild(MatPaginator) paginator: MatPaginator = Object.create(null);

  constructor(private invoiceService: InvoiceService,private dialog: MatDialog, private snackBar: MatSnackBar, private stripeService: StripeService,private companiesService: CompaniesService,) {}

  ngOnInit(): void {
  if (this.role == '3') {
    this.displayedColumns = [
      'id',
      'paymentDate',
      'amount',
      'status',
      'action',
    ];
  } else {
    this.displayedColumns = [
      'id',
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

  this.invoiceService.getInvoiceList().subscribe((invoices) => {
    this.invoiceList = new MatTableDataSource(invoices);
    this.invoiceList.paginator = this.paginator;
    this.invoiceList.sort = this.sort;
  });
}

  ngAfterViewInit(): void {
    this.invoiceList.paginator = this.paginator;
    this.invoiceList.sort = this.sort;
  }

  handleTabClick(tab: string): void {
    this.activeTab.set(tab);
    this.filterInvoices(); // Filter when tab is clicked
  }

  filter(filterValue: string): void {
    this.searchQuery.set(filterValue);
    this.filterInvoices(); 
  }
  filterInvoices(): void {
    const currentTab = this.activeTab();
    const filteredInvoices = this.paidInvoices().filter((invoice) => {
      const matchesTab = currentTab === 'All' || invoice.status === currentTab;

      // Search filtering
      const matchesSearch =
        invoice.billFrom
          .toLowerCase()
          .includes(this.searchQuery().toLowerCase()) ||
        invoice.billTo.toLowerCase().includes(this.searchQuery().toLowerCase());

      return matchesTab && matchesSearch; // Return true if both conditions are met
    });

    this.invoiceList.data = filteredInvoices; // Update the data source
    this.updateAllComplete();
  }

  updateAllComplete(): void {
    const allInvoices = this.invoiceList.data;
    this.allComplete.set(
      allInvoices.length > 0 && allInvoices.every((t) => t.completed)
    ); // Update the allComplete signal
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
      if (result) {
        this.invoiceService.deleteInvoice(id);
        // this.paidInvoices.set(this.invoiceService.getInvoiceList()); 
        this.filterInvoices(); 
        this.showSnackbar('Invoice deleted successfully!');
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

  getCompanies() {
    this.companiesService.getCompanies().subscribe({
      next: (companies: any) => {
        console.log(companies)
      },
    });
  }

  handleCompanySelection(event: any) {
  const companyId = event.value;
  //const filtered = this.paidInvoices().filter(inv => inv.user_id === companyId);
  //this.invoiceList.data = filtered;
}

getCompanyName(userId: number): void {
  // this.companiesService.getByUserId(userId).subscribe({
  //   next: (company: any) => {
  //     return company.name || 'N/A';
  //   },
  // });
  
}
  
}
