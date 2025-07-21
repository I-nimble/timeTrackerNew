import { Component, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { InvoiceService } from 'src/app/services/apps/invoice/invoice.service';
import { 
  UntypedFormGroup,
  UntypedFormBuilder,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { OkDialogComponent } from './ok-dialog/ok-dialog.component';
import { MaterialModule } from 'src/app/material.module';
import { CommonModule } from '@angular/common';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CompaniesService } from 'src/app/services/companies.service';
import { UsersService } from 'src/app/services/users.service';

@Component({
  selector: 'app-edit-invoice',
  templateUrl: './edit-invoice.component.html',
  imports: [
    MaterialModule,
    CommonModule,
    RouterLink,
    FormsModule,
    ReactiveFormsModule,
    TablerIconsModule,
  ]
})
export class AppEditInvoiceComponent {
  id = signal<number>(0);
  invoiceDetail = signal<any>({
    due_date: null,
    description: '',
    amount: 0,
    user: {
      company: {}
    }
  });
  displayedColumns: string[] = ['itemName', 'total'];
  companies: any[] = [];
  clients: any[] = [];
  statusOptions = [
    { id: 1, name: 'Paid' },
    { id: 2, name: 'Pending' },
    { id: 3, name: 'Overdue' }
  ];
  
  invoiceForm: UntypedFormGroup;

  constructor(
    private activatedRouter: ActivatedRoute,
    private invoiceService: InvoiceService,
    private companiesService: CompaniesService,
    private fb: UntypedFormBuilder,
    private snackBar: MatSnackBar,
    private router: Router,
    private usersService: UsersService,
  ) {
    this.invoiceForm = this.fb.group({
      status_id: ['', Validators.required],
      due_date: ['', Validators.required],
      user_id: ['', Validators.required],
      description: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.id.set(+this.activatedRouter.snapshot.paramMap.get('id')!);
    this.loadCompanies();
    this.loadInvoiceDetail();
    this.usersService.getUsers({}).subscribe(users => {
      this.clients = users.filter((user:any) => user.role == 3 && user.active == 1);
      console.log(this.clients)
    })
  }

  private loadCompanies(): void {
    this.companiesService.getCompanies().subscribe({
      next: (companies) => {
        this.companies = companies;
      }
    });
  }

  private loadInvoiceDetail(): void {
    this.invoiceService.getInvoiceDetail(this.id()).subscribe({
      next: (data) => {
        this.invoiceDetail.set(data);
        this.transformDataForTable(data);
        this.invoiceForm.patchValue({
          status_id: data.status?.id,
          due_date: new Date(data?.due_date),
          user_id: data.user?.company?.id,
          description: data.description
        });
      }
    });
  }

  private transformDataForTable(invoiceData: any): void {
    const tableData = [{
      itemName: invoiceData.user?.company?.currentPlan?.name,
      unitTotalPrice: invoiceData.user?.company?.currentPlan?.price
    }];
    
    this.invoiceDetail.update((value) => {
      return {
        ...value,
        tableItems: tableData
      };
    });
  }

  onSubmit(): void {
    if (this.invoiceForm.valid) {
      const updatedInvoice = {
        ...this.invoiceDetail(),
        status_id: this.invoiceForm.value.status_id,
        due_date: this.invoiceForm.value?.due_date,
        user: {
          ...this.invoiceDetail().user,
          company: {
            ...this.invoiceDetail().user.company,
            id: this.invoiceForm.value.company_id
          }
        },
        description: this.invoiceForm.value.description
      };

      this.invoiceService.updateInvoice(this.id(), updatedInvoice).subscribe({
        next: () => {
          this.snackBar.open('Invoice updated successfully!', 'Close', {
            duration: 3000,
          });
          this.router.navigate(['/apps/invoice']);
        },
        error: (err) => {
          console.error('Error updating invoice:', err);
          this.snackBar.open('Error updating invoice', 'Close', {
            duration: 3000,
          });
        }
      });
    }
  }

  saveDetail(event: any) {

  }

  handleCompanySelection(event: any) {
    const companyId = event.value;
    //const filtered = this.paidInvoices().filter(inv => inv.user_id === companyId);
    //this.invoiceList.data = filtered;
  }
}