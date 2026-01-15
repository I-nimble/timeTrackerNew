import { Component, OnInit, OnDestroy, AfterViewChecked, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
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
import { TimezoneService } from 'src/app/services/timezone.service';
import { Subscription } from 'rxjs';
import { TablerIconsModule } from 'angular-tabler-icons';
import { PermissionService } from 'src/app/services/permission.service';
import { WebSocketService } from 'src/app/services/socket/web-socket.service';
import { GeolocationUpdate } from 'src/app/models/geolocation.model';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LocationService } from 'src/app/services/location.service';
import { map, tileLayer, icon, marker } from 'leaflet';

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
    MatMenuModule,
    TablerIconsModule,
    MatTooltipModule
  ]
})
export class EmployeeDetailsComponent implements OnInit, OnDestroy, AfterViewChecked {
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
  userTimezone: string = 'UTC';
  timezoneOffset: string = '';
  private timezoneSubscription!: Subscription;
  userPermissions: string[] = [];
  canManageTeamMembers: boolean = false;

  employeeLocation: GeolocationUpdate | null = null;
  isMapLoading: boolean = false;
  mapError: string | null = null;
  private geolocationUpdateSubscription!: Subscription;
  private geolocationDeniedSubscription!: Subscription;
  private geolocationTimeout: any;
  @ViewChild('leafletMap') leafletMapRef!: ElementRef;
  private leafletMap: any = null;
  private leafletMarker: any = null;
  private mapInitialized: boolean = false;

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
    private timezoneService: TimezoneService,
    private permissionService: PermissionService,
    private router: Router,
    private webSocketService: WebSocketService,
    private cdr: ChangeDetectorRef,
    private locationService: LocationService
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

    this.timezoneSubscription = this.timezoneService.userTimezone$.subscribe(timezone => {
      this.userTimezone = timezone;
      this.timezoneOffset = this.timezoneService.getCurrentTimezoneOffset();
    });

