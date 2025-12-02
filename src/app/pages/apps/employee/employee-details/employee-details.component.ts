import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexDataLabels,
  ApexYAxis,
  ApexLegend,
  ApexXAxis,
  ApexTooltip,
  ApexTheme,
  ApexGrid,
  ApexPlotOptions,
  ApexFill,
  NgApexchartsModule,
} from 'ng-apexcharts';
import { MatIconModule } from '@angular/material/icon'; 
import { CommonModule, Location } from '@angular/common';
import { SchedulesService } from 'src/app/services/schedules.service';
import { ReportsService } from 'src/app/services/reports.service';
import moment from 'moment-timezone';
import { UsersService } from 'src/app/services/users.service';
import { EmployeesService } from 'src/app/services/employees.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EntriesService } from 'src/app/services/entries.service';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule, ReactiveFormsModule, FormControl, FormGroup } from '@angular/forms';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';

interface EditEntryForm {
  start_time: FormControl<string>;
  end_time: FormControl<string>;
}

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  stroke: any;
  theme: ApexTheme;
  tooltip: ApexTooltip;
  dataLabels: ApexDataLabels;
  legend: ApexLegend;
  colors: string[];
  markers: any;
  grid: ApexGrid;
  plotOptions: ApexPlotOptions;
  fill: ApexFill;
  labels: string[];
};

@Component({
  standalone: true,
  selector: 'app-employee-details',
  templateUrl: './employee-details.component.html',
  styleUrls: ['./employee-details.component.scss'],
  imports: [  
    CommonModule,
    MatCardModule, 
    NgApexchartsModule,
    MatIconModule,
    MatTableModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    ReactiveFormsModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatMenuModule
  ]
})
export class EmployeeDetailsComponent implements OnInit, OnDestroy {
  userId: string | null = null;
  datesRange: any = {};
  filters: any = { user: { id: null }, company: 'all', project: 'all' };
  hoursElapsed: number = 0;
  hoursRemaining: number = 0;
  companyTimezone: string = 'UTC';
  entries: any = [];
  user: any;
  schedules: any = [];
  userRole: string | null = localStorage.getItem('role');
  refreshInterval: any;

  startDate: Date = new Date();
  endDate: Date = new Date();
  weekEntries: any[] = [];
  displayedColumns: string[] = ['date', 'start_time', 'end_time', 'total_hours', 'actions'];
  isEntriesLoading: boolean = false;
  
  editingRowId: number | null = null;
  editForms: Map<number, FormGroup<EditEntryForm>> = new Map();
  hasChanges: Map<number, boolean> = new Map();
  originalValues: Map<number, any> = new Map();

  public weeklyHoursChart: Partial<ChartOptions> | any;
  public dailyHoursChart: Partial<ChartOptions> | any;

  constructor(
    private route: ActivatedRoute,
    private location: Location,
    private schedulesService: SchedulesService,
    private reportsService: ReportsService,
    private employeesService: EmployeesService,
    private userService: UsersService,
    private snackBar: MatSnackBar,
    private entriesService: EntriesService,
    private router: Router
  ) {
    this.setDefaultDateRange();
    this.initializeCharts();
  }

