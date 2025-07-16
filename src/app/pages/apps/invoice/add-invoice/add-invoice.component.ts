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
  companyMap: { [key: number]: string } = {};
  role: string = localStorage.getItem('role') || '3';

  constructor(
    private fb: UntypedFormBuilder,
    private invoiceService: InvoiceService,
    private router: Router,
    public dialog: MatDialog,
    private snackBar: MatSnackBar,
    private companiesService: CompaniesService,
  ) {
    this.addForm = this.fb.group({
      description: ['', Validators.required],
      plan_id: ['', Validators.required],
      amount: ['', Validators.required],
      currency_id: ['', Validators.required],
      due_date: ['', Validators.required],
      user_id: ['']
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
  }


  saveDetail(event: Event): void {

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