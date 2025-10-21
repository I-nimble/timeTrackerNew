import { Component, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { InvoiceService } from 'src/app/services/apps/invoice/invoice.service';
import {
  UntypedFormGroup,
  UntypedFormBuilder,
  Validators,
  FormsModule,
  ReactiveFormsModule,
  FormArray
} from '@angular/forms';
import { MaterialModule } from 'src/app/material.module';
import { CommonModule, DatePipe } from '@angular/common';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CompaniesService } from 'src/app/services/companies.service';
import { UsersService } from 'src/app/services/users.service';
import { ChangeDetectorRef } from '@angular/core';
import { LoaderComponent } from 'src/app/components/loader/loader.component';
import { Loader } from 'src/app/app.models';

@Component({
  selector: 'app-edit-invoice',
  templateUrl: './edit-invoice.component.html',
  styleUrls: ['./edit-invoice.component.scss'],
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
export class AppEditInvoiceComponent {
  id = signal<number>(0);
  itemsDisplayedColumns: string[] = ['description', 'hours', 'hourly-rate', 'flat-fee', 'cost'];
  itemsFooterDisplayedColumns = ['footer-sub-total', 'footer-amount', 'empty-column'];
  itemsSecondFooterDisplayedColumns = ['footer-total', 'footer-amount', 'empty-column'];
  ratingsDisplayedColumns: string[] = ['day', 'date', 'clock-in', 'clock-out', 'total-hours', 'comments'];
  footerDisplayedColumns = ['footer-total', 'footer-amount', 'empty-column'];
  tax: number = 0;
  inimbleSupervisor = signal<string>('Sergio Ávila');

  companies: any[] = [];
  clients: any[] = [];
  invoiceForm: UntypedFormGroup;
  editModel = signal<any>({});
  originalData: any = null;
  changedEntries = new Set<any>();
  changedHourlyRates = new Set<any>();
  loader = new Loader(false, false, false);
  message = '';
  changedFlatFees = new Set<any>();

  trackByEntryId(index: number, item: any) {
    return item.id;
  }

  constructor(
    private activatedRouter: ActivatedRoute,
    private invoiceService: InvoiceService,
    private companiesService: CompaniesService,
    private fb: UntypedFormBuilder,
    private snackBar: MatSnackBar,
    private router: Router,
    private usersService: UsersService,
    private datePipe: DatePipe,
    private cdr: ChangeDetectorRef
  ) {
    this.invoiceForm = this.fb.group({
      user_id: [null, Validators.required],
      due_date: [null, Validators.required],
      project_title: [''],
      invoice_number: [''],
      terms: [''],
      description: ['', Validators.required],
      amount: [null, Validators.required],
      billing_period_start: [null, Validators.required],
      billing_period_end: [null, Validators.required],
      inimble_supervisor: [''],
      invoiceItems: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.loader.started = true;
    this.id.set(+this.activatedRouter.snapshot.paramMap.get('id')!);
    if(!this.id()) {
      this.loader.complete = true;
      this.loader.error = true;
      this.message = 'The invoice you are trying to view does not exist or has been deleted.';
      return;
    }
    this.loadCompanies();
    this.loadCients();
    this.loadInvoiceDetail();
  }

  private loadCients(): void {
    this.usersService.getUsers({}).subscribe(users => {
      this.clients = users.filter((user: any) => user.role == 3 && user.active == 1);
    });
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
        this.originalData = data;

        this.editModel.set({
          id: data.id,
          user_id: data.user_id,
          description: data.description,
          amount: data.amount,
          due_date: data.due_date,
          project_title: data.project_title,
          invoice_number: data.invoice_number,
          terms: data.terms,
          created_at: data.created_at,
          billing_period_start: data.billing_period_start,
          billing_period_end: data.billing_period_end,
          inimble_supervisor: data.inimble_supervisor || this.inimbleSupervisor(),
          direct_supervisor: data.direct_supervisor || data?.user?.name + " " + data?.user?.last_name,
          invoiceItems: data.invoiceItems,
          user: data.user
        });

        this.recalculateCosts();
        this.changedEntries.clear();
        this.changedFlatFees.clear();

        this.invoiceForm.patchValue({
          user_id: data.user_id,
          description: data.description,
          amount: this.editModel().amount,
          due_date: data.due_date,
          project_title: data.project_title,
          invoice_number: data.invoice_number,
          terms: data.terms,
          billing_period_start: data.billing_period_start,
          billing_period_end: data.billing_period_end,
        });

        const itemsArray = this.invoiceForm.get('invoiceItems') as FormArray;
        itemsArray.clear();
        data.invoiceItems.forEach((item: any) => {
          itemsArray.push(this.fb.group({
            id: [item.id],
            full_time: [item.full_time],
            hourly_rate: [item.hourly_rate],
            flat_fee: [item.flat_fee || 0.00],
            entries: this.fb.array(item.entries.map((entry: any) =>
              this.fb.group({
                id: [entry.id],
                date: [entry.date, Validators.required],
                start_time: [entry.start_time, Validators.required],
                end_time: [entry.end_time, Validators.required],
                comments: [entry.task?.description || '']
              })
            ))
          }));
        });
        this.loader.complete = true;
      },
      error: () => {
        this.loader.complete = true;
        this.loader.error = true;
        this.message = 'There was an error loading the invoice.';
        this.snackBar.open('Error loading invoice details', 'Close', { duration: 3000 });
      }
    });
  }

  private markEntryAsChanged(entry: any): void {
    this.changedEntries.add(entry);
  }

  private markHourlyRateAsChanged(item: any): void {
    this.changedHourlyRates.add({
      employee_id: item.employee_id,
      hourly_rate: item.hourly_rate,
    });
  }

  decimalToTime(decimal: number): string {
    if (isNaN(decimal) || decimal === null) return '00:00:00';

    const hours = Math.floor(decimal);
    const minutes = Math.floor((decimal - hours) * 60);
    const seconds = Math.floor((((decimal - hours) * 60) - minutes) * 60);

    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      seconds.toString().padStart(2, '0')
    ].join(':');
  }

  getTotalEntryHours(entry: any): number {
    const start = new Date(entry.start_time);
    const end = new Date(entry.end_time);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      console.warn('Invalid dates in getTotalEntryHours:', { start: entry.start_time, end: entry.end_time });
      return 0;
    }

    const startUTC = new Date(Date.UTC(start.getFullYear(), start.getMonth(), start.getDate(),
      start.getHours(), start.getMinutes(), start.getSeconds()));
    const endUTC = new Date(Date.UTC(end.getFullYear(), end.getMonth(), end.getDate(),
      end.getHours(), end.getMinutes(), end.getSeconds()));
    if (endUTC < startUTC) {
      endUTC.setUTCDate(endUTC.getUTCDate() + 1);
    }

    let diff = (endUTC.getTime() - startUTC.getTime()) / (1000 * 60 * 60);

    if (diff < 0) {
      diff += 24;
    }

    const roundedDiff = Math.round(diff * 100) / 100;

    return roundedDiff;
  }

  combineDateAndTime(dateStr: string | Date, timeStr: string): string {
    if (!dateStr || !timeStr) {
      console.warn('Invalid date or time input:', { dateStr, timeStr });
      return new Date().toISOString();
    }

    try {
      let date: Date;
      if (typeof dateStr === 'string') {
        if (dateStr.includes('T')) {
          date = new Date(dateStr);
        } else {
          date = new Date(dateStr + 'T00:00:00.000Z');
        }
      } else {
        date = new Date(dateStr);
      }

      if (isNaN(date.getTime())) {
        console.warn('Invalid date:', dateStr);
        return new Date().toISOString();
      }

      const [hours, minutes] = timeStr.split(':').map(Number);

      if (isNaN(hours) || isNaN(minutes)) {
        console.warn('Invalid time:', timeStr);
        return new Date().toISOString();
      }

      const year = date.getFullYear();
      const month = date.getMonth();
      const day = date.getDate();

      const combinedDate = new Date(year, month, day, hours, minutes, 0);

      if (isNaN(combinedDate.getTime())) {
        console.warn('Invalid combined date:', { dateStr, timeStr });
        return new Date().toISOString();
      }

      return combinedDate.toISOString();
    } catch (error) {
      console.error('Error combining date and time:', error);
      return new Date().toISOString();
    }
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

  toTimeInputValue(date: string | Date): string {
    if (!date) {
      return '00:00';
    }

    const d = new Date(date);

    if (isNaN(d.getTime())) {
      console.warn('Invalid date in toTimeInputValue:', date);
      return '00:00';
    }

    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  getTotalHoursForItem(item: any): number {
    if (!item || !item.entries) return 0;

    return item.entries.reduce((total: number, entry: any) => {
      return total + (entry.entry_hours || 0);
    }, 0);
  }

  calculateItemCost(item: any): number {
    const totalHours = this.getTotalHoursForItem(item);
    const hourlyRate = item.hourly_rate || 0;
    const flatFee = parseFloat(item.flat_fee) || 0.00;
    return (totalHours * hourlyRate) + flatFee;
  }

  calculateTotalAmount(): number {
    if (!this.editModel()?.invoiceItems) return 0;

    return this.editModel().invoiceItems.reduce((total: number, item: any) => {
      return total + this.calculateItemCost(item);
    }, 0);
  }

  onStartTimeChange(entry: any, newStartTime: string): void {

    const entryId = entry.id;

    for (const invoiceItem of this.editModel().invoiceItems) {
      const targetEntry = invoiceItem.entries.find((e: any) => e.id === entryId);

      if (targetEntry) {

        let dateToUse = targetEntry.date;
        if (dateToUse && !dateToUse.includes('T')) {
          dateToUse = new Date(dateToUse + 'T00:00:00.000Z').toISOString();
        }

        const newStartTimeISO = this.combineDateAndTime(dateToUse, newStartTime);
        targetEntry.start_time = newStartTimeISO;
        targetEntry.entry_hours = this.getTotalEntryHours(targetEntry);

        this.markEntryAsChanged(targetEntry);

        this.recalculateCosts();

        this.updateFormArrayWithChanges();

        invoiceItem.entries = [...invoiceItem.entries];
      }
    }

    this.cdr.detectChanges();
  }

  onEndTimeChange(entry: any, newEndTime: string): void {

    const entryId = entry.id;

    for (const invoiceItem of this.editModel().invoiceItems) {
      const targetEntry = invoiceItem.entries.find((e: any) => e.id === entryId);

      if (targetEntry) {

        let dateToUse = targetEntry.date;
        if (dateToUse && !dateToUse.includes('T')) {
          dateToUse = new Date(dateToUse + 'T00:00:00.000Z').toISOString();
        }

        const newEndTimeISO = this.combineDateAndTime(dateToUse, newEndTime);
        targetEntry.end_time = newEndTimeISO;
        targetEntry.entry_hours = this.getTotalEntryHours(targetEntry);

        this.markEntryAsChanged(targetEntry);

        this.recalculateCosts();

        this.updateFormArrayWithChanges();

        invoiceItem.entries = [...invoiceItem.entries];
      }
    }

    this.cdr.detectChanges();
  }

  onEntryDateChange(entry: any, newDate: string): void {

    const entryId = entry.id;

    for (const invoiceItem of this.editModel().invoiceItems) {
      const targetEntry = invoiceItem.entries.find((e: any) => e.id === entryId);

      if (targetEntry) {

        const newDateObj = new Date(newDate);
        if (isNaN(newDateObj.getTime())) {
          console.warn('Invalid new date:', newDate);
          return;
        }

        const originalStartTime = targetEntry.start_time ?
          this.toTimeInputValue(targetEntry.start_time) : '00:00';
        const originalEndTime = targetEntry.end_time ?
          this.toTimeInputValue(targetEntry.end_time) : '00:00';

        targetEntry.date = newDateObj.toISOString();
        targetEntry.start_time = this.combineDateAndTime(newDate, originalStartTime);
        targetEntry.end_time = this.combineDateAndTime(newDate, originalEndTime);
        targetEntry.entry_hours = this.getTotalEntryHours(targetEntry);

        this.markEntryAsChanged(targetEntry);

        this.recalculateCosts();

        this.updateFormArrayWithChanges();

        invoiceItem.entries = [...invoiceItem.entries];
      }
    }

    this.cdr.detectChanges();
  }

  onHourlyRateChange(item: any, event: Event): void {
    const invoiceItem = this.editModel().invoiceItems.find((i: any) => i.employee_id === item.employee_id);
    const newHourlyRate = (event.target as HTMLInputElement).value;
    if (invoiceItem) {
      invoiceItem.hourly_rate = newHourlyRate;
      this.markHourlyRateAsChanged(invoiceItem);
      this.recalculateCosts();
      this.updateFormArrayWithChanges();
    }

    this.cdr.detectChanges();
  }

  onCommentChange(entry: any, newComment: string): void {
    const entryId = entry.id;

    for (const invoiceItem of this.editModel().invoiceItems) {
      const targetEntry = invoiceItem.entries.find((e: any) => e.id === entryId);

      if (targetEntry) {
        targetEntry.task.description = newComment;
        this.markEntryAsChanged(targetEntry);
        this.updateFormArrayWithChanges();
      }
    }

    this.cdr.detectChanges();
  }

  onFlatFeeChange(item: any, event: Event): void {
    const invoiceItem = this.editModel().invoiceItems.find((i: any) => i.employee_id === item.employee_id);
    const inputValue = (event.target as HTMLInputElement).value;
    const newFlatFee = parseFloat(inputValue) || 0;
    
    if (invoiceItem) {
      invoiceItem.flat_fee = newFlatFee;
      this.markFlatFeeAsChanged(invoiceItem);
      this.recalculateCosts();
      this.updateFormArrayWithChanges();
    }

    this.cdr.detectChanges();
  }

  private markFlatFeeAsChanged(item: any): void {
    this.changedFlatFees.add({
      employee_id: item.employee_id,
      flat_fee: item.flat_fee,
    });
  }

  private recalculateCosts(): void {
    if (!this.editModel()?.invoiceItems) return;

    this.editModel().invoiceItems.forEach((item: any) => {
      item.hours = this.getTotalHoursForItem(item);
      item.cost = this.calculateItemCost(item);
    });

    this.editModel().amount = this.calculateTotalAmount();

    this.invoiceForm.patchValue({
      amount: this.editModel().amount
    });
  }

  private updateFormArrayWithChanges(): void {
    const itemsArray = this.invoiceForm.get('invoiceItems') as FormArray;

    itemsArray.clear();

    this.editModel().invoiceItems.forEach((item: any) => {
      const itemGroup = this.fb.group({
        id: [item.id],
        full_time: [item.full_time],
        hourly_rate: [item.hourly_rate],
        entries: this.fb.array(item.entries.map((entry: any) =>
          this.fb.group({
            id: [entry.id],
            date: [entry.date, Validators.required],
            start_time: [entry.start_time, Validators.required],
            end_time: [entry.end_time, Validators.required],
            comments: [entry.comments || '']
          })
        ))
      });
      itemsArray.push(itemGroup);
    });

    this.invoiceForm.markAsDirty();
  }

  saveDetail(event: Event): void {
    event.preventDefault();

    this.invoiceForm.markAllAsTouched();

    this.recalculateCosts();

    if (
      !this.editModel().due_date
    ) {
      this.snackBar.open('Please fill all required fields.', 'Close', { duration: 3000 });
      return;
    }

    const data = {
      id: this.editModel().id,
      user_id: this.editModel().user_id,
      description: this.editModel().description,
      amount: this.editModel().amount,
      due_date: this.editModel().due_date,
      project_title: this.editModel().project_title,
      invoice_number: this.editModel().invoice_number,
      terms: this.editModel().terms,
      billing_period_start: this.editModel().billing_period_start,
      billing_period_end: this.editModel().billing_period_end,
      inimble_supervisor: this.editModel().inimble_supervisor,
      direct_supervisor: this.editModel().direct_supervisor,
      changed_entries: [...this.changedEntries],
      changed_hourly_rates: [...this.changedHourlyRates],
      changed_flat_fees: [...this.changedFlatFees],
    };

    this.invoiceService.updateInvoice(this.id(), data).subscribe({
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
}