  ngOnInit(): void {
    if(this.userRole === '2') {
      this.user = this.userService.getUsers({ searchField: "", filter: { currentUser: true } }).subscribe({
        next: (res: any) => {
          this.user = res[0];
          this.userId = this.user.id;
          this.defaultWeek();
          this.getDailyHours();
          this.loadWeekEntries();
        }
      })
    }
    else {
      this.user = this.userService.getSelectedUser();
      this.userId = this.user.id;
      this.defaultWeek();
      this.getDailyHours();
      this.loadWeekEntries();

      if (!this.user.name || !this.userId) {
        this.openSnackBar("Click a user to see their report", "Close");
        this.router.navigate(['/apps/time-tracker']);
        return;
      }
    }

    this.refreshInterval = setInterval(() => {
      this.defaultWeek();
      this.getDailyHours();
      this.loadWeekEntries();
    }, 300000);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  initializeEditForm(entry: any): void { 
    const startTime = this.getTimeFromDateTime(entry.start_time);
    const endTime = this.getTimeFromDateTime(entry.end_time);
    
    const entryDate = moment(entry.date).format('YYYY-MM-DD');
    
    const editableStart = `${entryDate}T${startTime}`;
    const editableEnd = `${entryDate}T${endTime}`;
    
    const form = new FormGroup<EditEntryForm>({
      start_time: new FormControl<string>(editableStart, { nonNullable: true }),
      end_time: new FormControl<string>(editableEnd, { nonNullable: true })
    });

    this.originalValues.set(entry.id, {
      start_time: form.value.start_time,
      end_time: form.value.end_time
    });

    form.valueChanges.subscribe(() => {
      this.checkForChanges(entry.id);
    });

    this.editForms.set(entry.id, form);
    this.hasChanges.set(entry.id, false);
  }

  private initializeCharts(): void {
    this.weeklyHoursChart = {
      series: [
        {
          name: 'Worked',
          data: [0, 0, 0, 0, 0],
        },
        {
          name: 'Not worked',
          data: [0, 0, 0, 0, 0],
        },
      ],
      chart: {
        type: 'bar',
        fontFamily: "'DM Sans',sans-serif",
        foreColor: '#adb0bb',
        toolbar: {
          show: false,
        },
        height: 280,
        stacked: true,
      },
      colors: ['#92b46c', '#adb0bb'],
      plotOptions: {
        bar: {
          borderRadius: [6],
          horizontal: false,
          barHeight: '60%',
          columnWidth: '30%',
          borderRadiusApplication: 'end',
          borderRadiusWhenStacked: 'all',
        },
      },
      stroke: {
        show: false,
      },
      dataLabels: {
        enabled: false,
      },
      legend: {
        show: true,
      },
      grid: {
        show: false,
      },
      yaxis: {
        tickAmount: 6,
        labels: {
          formatter: function (val: number) {
            return val.toFixed(2);
          }
        }
      },
      xaxis: {
        categories: ['M', 'T', 'W', 'T', 'F'],
        axisTicks: {
          show: true,
        },
      },
      tooltip: {
        theme: 'dark',
        fillSeriesColor: false,
        y: {
          formatter: function (val: number) {
            return val.toFixed(2);
          }
        }
      },
    };

    this.dailyHoursChart = {
      series: [0, 0],
      chart: { type: 'donut', height: 275 },
      labels: ['Worked', 'Not worked'],
      colors: ['#92b46c', '#adb0bb'],
    };
  }

  getFormControl(entryId: number, controlName: 'start_time' | 'end_time'): FormControl<string> {
    const form = this.editForms.get(entryId);
    if (form) {
      return form.get(controlName) as FormControl<string>;
    }
    return new FormControl<string>('', { nonNullable: true });
  }

  getTimezoneInfo(): string {
    return `Times displayed as stored in database`;
  }

  getTimeFromDateTime(dateTime: string): string {
    try {
      if (!dateTime) return '00:00';
      const timePart = dateTime.split('T')[1] || dateTime.split(' ')[1] || '00:00';
      return timePart.substring(0, 5); // Get HH:mm
    } catch (error) {
      console.error('Error extracting time:', error);
      return '00:00';
    }
  }

  createDateTime(dateStr: string, timeStr: string): string {
    try {
      const date = moment(dateStr).format('YYYY-MM-DD');
      const time = timeStr.substring(0, 5); // Get HH:mm
      return `${date} ${time}:00`;
    } catch (error) {
      console.error('Error creating datetime:', error);
      return `${dateStr} 00:00:00`;
    }
  }

  formatTime(timeString: string): string {
    if (!timeString) return '';
    
    const timePart = this.getTimeFromDateTime(timeString);
    
    if (timePart.includes(':')) {
      const [hours, minutes] = timePart.split(':');
      const hourNum = parseInt(hours, 10);
      const ampm = hourNum >= 12 ? 'PM' : 'AM';
      const hour12 = hourNum % 12 || 12;
      return `${hour12}:${minutes.padStart(2, '0')} ${ampm}`;
    }
    
    return timeString;
  }

  checkForChanges(entryId: number): void {
    const form = this.editForms.get(entryId);
    const original = this.originalValues.get(entryId);
    
    if (form && original) {
      const hasChanges = 
        form.value.start_time !== original.start_time ||
        form.value.end_time !== original.end_time;
      
      this.hasChanges.set(entryId, hasChanges);
    }
  }

  startEdit(entry: any): void {
    if (this.editingRowId && this.editingRowId !== entry.id) {
      this.cancelEdit(this.editingRowId);
    }
    
    this.editingRowId = entry.id;
    if (!this.editForms.has(entry.id)) {
      this.initializeEditForm(entry);
    }
  }

  cancelEdit(entryId: number): void {
    if (this.editingRowId === entryId) {
      this.editingRowId = null;
    }
    this.editForms.delete(entryId);
    this.hasChanges.delete(entryId);
    this.originalValues.delete(entryId);
  }

  saveEdit(entry: any): void {
    const form = this.editForms.get(entry.id);
    if (!form || form.invalid) {
      this.openSnackBar('Please enter valid times', 'Close');
      return;
    }

    const formValue = form.value;
    
    const startDateTime = formValue.start_time || '';
    const endDateTime = formValue.end_time || '';
    
    const startTime = this.getTimeFromDateTime(startDateTime);
    const endTime = this.getTimeFromDateTime(endDateTime);

    const entryDate = moment(entry.date).format('YYYY-MM-DD');
    
    const utcStartDateTime = this.createDateTime(entryDate, startTime);
    const utcEndDateTime = this.createDateTime(entryDate, endTime);
    
    const updateData = {
      start_time: utcStartDateTime,
      end_time: utcEndDateTime,
      date: entryDate,
      description: entry.description,
      task_id: entry.task_id,
      status: entry.status
    };

    this.isEntriesLoading = true;
    
    this.entriesService.updateEntry(entry.id, updateData).subscribe({
      next: (response: any) => {
        this.openSnackBar('Entry updated successfully!', 'Close');
        this.cancelEdit(entry.id);
        this.loadWeekEntries();
        this.isEntriesLoading = false;
      },
      error: (error) => {
        console.error('Error updating entry:', error);
        this.openSnackBar('Error updating entry: ' + (error.error?.message || error.message), 'Close');
        this.isEntriesLoading = false;
      }
    });
  }

  deleteEntry(entry: any): void {
    if (confirm('Are you sure you want to delete this entry?')) {
      this.isEntriesLoading = true;
      
      this.entriesService.deleteEntry(entry.id).subscribe({
        next: (response: any) => {
          this.openSnackBar('Entry deleted successfully!', 'Close');
          this.cancelEdit(entry.id);
          this.loadWeekEntries(); // Refresh data
          this.isEntriesLoading = false;
        },
        error: (error) => {
          console.error('Error deleting entry:', error);
          this.openSnackBar('Error deleting entry', 'Close');
          this.isEntriesLoading = false;
        }
      });
    }
  }

  canSave(entryId: number): boolean {
    return this.hasChanges.get(entryId) || false;
  }

  private setDefaultDateRange(): void {
    const today = moment();
    this.startDate = today.startOf('isoWeek').toDate(); // Monday
    this.endDate = today.endOf('isoWeek').toDate(); // Sunday
  }

  onDateRangeChange(): void {
    if (this.startDate && this.endDate) {
      this.editForms.clear();
      this.hasChanges.clear();
      this.originalValues.clear();
      this.editingRowId = null;
      this.loadWeekEntries();
    }
  }

  loadWeekEntries(): void {
    if (!this.userId) {
      return;
    }

    this.isEntriesLoading = true;
    
    this.entriesService.getUsersEntries(this.userId).subscribe({
      next: (response: any) => {
        const startOfRange = moment(this.startDate).startOf('day').toDate();
        const endOfRange = moment(this.endDate).endOf('day').toDate();
        
        this.weekEntries = response.entries
          .filter((entry: any) => {
            const entryDate = new Date(entry.date);
            return entryDate >= startOfRange && entryDate <= endOfRange;
          })
          .map((entry: any) => {
            const startTime = new Date(entry.start_time);
            const endTime = new Date(entry.end_time);
            const totalHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
            
            return {
              ...entry,
              total_hours: totalHours.toFixed(2),
              start_time_display: this.formatTime(entry.start_time),
              end_time_display: this.formatTime(entry.end_time)
            };
          })
          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        this.isEntriesLoading = false;
      },
      error: (err) => {
        console.error('Error loading entries:', err);
        this.openSnackBar('Error loading entries', 'Close');
        this.isEntriesLoading = false;
      }
    });
  }

  formatDate(dateString: string): string {
    return moment(dateString).format('MMM DD, YYYY');
  }

  getDayName(dateString: string): string {
    return moment(dateString).format('dddd');
  }

  getTotalWeekHours(): number {
    return this.weekEntries.reduce((total: number, entry: any) => {
      return total + parseFloat(entry.total_hours || 0);
    }, 0);
  }

  private defaultWeek(): void {
    const firstday = moment().isoWeekday(1).format('YYYY-MM-DD');
    const lastday = moment().isoWeekday(7).format('YYYY-MM-DD');
    this.datesRange = { firstSelect: firstday, lastSelect: lastday };
  }

  private getWeeklyHours(): void {
    const userParams = { id: this.userId };
    
    this.reportsService.getRange(
      this.datesRange, 
      userParams, 
      this.filters
    ).subscribe(entries => {
      this.entries = entries;
      
      this.processEntries(this.entries);
    });
  }

  private processEntries(entries: any[]): void {
    // Calculate worked hours per day
    const workedHoursPerDay = entries.reduce((acc, entry) => {
      const date = moment(entry.start_time).tz(this.companyTimezone).format('ddd');
      const duration = (new Date(entry.end_time).getTime() - new Date(entry.start_time).getTime()) / (1000 * 60 * 60);
      acc[date] = (acc[date] || 0) + duration;
      return acc;
    }, {});

    // Sum up the current day entry if it is active
    const today = moment().format('ddd');
    const activeEntry = this.entries.find(
      (entry: any) => moment(entry.start_time).isSame(moment().format('YYYY-MM-DD'), 'day') && entry.status === 0
    );
    if (activeEntry) {
      const startTime = moment(activeEntry.start_time);
      const currentTime = moment();
      workedHoursPerDay[today] = (workedHoursPerDay[today] || 0) + currentTime.diff(startTime, 'hours', true);
    }
    
    // Calculate total scheduled hours per day for each day in each schedule
    const seenDaySchedule = new Set<string>();
    const totalHoursPerDay = this.schedules.reduce((acc: any, schedule: any) => {
      const today = moment().tz(this.companyTimezone).format('YYYY-MM-DD');
      const start = moment.tz(`${today} ${schedule.start_time}`, 'YYYY-MM-DD HH:mm:ss', this.companyTimezone);
      const end = moment.tz(`${today} ${schedule.end_time}`, 'YYYY-MM-DD HH:mm:ss', this.companyTimezone);
      if (end.isBefore(start)) end.add(1, 'day');
      const duration = end.diff(start, 'hours', true);
      if (Array.isArray(schedule.days)) {
        schedule.days.forEach((dayObj: any) => {
          const dayShort = dayObj.name.substring(0, 3);
          const key = `${dayShort}_${schedule.start_time}_${schedule.end_time}`;
          if (!seenDaySchedule.has(key)) {
            acc[dayShort] = (acc[dayShort] || 0) + duration;
            seenDaySchedule.add(key);
          }
        });
      }
      return acc;
    }, {});

    this.weeklyHoursChart.series = [
      {
        name: 'Worked',
        data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(day =>
          Number(workedHoursPerDay[day.substring(0, 3)] || 0)
        ),
      },
      {
        name: 'Not worked',
        data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(day => {
          const total = totalHoursPerDay[day.substring(0, 3)] || 0;
          const worked = workedHoursPerDay[day.substring(0, 3)] || 0;
          return Number(Math.max(total - worked, 0));
        }),
      }
    ];
  }

  private getDailyHours(): void {
    if(!this.userId) {
      this.openSnackBar('User ID is not available', 'Close');
      return;
    };

    this.employeesService.getById(this.userId).subscribe({
      next: (employee: any) => {
        this.filters.user.id = this.userId;

        this.schedulesService.getById(employee[0].id).subscribe({
          next: (schedules: any) => {
            this.schedules = schedules.schedules;
            const dayOfWeek = new Date().getUTCDay() || 7; 
            const todaySchedule = this.schedules.find(
              (schedule: any) => schedule.days.some((day: any) => day.id === dayOfWeek)
            );
    
            if (todaySchedule) {
              const start = moment.tz(todaySchedule.start_time, 'HH:mm', this.companyTimezone);
              const end = moment.tz(todaySchedule.end_time, 'HH:mm', this.companyTimezone);
              const currentTime = moment.tz();
              
              start.set({
                year: currentTime.year(),
                month: currentTime.month(),
                date: currentTime.date(),
              });
              end.set({
                year: currentTime.year(),
                month: currentTime.month(),
                date: currentTime.date(),
              });
              if (end.isBefore(start)) end.add(1, 'day');
    
              const totalWorkHours = end.diff(start, 'hours', true);

              this.entriesService.getUsersEntries(this.userId).subscribe({
                next: (entries: any) => {
                  // filter entries by current day
                  const entriesToday = entries.entries.filter(
                    (entry: any) => moment(entry.start_time).isSame(moment().format('YYYY-MM-DD'), 'day')
                  );
                  // sum up the hours of today's entries
                  this.hoursElapsed = entriesToday.reduce((acc: number, entry: any) => {
                    const duration = (new Date(entry.end_time).getTime() - new Date(entry.start_time).getTime()) / (1000 * 60 * 60);
                    return acc + duration;
                  }, 0);
                  
                  const activeEntry = entriesToday.find(
                    (entry: any) => entry.status === 0
                  );
                  // sum up the hours of today's active entries
                  if (activeEntry) {
                    const startTime = moment.utc(activeEntry.start_time);
                    const currentTime = moment.tz();
                    this.hoursElapsed += currentTime.diff(startTime, 'hours', true);
                  }
                  this.hoursRemaining = totalWorkHours - this.hoursElapsed;

                  // Update daily hours chart
                  this.dailyHoursChart.series = [
                    Number(this.hoursElapsed.toFixed(2)), 
                    Number(this.hoursRemaining.toFixed(2))
                  ];
                  
                  this.getWeeklyHours();
                }
              });
            }
          },
          error: (err) => {
            console.error(err);
            this.openSnackBar('Error fetching schedules', 'Close');
          }
        });
      }
    });
  }

  goBack(): void {
    this.location.back(); 
  }

  openSnackBar(message: string, action: string): void {
    this.snackBar.open(message, action, {
      duration: 2000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }
}