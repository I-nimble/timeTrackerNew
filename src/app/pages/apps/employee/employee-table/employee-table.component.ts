import {
  AfterViewInit,
  Component,
  Inject,
  Input,
  OnInit,
  Output,
  Optional,
  ViewChild,
  EventEmitter,
} from '@angular/core';
import { MatTableDataSource, MatTable } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { DatePipe } from '@angular/common';
import { AppAddEmployeeComponent } from '../add/add.component';
import { FormArray, FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { Employee } from 'src/app/pages/apps/employee/employee';
import { EmployeesService } from 'src/app/services/employees.service';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { UsersService } from 'src/app/services/users.service';
import { CompaniesService } from 'src/app/services/companies.service';
import { PositionsService } from 'src/app/services/positions.service';
import { environment } from 'src/environments/environment';
import { SchedulesService } from 'src/app/services/schedules.service';
import { ReportsService } from 'src/app/services/reports.service';
import { ProjectsService } from 'src/app/services/projects.service';
import {
  ReportFilter,
} from 'src/app/components/reports-filter/reports-filter.component';
import moment from 'moment-timezone';
import * as filesaver from 'file-saver';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TimerComponent } from 'src/app/components/timer-component/timer.component';
import { AppDateRangeDialogComponent } from 'src/app/components/date-range-dialog/date-range-dialog.component';
import { SelectionModel } from '@angular/cdk/collections';


@Component({
  templateUrl: './employee-table.component.html',
  imports: [
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TablerIconsModule,
    CommonModule,
    RouterModule,
    TimerComponent,
    MatPaginatorModule
  ],
  selector: 'app-employee-table',
  standalone: true,
})
export class AppEmployeeTableComponent implements AfterViewInit {
  @ViewChild(MatTable, { static: true }) table: MatTable<any> =
    Object.create(null);

  @Input() displayedColumns: string[] = [
    'select',
    'name',
    'status',
    'schedule',
    'projects',
    'action'
  ];
  users: any[] = [];
  employees: any[] = [];
  loaded: boolean = false;
  company: any;
  companyTimezone: string = 'America/Los_Angeles';
  timeZone: string = 'America/Caracas';
  assetsPath: string = environment.assets;
  filters: ReportFilter = {
    user: 'all',
    company: 'all',
    project: 'all',
    byClient: false,
    useTimezone: false,
    multipleUsers: false,
  };
  userRole = localStorage.getItem('role');
  companies: any[] = [];
  companyId: number | null = null;

  searchText: any;

  private _inputData: any[] = [];

  @Input() set dataSource(data: any[]) {
    this._inputData = data;
    this.dataSourceTable.data = data;
  }

  @Output() getEmployees = new EventEmitter<any>();

  dataSourceTable = new MatTableDataSource<any>([]);
  selection = new SelectionModel<any>(true, []);


  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngAfterViewInit() {
    this.dataSourceTable.paginator = this.paginator;
  }

  constructor(
    public dialog: MatDialog,
    private employeesService: EmployeesService,
    private userService: UsersService,
    private schedulesService: SchedulesService,
    private reportsService: ReportsService,
    private companiesService: CompaniesService,
  ) {}