    const userId = Number(localStorage.getItem('id'));
    this.permissionService.getUserPermissions(userId).subscribe({
      next: (userPerms: any) => {
        this.userPermissions = userPerms.effectivePermissions || [];
        this.canManageTeamMembers = this.userPermissions.includes('users.manage');
        
        if (this.canManageTeamMembers && this.userRole !== '2' && this.userId) {
          this.setupGeolocationListeners();
          this.requestEmployeeGeolocation();
        }
      },
      error: (err) => {
        console.error('Error fetching user permissions', err);
      },
    });
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    if (this.timezoneSubscription) {
      this.timezoneSubscription.unsubscribe();
    }
    if (this.geolocationUpdateSubscription) {
      this.geolocationUpdateSubscription.unsubscribe();
    }
    if (this.geolocationDeniedSubscription) {
      this.geolocationDeniedSubscription.unsubscribe();
    }
    if (this.geolocationTimeout) {
      clearTimeout(this.geolocationTimeout);
    }
    if (this.leafletMap) {
      this.leafletMap.remove();
      this.leafletMap = null;
    }
  }

  ngAfterViewChecked(): void {
    if (this.employeeLocation && this.leafletMapRef && !this.mapInitialized) {
      this.updateLeafletMap();
    }
  }

  initializeEditForm(entry: any): void { 
    const entryDate = moment.utc(entry.date).format('YYYY-MM-DD');
    
    let startDateTime = entry.local_start_time || entry.start_time;
    let endDateTime = entry.local_end_time || entry.end_time;
    
    if (startDateTime && typeof startDateTime === 'string' && !startDateTime.startsWith(entryDate)) {
      const startTime = this.getTimeFromDateTime(startDateTime);
      startDateTime = `${entryDate}T${startTime}`;
    }
    
    if (endDateTime && typeof endDateTime === 'string' && !endDateTime.startsWith(entryDate)) {
      const endTime = this.getTimeFromDateTime(endDateTime);
      endDateTime = `${entryDate}T${endTime}`;
    }
    
    const form = new FormGroup<EditEntryForm>({
      start_time: new FormControl<string>(startDateTime, { nonNullable: true }),
      end_time: new FormControl<string>(endDateTime, { nonNullable: true })
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
    return `${this.userTimezone} (${this.timezoneOffset})`;
  }

  convertUTCToLocalDateTime(utcTime: string): string {  
    return this.timezoneService.convertUTCToLocalDateTime(utcTime, this.userTimezone);
  }

  convertLocalDateTimeToUTC(localTime: string): string {    
    return this.timezoneService.convertLocalDateTimeToUTC(localTime, this.userTimezone);
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
    if (!timeString) return '--:--';
    
    try {
      if (timeString.includes('AM') || timeString.includes('PM')) {
        return timeString;
      }
      let momentTime: moment.Moment;
      
      if (timeString.includes('T')) {
        momentTime = moment(timeString);
      } else {
        momentTime = moment(timeString, ['YYYY-MM-DD HH:mm:ss', 'HH:mm:ss', 'HH:mm']);
      }
      return momentTime.format('hh:mm A');
    } catch (error) {
      console.error('Error formatting time:', error, timeString);
      return '--:--';
    }
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
    
    const startDateTimeUTC = startDateTime 
      ? moment.tz(startDateTime, this.userTimezone).utc().format('YYYY-MM-DDTHH:mm:ss') + 'Z'
      : '';
      
    const endDateTimeUTC = endDateTime 
      ? moment.tz(endDateTime, this.userTimezone).utc().format('YYYY-MM-DDTHH:mm:ss') + 'Z'
      : '';
    
    const entryDate = formValue.start_time?.split('T')[0] || moment(entry.date).format('YYYY-MM-DD');
    
    const updateData = {
      start_time: startDateTimeUTC,
      end_time: endDateTimeUTC,
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
        const startOfRange = moment.utc(this.startDate).startOf('day').toDate();
        const endOfRange = moment.utc(this.endDate).endOf('day').toDate();
        
        this.weekEntries = response.entries
          .filter((entry: any) => {
            const entryDate = moment.utc(entry.date).toDate();
            return entryDate >= startOfRange && entryDate <= endOfRange;
          })
          .map((entry: any) => {
            const startTime = new Date(entry.start_time);
            const endTime = entry.end_time ? new Date(entry.end_time) : null;
            
            let totalHours = 0;
            let isActive = false;
            
            if (endTime && !isNaN(endTime.getTime()) && !isNaN(startTime.getTime()) && endTime > startTime) {
              totalHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
            } else if (!endTime) {
              isActive = true;
              const currentTime = new Date();
              if (!isNaN(startTime.getTime()) && currentTime > startTime) {
                totalHours = (currentTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
              }
            }
            
            totalHours = Math.max(0, totalHours);
            
            const localStartTime = this.convertUTCToLocalDateTime(entry.start_time);
            const localEndTime = entry.end_time ? this.convertUTCToLocalDateTime(entry.end_time) : null;
            
            return {
              ...entry,
              is_active: isActive, 
              total_hours: totalHours.toFixed(2),
              start_time_display: this.formatTime(localStartTime),
              end_time_display: entry.end_time ? this.formatTime(localEndTime || '') : null,
              local_start_time: localStartTime,
              local_end_time: localEndTime
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
    return moment.utc(dateString).format('MMM DD, YYYY');
  }


  getDayName(dateString: string): string {
    return moment.utc(dateString).format('dddd');
  }

  getTotalWeekHours(): number {
    return this.weekEntries.reduce((total: number, entry: any) => {
      if (entry.end_time) {
        return total + parseFloat(entry.total_hours || 0);
      }
      return total;
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
      if (entry.end_time) {
        const date = moment(entry.start_time).tz(this.companyTimezone).format('ddd');
        const startTime = new Date(entry.start_time);
        const endTime = new Date(entry.end_time);
        
        if (!isNaN(startTime.getTime()) && !isNaN(endTime.getTime()) && endTime > startTime) {
          const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
          acc[date] = (acc[date] || 0) + duration;
        }
      }
      return acc;
    }, {});

    // Sum up the current day entry if it is active
    const today = moment().format('ddd');
    const activeEntry = this.entries.find(
      (entry: any) => moment(entry.start_time).isSame(moment().format('YYYY-MM-DD'), 'day') && 
                    entry.status === 0 && 
                    !entry.end_time
    );
    
    if (activeEntry) {
      const startTime = moment.utc(activeEntry.start_time);
      const currentTime = moment.utc();
      
      if (startTime.isValid() && currentTime.isAfter(startTime)) {
        const hoursWorked = currentTime.diff(startTime, 'hours', true);
        workedHoursPerDay[today] = (workedHoursPerDay[today] || 0) + Math.max(0, hoursWorked);
      }
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
        data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(day => {
          const worked = workedHoursPerDay[day.substring(0, 3)] || 0;
          return Number(Math.max(0, worked));
        }),
      },
      {
        name: 'Not worked',
        data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(day => {
          const total = totalHoursPerDay[day.substring(0, 3)] || 0;
          const worked = workedHoursPerDay[day.substring(0, 3)] || 0;
          return Number(Math.max(0, total - worked));
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
                    if (entry.end_time) {
                      const startTime = new Date(entry.start_time);
                      const endTime = new Date(entry.end_time);
                      const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
                      return acc + duration;
                    }
                    return acc;
                  }, 0);
                  
                  const activeEntry = entriesToday.find(
                    (entry: any) => entry.status === 0 && !entry.end_time
                  );
                  
                  // sum up the hours of today's active entries
                  if (activeEntry) {
                    const startTime = moment.utc(activeEntry.start_time);
                    const currentTime = moment.utc();
                    this.hoursElapsed += currentTime.diff(startTime, 'hours', true);
                  }
                  
                  this.hoursElapsed = Math.max(0, this.hoursElapsed);
                  this.hoursRemaining = Math.max(0, totalWorkHours - this.hoursElapsed);

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


  private setupGeolocationListeners(): void {
    this.geolocationUpdateSubscription = this.webSocketService.getGeolocationUpdateStream().subscribe({
      next: (data: GeolocationUpdate) => {
        if (data.userId.toString() == this.userId?.toString()) {
          this.employeeLocation = data;
          this.isMapLoading = false;
          this.mapError = null;
          
          this.cdr.detectChanges();
          this.updateLeafletMap();
          
          if (this.geolocationTimeout) {
            clearTimeout(this.geolocationTimeout);
          }
        }
      },
      error: (err) => {
        console.error('Error receiving geolocation update', err);
        this.isMapLoading = false;
        this.mapError = 'Error receiving location data';
      }
    });

    this.geolocationDeniedSubscription = this.webSocketService.getGeolocationDeniedStream().subscribe({
      next: (data) => {
        if (data.userId.toString() === this.userId) {
          this.isMapLoading = false;
          this.mapError = 'Employee has denied location access';
          this.openSnackBar('Employee has denied location access', 'Close');
          
          if (this.geolocationTimeout) {
            clearTimeout(this.geolocationTimeout);
          }
        }
      },
      error: (err) => {
        console.error('Error receiving geolocation denied', err);
      }
    });
  }

  private requestEmployeeGeolocation(): void {
    if (!this.userId) return;

    this.isMapLoading = true;
    this.mapError = null;
    this.employeeLocation = null;

    this.employeesService.getEmployeeGeolocation(Number(this.userId)).subscribe({
      next: (geolocation: any) => {
        if (geolocation && geolocation.latitude && geolocation.longitude) {
          if(!this.userId) {
            console.error('No user ID found');
            return;
          };
          this.employeeLocation = {
            userId: this.userId,
            deviceId: geolocation.device_id || 'unknown',
            latitude: parseFloat(geolocation.latitude),
            longitude: parseFloat(geolocation.longitude),
            accuracy: geolocation.accuracy,
            timestamp: geolocation.timestamp
          };
          this.cdr.detectChanges();
          this.updateLeafletMap();
          this.isMapLoading = false;
        }
        
        this.webSocketService.requestGeolocation(Number(this.userId));
      },
      error: (err) => {
        console.warn('No initial location found for employee, requesting via socket...', err);
        this.webSocketService.requestGeolocation(Number(this.userId));
        
        this.geolocationTimeout = setTimeout(() => {
          if (this.isMapLoading && !this.employeeLocation) {
            this.isMapLoading = false;
            this.mapError = 'Unable to get employee location. They may be offline.';
            this.cdr.detectChanges();
          }
        }, 30000);
      }
    });
  }

  updateLeafletMap(): void {
    if (!this.employeeLocation) {
      return;
    }
    if (!this.leafletMapRef) {
      return;
    }

    const lat = this.employeeLocation.latitude;
    const lng = this.employeeLocation.longitude;

    if (!this.leafletMapRef || !this.leafletMapRef.nativeElement) {
      return;
    }

    if (!this.leafletMap) {
      this.leafletMap = map(this.leafletMapRef.nativeElement).setView([lat, lng], 15);
      
      const tiles = tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      });

      tiles.on('tileerror', (error) => {
        console.error('Leaflet tile load error:', error);
      });

      tiles.addTo(this.leafletMap);
      
      const mapIcon = icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });
      
      this.leafletMarker = marker([lat, lng], { icon: mapIcon }).addTo(this.leafletMap);
      this.leafletMarker.bindPopup(`Employee Location`).openPopup();
      
      this.mapInitialized = true;
    } else {
      this.leafletMap.setView([lat, lng], 15);
      if (this.leafletMarker) {
        this.leafletMarker.setLatLng([lat, lng]);
      }
    }
    
    setTimeout(() => {
      this.leafletMap?.invalidateSize();
    }, 100);
  }

  refreshLocation(): void {
    if (this.canManageTeamMembers && this.userRole !== '2' && this.userId) {
      this.mapInitialized = false;
      if (this.leafletMap) {
        this.leafletMap.remove();
        this.leafletMap = null;
        this.leafletMarker = null;
      }
      this.requestEmployeeGeolocation();
    }
  }
}
