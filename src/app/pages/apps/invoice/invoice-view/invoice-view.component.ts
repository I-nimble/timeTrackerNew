import { Component, signal } from '@angular/core';
import { InvoiceService } from 'src/app/services/apps/invoice/invoice.service';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-invoice-view',
  templateUrl: './invoice-view.component.html',
  styleUrls: ['./invoice-view.component.scss'],
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
  itemsDisplayedColumns: string[] = ['description', 'hours', 'hourly-rate', 'cost'];
  itemsFooterDisplayedColumns = ['footer-sub-total', 'footer-amount', 'empty-column'];
  itemsSecondFooterDisplayedColumns = ['footer-total', 'footer-amount', 'empty-column'];
  ratingsDisplayedColumns: string[] = ['day', 'date', 'clock-in', 'clock-out', 'total-hours', 'comments'];
  footerDisplayedColumns = ['footer-total', 'footer-amount', 'empty-column'];
  tax: number = 0;
  inimbleSupervisor = signal<string>('Sergio Ávila');

  constructor(
    private activatedRouter: ActivatedRoute,
    private invoiceService: InvoiceService,
    public snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.id.set(+this.activatedRouter.snapshot.paramMap.get('id')!);
    this.loadInvoiceDetail();
  }

  private loadInvoiceDetail(): void {
    this.invoiceService.getInvoiceDetail(this.id()).subscribe({
      next: (data) => {
        console.log(data)
        this.invoiceDetail.set(data);
      }
    });
  }

  approveInvoice() {
    this.invoiceService.approveInvoice(this.id()).subscribe({
      next: (response) => {
        this.snackBar.open('Invoice approved successfully', 'Close', {
          duration: 3000,
        });
        this.loadInvoiceDetail();
      },
      error: (error) => {
        console.error('Error approving invoice:', error);
      }
    });
  }

  decimalToTime(decimal: number): string {
    if (isNaN(decimal)) return '00:00:00';
    const hours = Math.floor(decimal);
    const minutes = Math.floor((decimal - hours) * 60);
    const seconds = Math.round((((decimal - hours) * 60) - minutes) * 60);
    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      seconds.toString().padStart(2, '0')
    ].join(':');
  }

  toDateInputValue(date: string | Date): string {
    if (!date) {
      return new Date().toISOString().split('T')[0];
    }

    const d = new Date(date);

    if (isNaN(d.getTime())) {
      console.warn('Invalid date in toDateInputValue:', date);
      return new Date().toISOString().split('T')[0];
    }

    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
  }
}