  openDialog(action: string, employee: Employee | any): void {
    const dialogRef = this.dialog.open(AppEmployeeDialogContentComponent, {
      data: { action, employee },
      autoFocus: false,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.event === 'Delete' && result?.id) {
        this.dataSourceTable.data = this.dataSourceTable.data.filter(
          (emp: any) => emp.profile.id !== result.id
        );
      }
      else {
        this.getEmployees.emit();
      }
    });
  }

  // Helper function to format days as a range "Monday to Friday"
  formatDaysRange(days: string[]): string {
    const weekDays = [
      'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
    ];
    const indices = days.map(day => weekDays.indexOf(day)).filter(i => i !== -1).sort((a, b) => a - b);
    if (indices.length === 0) return '';
    // Check if days are consecutive
    let isConsecutive = true;
    for (let i = 1; i < indices.length; i++) {
      if (indices[i] !== indices[i - 1] + 1) {
        isConsecutive = false;
        break;
      }
    }
    if (isConsecutive && indices.length > 1) {
      return `${weekDays[indices[0]]} to ${weekDays[indices[indices.length - 1]]}`;
    } else {
      return days.join(', ');
    }
  }

  setUser(user: any): void {
    this.employees.map((employee: any) => {
      user.id == employee.user.id ? user = employee.user : null;
    });

    this.userService.setUserInformation(user.profile);
  }

  downloadReport(user: any): void {
    let selectedIds = this.selection.selected.map((u:any) => u.profile.id);
    if (!selectedIds.includes(user.profile.id)) {
      selectedIds.push(user.profile.id);
    }
    this.filters = {
      user: { id: selectedIds.length > 1 ? selectedIds : user.profile.id },
      company: 'all',
      project: 'all',
      byClient: false,
      useTimezone: false,
      multipleUsers: selectedIds.length > 1,
    };

    const dialogRef = this.dialog.open(AppDateRangeDialogComponent, {
      data: {},
      autoFocus: false,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const datesRange = {
          firstSelect: result.firstSelect,
          lastSelect: result.lastSelect,
        };

        this.employees.map((employee: any) => {
          user.id == employee.user.id ? user = employee.user : null;
        });
        this.reportsService
          .getReport(datesRange, user, this.filters)
          .subscribe((v) => {
            let filename;
            let display_name;
            if (this.filters.multipleUsers) {
              display_name = 'multiple_users';
            }
            else {
              display_name = `${user.name}_${user.last_name}`;
            }
    
            filename = `I-nimble_Report_${display_name}_${moment( 
              new Date(datesRange.firstSelect)
            ).format('DD-MM-YYYY')}_${moment(
              new Date(datesRange.lastSelect)
            ).format('DD-MM-YYYY')}.xlsx`;
    
            filesaver.saveAs(v, filename);
          });
      }
    });
  }

  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSourceTable.data.length;
    return numSelected === numRows;
  }

  masterToggle(): void {
    this.isAllSelected() ?
      this.selection.clear() :
      this.dataSourceTable.data.forEach(row => this.selection.select(row));
  }

  checkboxLabel(row?: any): string {
    if (!row) {
      return `${this.isAllSelected() ? 'select' : 'deselect'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.position + 1}`;
  }
}

interface DialogData {
  action: string;
  employee: Employee;
}

@Component({
  // tslint:disable-next-line: component-selector
  selector: 'app-dialog-content',
  imports: [
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    TablerIconsModule,
  ],
  templateUrl: '../employee-dialog-content.html',
})
// tslint:disable-next-line: component-class-suffix
export class AppEmployeeDialogContentComponent {
  action: string | any;
  local_data: any;
  joiningDate = new FormControl();
  positions: any[] = [];
  projects: any[] = [];
  selectedFile: File | null = null;
  sendingData: boolean = false;
  editEmployeeForm: FormGroup;
  inviteEmployeeForm: FormGroup;
  companies: any[] = [];
  userRole = localStorage.getItem('role');
  existingSchedules: any[] = [];
  timeZone: string = 'America/Caracas';

