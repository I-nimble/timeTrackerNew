import { Component, signal } from '@angular/core';
import { InvoiceService } from 'src/app/services/apps/invoice/invoice.service';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LoaderComponent } from 'src/app/components/loader/loader.component';
import { Loader } from 'src/app/app.models';

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
    LoaderComponent
  ]
})
export class AppInvoiceViewComponent {
  id = signal<number>(0);
  invoiceDetail = signal<any>(null);
  locationLinksMap: { [entryId: number]: Array<{ label: string; url: string; title: string }> } = {};
  itemsDisplayedColumns: string[] = ['description', 'hours', 'hourly-rate', 'flat-fee', 'cost'];
  itemsFooterDisplayedColumns = ['footer-sub-total', 'footer-amount', 'empty-column'];
  itemsSecondFooterDisplayedColumns = ['footer-total', 'footer-amount', 'empty-column'];
  ratingsDisplayedColumns: string[] = ['day', 'date', 'clock-in', 'clock-out', 'total-hours', 'comments'];
  footerDisplayedColumns = ['footer-total', 'footer-amount', 'empty-column'];
  tax: number = 0;
  inimbleSupervisor = signal<string>('Sergio Ávila');
  loader = new Loader(false, false, false);
  message = '';

  constructor(
    private activatedRouter: ActivatedRoute,
    private invoiceService: InvoiceService,
    public snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.loader.started = true;
    this.id.set(+this.activatedRouter.snapshot.paramMap.get('id')!);
    if(!this.id()) {
      this.loader.complete = true;
      this.loader.error = true;
      this.message = 'The invoice you are trying to view does not exist or has been deleted.';
      return;
    }
    this.loadInvoiceDetail();
  }

  getLocationsForEntry(entryId: number): string {
    const links = this.getLocationLinks(entryId);
    if (!links || links.length === 0) return '';
    return links.map((l, idx) => `${l.label}${idx < links.length - 1 ? ' | ' : ''}`).join('');
  }

  getLocationLinks(entryId: number): Array<{ label: string; url: string; title: string }> {
    const invoice = this.invoiceDetail();
    if (!invoice || !invoice.invoice_locations) return [];
    const matches = (invoice.invoice_locations || []).filter((l: any) => l.entry_id === entryId);
    if (!matches || matches.length === 0) return [];

    const points = matches.flatMap((m: any) => m.locations || []);
    if (!points || points.length === 0) return [];

    const seen = new Set<string>();
    const out: Array<{ label: string; url: string; title: string }> = [];
    points.forEach((p: any, idx: number) => {
      const lat = parseFloat(p.latitude as any);
      const lon = parseFloat(p.longitude as any);
      if (!isFinite(lat) || !isFinite(lon)) return;
      const key = `${lat.toFixed(5)}:${lon.toFixed(5)}`;
      if (seen.has(key)) return;
      seen.add(key);
      const label = `Map ${out.length + 1}`;
      const url = `https://www.google.com/maps?q=${lat},${lon}`;
      const title = `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
      out.push({ label, url, title });
    });

    return out;
  }

  openLink(url: string): void {
    try {
      window.open(url, '_blank', 'noopener');
    } catch (err) {
      console.error('Failed to open link', err, url);
      window.location.href = url;
    }
  }

  private loadInvoiceDetail(): void {
    this.invoiceService.getInvoiceDetail(this.id()).subscribe({
      next: (data) => {
        this.invoiceDetail.set(data);
        try {
          this.buildLocationLinksMap();
        } catch (e) {
          console.warn('Failed to build location links map', e);
        }
        this.loader.complete = true;
      }
    });
  }

  buildLocationLinksMap(): void {
    this.locationLinksMap = {};
    const invoice = this.invoiceDetail();
    if (!invoice) return;
    const items = invoice.invoiceItems || [];
    items.forEach((item: any) => {
      (item.entries || []).forEach((entry: any) => {
        try {
          const links = this.getLocationLinks(entry.id) || [];
          this.locationLinksMap[entry.id] = links;
        } catch (err) {
          console.warn('buildLocationLinksMap: failed for entry', entry.id, err);
          this.locationLinksMap[entry.id] = [];
        }
      });
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

    const year = d.getUTCFullYear();
    const month = (d.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = d.getUTCDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
