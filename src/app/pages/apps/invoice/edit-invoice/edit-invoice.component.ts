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
  companies: any[] = [];
  clients: any[] = [];
  
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
        user_id: ['', Validators.required],
        due_date: ['', Validators.required],
        description: ['', Validators.required],
        amount: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.id.set(+this.activatedRouter.snapshot.paramMap.get('id')!);
    this.loadCompanies();
    this.loadInvoiceDetail();
    this.usersService.getUsers({}).subscribe(users => {
      this.clients = users.filter((user:any) => user.role == 3 && user.active == 1);
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
          user_id: data.user_id,
          due_date: new Date(data.due_date),
          description: data.description,
          amount: data.amount
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

  saveDetail(event: Event): void {
    event.preventDefault();
    
    this.invoiceForm.markAllAsTouched();

    if (this.invoiceDetail()?.user_id == null || 
        this.invoiceDetail()?.due_date == null || 
        this.invoiceDetail()?.description == null || 
        this.invoiceDetail()?.amount == null) {
      this.snackBar.open('Please fill all required fields.', 'Close', { duration: 3000 });
      return;
    }

    const invoiceData = this.invoiceForm.value;

    const selectedClient = this.clients.find((c: any) => c.id === invoiceData.user_id);

    const company_id = selectedClient?.company?.id || null;


    const updatedInvoice = {
      ...this.invoiceDetail(),
      company_id: company_id,
    };

    this.invoiceService.updateInvoice(this.id(), updatedInvoice).subscribe({
      next: () => {
        this.snackBar.open('Invoice updated successfully!', 'Close', { duration: 3000 });
        this.router.navigate(['/apps/invoice']);
      },
      error: (err) => {
        this.snackBar.open('Error updating invoice', 'Close', { duration: 3000 });
        console.error(err);
      }
    });
  }

  handleCompanySelection(event: any) {
    const companyId = event.value;
    //const filtered = this.paidInvoices().filter(inv => inv.user_id === companyId);
    //this.invoiceList.data = filtered;
  }
}