  constructor(
    public dialog: MatDialog,
    public dialogRef: MatDialogRef<AppEmployeeDialogContentComponent>,
    private employeesService: EmployeesService,
    private usersService: UsersService,
    private snackBar: MatSnackBar,
    private positionsService: PositionsService,
    private projectsService: ProjectsService,
    private fb: FormBuilder,
    private companiesService: CompaniesService,
    private schedulesService: SchedulesService,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.action = data.action;
    this.local_data = { ...data.employee };

    this.editEmployeeForm = this.fb.group({
      name: ['', Validators.required],
      last_name: ['', Validators.required],
      password: [''],
      email: ['', [Validators.required, Validators.email]],
      company_id: ['', this.userRole === '1' ? Validators.required : []],
      position: ['', Validators.required],
      projects: [[]],
      scheduleGroups: this.fb.array([])
    });
  
    this.inviteEmployeeForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      company_id: ['', Validators.required],
    });

    if(this.action === 'Update') {
      this.editEmployeeForm.patchValue({
        name: this.local_data.profile.name,
        last_name: this.local_data.profile.last_name,
        password: null,
        email: this.local_data.profile.email,
        company_id: this.local_data.profile.company_id || '',
        position: this.local_data.profile.position,
        projects: this.local_data.profile.projects || [],
      });
      this.loadEmployeeSchedules();
    }

    this.positionsService.get().subscribe((positions: any) => {
      this.positions = positions;
    });

    this.companiesService.getCompanies().subscribe((companies: any) => {
      this.companies = companies;
    });

    this.projectsService.get().subscribe((projects: any) => {
      this.projects = projects;
    });

    if(this.action === 'Invite') {
      this.companiesService.getCompanies().subscribe((companies: any) => {
        this.companies = companies;
        if(this.userRole === '3') {
          this.companiesService.getByOwner().subscribe((company: any) => {
            this.inviteEmployeeForm.patchValue({
              company_id: company.company.id
            });
          });
        }
        else if (this.userRole === '1' || this.userRole === '4') {
          this.inviteEmployeeForm.patchValue({
            company_id: this.local_data.profile.company_id || ''
          });
        }
      });
    }

    if (!this.local_data.profile.imagePath) {
      this.local_data.profile.imagePath = 'assets/images/default-user-profile-pic.png';
    }
  }

  get scheduleGroups() {
    return this.editEmployeeForm.get('scheduleGroups') as FormArray;
  }

  convertUTCToVenezuelaTime(utcTime: string): string {  
    try {
      let cleanTime = utcTime;
      if (cleanTime.includes(':')) {
        const parts = cleanTime.split(':');
        cleanTime = `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
      }
      
      const today = new Date();
      const [hours, minutes, seconds] = cleanTime.split(':');
      today.setUTCHours(parseInt(hours), parseInt(minutes || '0'), parseInt(seconds || '0'), 0);
      
      const venezuelaTime = moment(today).tz(this.timeZone).format('HH:mm');
      return venezuelaTime;
    } catch (error) {
      console.error('Error converting time:', error, 'for time:', utcTime);
      return '00:00';
    }
  }

  convertVenezuelaTimeToUTC(localTime: string): string {    
    try {
      const today = new Date();
      const [hours, minutes] = localTime.split(':');
      today.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      const utcTime = moment(today).utc().format('HH:mm:ss');
      return utcTime;
    } catch (error) {
      console.error('Error converting time to UTC:', error);
      return '00:00:00';
    }
  }

  groupSchedulesByTime(schedules: any[]): any[] {
    const groups: any[] = [];
    
    schedules.forEach(schedule => {
      
      const startTime = this.convertUTCToVenezuelaTime(schedule.start_time);
      const endTime = this.convertUTCToVenezuelaTime(schedule.end_time);
      
      const days = schedule.days ? schedule.days.map((day: any) => day.name) : [];
      
      const existingGroup = groups.find(group => 
        group.start_time === startTime && group.end_time === endTime
      );
      
      if (existingGroup) {
        days.forEach((day: string) => {
          if (!existingGroup.days.includes(day)) {
            existingGroup.days.push(day);
          }
        });
      } else {
        groups.push({
          start_time: startTime,
          end_time: endTime,
          days: [...days],
          originalSchedule: schedule
        });
      }
    });
    
    return groups;
  }

  addScheduleGroup(days: string[] = ['Monday'], start_time: string = '09:00', end_time: string = '17:00'): void {
    const scheduleGroup = this.fb.group({
      days: [days, Validators.required],
      start_time: [start_time, Validators.required],
      end_time: [end_time, Validators.required]
    });
    
    this.scheduleGroups.push(scheduleGroup);
  }

  removeScheduleGroup(index: number): void {
    this.scheduleGroups.removeAt(index);
  }

  getSelectedDaysPreview(days: string[]): string {
    if (days.length === 0) return 'No days selected';
    if (days.length === 7) return 'Every day';
    
    const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const indices = days.map(day => weekDays.indexOf(day)).filter(i => i !== -1).sort((a, b) => a - b);
    
    if (indices.length === 0) return '';
    
    let isConsecutive = true;
    for (let i = 1; i < indices.length; i++) {
      if (indices[i] !== indices[i - 1] + 1) {
        isConsecutive = false;
        break;
      }
    }
    
    if (isConsecutive && indices.length > 1) {
      return `${weekDays[indices[0]]} to ${weekDays[indices[indices.length - 1]]}`;
    } else {
      return days.join(', ');
    }
  }

  loadEmployeeSchedules(): void {
  this.schedulesService.getByUserId(this.local_data.profile.id).subscribe({
    next: (schedules: any) => {
      this.existingSchedules = schedules.schedules || [];

      while (this.scheduleGroups.length !== 0) {
        this.scheduleGroups.removeAt(0);
      }
      
      const groupedSchedules = this.groupSchedulesByTime(this.existingSchedules);
      
      groupedSchedules.forEach(group => {
        this.addScheduleGroup(
          group.days,
          group.start_time,
          group.end_time
        );
      });
    },
    error: (error) => {
      console.error('Error loading schedules:', error);
    }
  });
  }

  isDaySelected(day: string): boolean {
    for (let group of this.scheduleGroups.controls) {
      const days = group.get('days')?.value || [];
      if (days.includes(day)) {
        return true;
      }
    }
    return false;
  }

  getAvailableDays(currentGroupIndex: number): string[] {
    const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    if (currentGroupIndex === -1) {
      return allDays;
    }
    
    const selectedDays: string[] = [];
    
    this.scheduleGroups.controls.forEach((group, index) => {
      if (index !== currentGroupIndex) {
        const days = group.get('days')?.value || [];
        selectedDays.push(...days);
      }
    });
    
    return allDays.filter(day => !selectedDays.includes(day));
  }

  doAction(): void {
    if (this.action === 'Invite') {
      this.sendingData = true;
      if(!this.inviteEmployeeForm.valid) {
        this.openSnackBar('Please fill in all required fields', 'Close');
        this.sendingData = false;
        return;
      }
      const invitationData = {
        name: this.inviteEmployeeForm.value.name,
        email: this.inviteEmployeeForm.value.email,
        company_id: this.inviteEmployeeForm.value.company_id,
      };
      this.employeesService.inviteEmployee(invitationData).subscribe({
        next: () => {
          this.dialogRef.close({ event: 'Refresh' });
          this.openSnackBar('Team Member Invited successfully!', 'Close');
          this.sendingData = false;
          this.inviteEmployeeForm.reset();
        },
        error: (err: any) => {
          console.error('Error adding Team Member:', err);
          const errorMsg = err?.error?.message || 'Error inviting Team Member';
          this.openSnackBar(errorMsg, 'Close');
          this.sendingData = false;
          this.inviteEmployeeForm.reset();
        }
      });
    } else if (this.action === 'Update') {
      if(!this.editEmployeeForm.valid) {
        this.openSnackBar('Please fill in all required fields', 'Close');
        this.sendingData = false;
        return;
      }

      this.sendingData = true;

      const scheduleData = this.prepareScheduleData();
      
      const employeeData = {
        ...this.editEmployeeForm.value,
        schedules: scheduleData
      };

      this.employeesService.updateEmployee(
        this.local_data.profile.id, 
        employeeData, 
        this.local_data.profile.company_id, 
        this.selectedFile
      ).subscribe({
        next: () => {
          this.dialogRef.close({ event: 'Update' });
          this.openSnackBar('Team Member Updated successfully!', 'Close');
            this.sendingData = false;
          },
          error: (err: any) => {
          console.error('Error updating Team Member:', err);
          this.openSnackBar('Error updating Team Member', 'Close');
          this.sendingData = false;
        }
      });
    } else if (this.action === 'Delete') {
      this.employeesService.deleteEmployee(this.local_data.profile.id).subscribe({
        next: () => {
          this.dialogRef.close({ event: 'Delete', id: this.local_data.profile.id });
          this.openSnackBar('Team Member Deleted successfully!', 'Close');
        },
        error: (err:any) => {
          console.error('Error deleting Team Member:', err);
          this.openSnackBar('Error deleting Team Member', 'Close');
        },
      });
    }
  }

  prepareScheduleData(): any[] {
    const scheduleData: any[] = [];
    
    this.scheduleGroups.value.forEach((group: any) => {
      if (group.days && group.days.length > 0 && group.start_time && group.end_time) {
        group.days.forEach((day: string) => {
          const startTime = this.convertVenezuelaTimeToUTC(group.start_time);
          const endTime = this.convertVenezuelaTimeToUTC(group.end_time);
          
          scheduleData.push({
            day: day,
            start_time: startTime,
            end_time: endTime
          });
        });
      }
    });
    return scheduleData;
  }

  openSnackBar(message: string, action: string) {
    this.snackBar.open(message, action, {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }

  closeDialog(): void {
    this.dialogRef.close({ event: 'Cancel' });
  }

  selectFile(event: any): void {
    const img = event.target.files[0];

    if (!img || img.length === 0) {
      this.openSnackBar('Please select an image', 'Close');
      return;
    }
    if(img.size > 1000000) {
      this.openSnackBar('Image size should be 1 MB or less', 'Close')
      return
    }
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(img.type)) {
      this.openSnackBar('Only JPG or PNG files are allowed!', 'Close');
      return;
    }

    this.selectedFile = img;
    if(this.selectedFile) {
      const reader = new FileReader();
      reader.readAsDataURL(this.selectedFile);
      reader.onload = (_event) => {
        this.local_data.profile.imagePath = reader.result;
      };
    }
  }
}
