import { Component, signal, OnInit } from '@angular/core';
import {
  UntypedFormGroup,
  UntypedFormBuilder,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { InvoiceService } from 'src/app/services/apps/invoice/invoice.service';
import { Router, RouterModule } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MaterialModule } from 'src/app/material.module';
import { CommonModule } from '@angular/common';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CompaniesService } from 'src/app/services/companies.service';
import { UsersService } from 'src/app/services/users.service';

@Component({
    selector: 'app-add-invoice',
    templateUrl: './add-invoice.component.html',
    imports: [
        MaterialModule,
        CommonModule,
        RouterModule,
        FormsModule,
        ReactiveFormsModule,
        TablerIconsModule,
    ]
})
export class AppAddInvoiceComponent implements OnInit {
  addForm: UntypedFormGroup;
  invoice = signal<any>({
    user_id: null,
    plan_id: null,
    description: '',
    amount: 0,
    due_date: new Date(),
    created_at: new Date(),
    updated_at: new Date()
  });

  plans: any[] = [];
  users: any[] = [];
  companies: any[] = [];
  clients: any[] = [];
  companyMap: { [key: number]: string } = {};
  role: string = localStorage.getItem('role') || '3';

  constructor(
    private fb: UntypedFormBuilder,
    public dialog: MatDialog,
    private snackBar: MatSnackBar,
    private companiesService: CompaniesService,
    private usersService: UsersService,
    public invoiceService: InvoiceService
  ) {
    this.addForm = this.fb.group({
      description: ['', Validators.required],
      amount: ['', Validators.required],
      due_date: ['', Validators.required],
      user_id: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    this.companiesService.getCompanies().subscribe({
      next: (companies: any[]) => {
        this.companies = companies;
        this.companyMap = {};
        companies.forEach(c => this.companyMap[c.id] = c.name);
      }
    });
    this.usersService.getUsers({}).subscribe(users => {
      this.clients = users.filter((user:any) => user.role == 3 && user.active == 1);
    })
  }


  saveDetail(event: Event): void {
    event.preventDefault();
    if (this.addForm.invalid) {
      this.showSnackbar('Please fill all required fields.');
      return;
    }

    const invoiceData = this.addForm.value;

    const selectedClient = this.clients.find((c: any) => c.id === invoiceData.user_id);

    const company_id = selectedClient?.company?.id || null;

    const payload = {
      ...invoiceData,
      company_id
    };

    this.invoiceService.createInvoice(payload).subscribe({
      next: () => {
        this.showSnackbar('Invoice created successfully!');
        this.addForm.reset();
      },
      error: (err) => {
        this.showSnackbar('Error creating invoice.');
        console.error(err);
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

  handleCompanySelection(event: any) {
      const companyId = event.value;
      //const filtered = this.paidInvoices().filter(inv => inv.user_id === companyId);
      //this.invoiceList.data = filtered;
    }
}