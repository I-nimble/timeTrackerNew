import { Component, signal } from '@angular/core';
import { InvoiceService } from 'src/app/services/apps/invoice/invoice.service';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TablerIconsModule } from 'angular-tabler-icons';

@Component({
    selector: 'app-invoice-view',
    templateUrl: './invoice-view.component.html',
    imports: [
        MaterialModule,
        CommonModule,
        RouterLink,
        FormsModule,
        ReactiveFormsModule,
        TablerIconsModule,
    ]
})
export class AppInvoiceViewComponent {
  id = signal<number>(0);
  invoiceDetail = signal<any>(null);
  displayedColumns: string[] = ['itemName', 'total'];

  constructor(
    private activatedRouter: ActivatedRoute,
    private invoiceService: InvoiceService
  ) {}

   ngOnInit(): void {
    this.id.set(+this.activatedRouter.snapshot.paramMap.get('id')!);
    this.loadInvoiceDetail();
  }

  private loadInvoiceDetail(): void {
    this.invoiceService.getInvoiceDetail(this.id()).subscribe({
      next: (data) => {
        this.invoiceDetail.set(data);
        this.transformDataForTable(data);
      }
    });
  }

  private transformDataForTable(invoiceData: any): void {
    const tableData = [{
      description: invoiceData.description,
      amount: invoiceData.amount
    }];
    
    this.invoiceDetail.update((value) => {
      return {
        ...value,
        tableItems: tableData
      };
    });
  }
}
