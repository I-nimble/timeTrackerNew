import { CommonModule } from '@angular/common';
import {
  Component,
  Inject,
  OnInit,
  Optional,
  OnDestroy,
  NgZone,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import {
  FormArray,
  FormControl,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';

import { TablerIconsModule } from 'angular-tabler-icons';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { Employee } from 'src/app/legacy/pages/apps/employee/employee';
import { CompaniesService } from 'src/app/legacy/services/companies.service';
import { EmployeesService } from 'src/app/legacy/services/employees.service';
import { PositionsService } from 'src/app/legacy/services/positions.service';
import { ProjectsService } from 'src/app/legacy/services/projects.service';
import { SchedulesService } from 'src/app/legacy/services/schedules.service';
import { TimezoneService } from 'src/app/legacy/services/timezone.service';
import { MaterialModule } from 'src/app/material.module';
import { LoggerService } from 'src/app/shared/services/logger.service';

interface DialogData {
  action: string;
  employee: Employee;
  permissions: {
    canView: false;
    canEdit: false;
    canManage: false;
    canDelete: false;
  };
}

@Component({
  selector: 'app-dialog-content',
  imports: [
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    TablerIconsModule,
  ],
  templateUrl: './employee-dialog-content.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppEmployeeDialogContentComponent implements OnInit, OnDestroy {
  action: string | any;
  local_data: any;
  joiningDate = new FormControl();
  positions: any[] = [];
  projects: any[] = [];
  selectedFile: File | null = null;
  sendingData = false;
  editEmployeeForm: FormGroup;
  inviteEmployeeForm: FormGroup;
  companies: any[] = [];
  userRole = localStorage.getItem('role');
  existingSchedules: any[] = [];
  timeZone = 'America/Caracas';
  userTimezone = 'UTC';
  timezoneOffset = '';
  maxFileSize: number = 1 * 1024 * 1024;
  readonly compareCompany = (left: unknown, right: unknown): boolean =>
    Number(left ?? 0) === Number(right ?? 0);
  permissions!: {
    canView: false;
    canEdit: false;
    canManage: false;
    canDelete: false;
  };

  private timezoneSubscription!: Subscription;
  private destroy$ = new Subject<void>();
  private log = Inject(LoggerService);

  public dialog = Inject(MatDialog);
  public dialogRef = Inject(MatDialogRef<AppEmployeeDialogContentComponent>);
  private employeesService = Inject(EmployeesService);
  private positionsService = Inject(PositionsService);
  private projectsService = Inject(ProjectsService);
  private companiesService = Inject(CompaniesService);
  private schedulesService = Inject(SchedulesService);
  private timezoneService = Inject(TimezoneService);
  private ngZone = Inject(NgZone);
  private cdr = Inject(ChangeDetectorRef);
  @Optional() @Inject(MAT_DIALOG_DATA) public data: DialogData;
  private fb = Inject(FormBuilder);

  constructor() {
    this.action = this.data.action;
    this.local_data = { ...this.data.employee };
    this.permissions = this.data.permissions;
    this.editEmployeeForm = this.fb.group({
      name: ['', Validators.required],
      last_name: ['', Validators.required],
      password: [''],
      email: ['', [Validators.required, Validators.email]],
      company_id: ['', this.userRole === '1' ? Validators.required : []],
      position: ['', Validators.required],
      projects: [[]],
      hourly_rate: [0, [Validators.min(0), Validators.max(1000)]],
      scheduleGroups: this.fb.array([]),
    });

    this.inviteEmployeeForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      company_id: ['', Validators.required],
      hourly_rate: [0, [Validators.min(0), Validators.max(1000)]],
    });

    if (this.action === 'Update') {
      this.editEmployeeForm.patchValue({
        name: this.local_data.profile.name,
        last_name: this.local_data.profile.last_name,
        password: null,
        email: this.local_data.profile.email,
        company_id: this.normalizeCompanyId(this.local_data.profile.company_id),
        position: this.local_data.profile.position,
        projects: this.local_data.profile.projects || [],
        hourly_rate: this.local_data.profile.hourly_rate || 0,
      });
    }

    if (!this.local_data.profile.imagePath) {
      this.local_data.profile.imagePath =
        'assets/images/default-user-profile-pic.webp';
    }
  }

  ngOnInit(): void {
    this.ngZone.runOutsideAngular(() => {
      this.timezoneSubscription = this.timezoneService.userTimezone$
        .pipe(takeUntil(this.destroy$))
        .subscribe((timezone) => {
          Promise.resolve().then(() => {
            this.ngZone.run(() => {
              this.userTimezone = timezone;
              this.timezoneOffset =
                this.timezoneService.getCurrentTimezoneOffset();

              if (this.action === 'Update' && this.getProfileId() !== null) {
                this.loadEmployeeSchedules();
              }
            });
          });
        });

      this.positionsService
        .get()
        .pipe(takeUntil(this.destroy$))
        .subscribe((positions: any) => {
          Promise.resolve().then(() => {
            this.ngZone.run(() => {
              this.positions = positions;
            });
          });
        });

      this.companiesService
        .getCompanies()
        .pipe(takeUntil(this.destroy$))
        .subscribe((companies: any) => {
          Promise.resolve().then(() => {
            this.ngZone.run(() => {
              this.companies = companies;
              if (this.action === 'Update') {
                this.syncEditCompanySelection();
                this.editEmployeeForm.markAllAsTouched();
                this.cdr.markForCheck();
              }
            });
          });
        });

      this.projectsService
        .get()
        .pipe(takeUntil(this.destroy$))
        .subscribe((projects: any) => {
          Promise.resolve().then(() => {
            this.ngZone.run(() => {
              this.projects = projects;
            });
          });
        });

      if (this.action === 'Invite') {
        this.companiesService
          .getCompanies()
          .pipe(takeUntil(this.destroy$))
          .subscribe((companies: any) => {
            Promise.resolve().then(() => {
              this.ngZone.run(() => {
                this.companies = companies;

                if (this.userRole === '3') {
                  this.companiesService
                    .getByOwner()
                    .pipe(takeUntil(this.destroy$))
                    .subscribe((company: any) => {
                      Promise.resolve().then(() => {
                        this.ngZone.run(() => {
                          if (company) {
                            const companyId = this.normalizeCompanyId(
                              company?.company?.id ?? company?.id,
                            );
                            if (companyId !== null) {
                              this.inviteEmployeeForm.patchValue({
                                company_id: companyId,
                              });
                            }
                          }
                        });
                      });
                    });
                } else if (this.userRole === '1' || this.userRole === '4') {
                  this.inviteEmployeeForm.patchValue({
                    company_id: this.normalizeCompanyId(
                      this.local_data?.profile?.company_id,
                    ),
                  });
                }
              });
            });
          });
      }
    });
  }

  private normalizeCompanyId(value: unknown): number | null {
    const companyId = Number(value ?? 0);
    return companyId > 0 ? companyId : null;
  }

  private syncEditCompanySelection(): void {
    const companyId = this.normalizeCompanyId(
      this.local_data?.profile?.company_id,
    );

    if (companyId !== null) {
      this.editEmployeeForm.patchValue({ company_id: companyId });
    }
  }

  private getProfileId(): number | null {
    const candidate =
      this.local_data?.profile?.user_id ??
      this.local_data?.user_id ??
      this.local_data?.profile?.id ??
      this.local_data?.id ??
      null;
    const profileId = Number(candidate ?? 0);
    return profileId > 0 ? profileId : null;
  }

  private getEmployeeId(): number | null {
    const candidate =
      this.local_data?.profile?.employee_id ??
      this.local_data?.profile?.id ??
      this.local_data?.id ??
      null;
    const employeeId = Number(candidate ?? 0);
    return employeeId > 0 ? employeeId : null;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.timezoneSubscription) {
      this.timezoneSubscription.unsubscribe();
    }
  }

  get scheduleGroups() {
    return this.editEmployeeForm.get('scheduleGroups') as FormArray;
  }

  convertUTCToLocalTime(utcTime: string): string {
    return this.timezoneService.convertUTCToLocalTime(
      utcTime,
      this.userTimezone,
    );
  }

  convertLocalTimeToUTC(localTime: string): string {
    return this.timezoneService.convertLocalTimeToUTC(
      localTime,
      this.userTimezone,
    );
  }

  groupSchedulesByTime(schedules: any[]): any[] {
    const groups: any[] = [];

    schedules.forEach((schedule) => {
      const startTime = this.convertUTCToLocalTime(schedule.start_time);
      const endTime = this.convertUTCToLocalTime(schedule.end_time);

      const days = schedule.days
        ? schedule.days.map((day: any) => day.name)
        : [];

      const existingGroup = groups.find(
        (group) => group.start_time === startTime && group.end_time === endTime,
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
          originalSchedule: schedule,
        });
      }
    });

    return groups;
  }

  addScheduleGroup(
    days: string[] = [],
    start_time = '09:00',
    end_time = '17:00',
  ): void {
    const scheduleGroup = this.fb.group({
      days: [days, Validators.required],
      start_time: [start_time, Validators.required],
      end_time: [end_time, Validators.required],
    });

    this.scheduleGroups.push(scheduleGroup);
  }

  removeScheduleGroup(index: number): void {
    this.scheduleGroups.removeAt(index);
  }

  getSelectedDaysPreview(days: string[]): string {
    if (days.length === 0) return 'No days selected';
    if (days.length === 7) return 'Every day';

    const weekDays = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ];
    const indices = days
      .map((day) => weekDays.indexOf(day))
      .filter((i) => i !== -1)
      .sort((a, b) => a - b);

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
    const profileId = this.getProfileId();
    if (!profileId) {
      this.log.warn('User ID missing, skipping schedule load');
      return;
    }
    this.schedulesService
      .getByUserId(profileId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (schedules: any) => {
          this.ngZone.run(() => {
            this.existingSchedules = schedules.schedules || [];

            while (this.scheduleGroups.length !== 0) {
              this.scheduleGroups.removeAt(0);
            }

            const groupedSchedules = this.groupSchedulesByTime(
              this.existingSchedules,
            );

            groupedSchedules.forEach((group) => {
              this.addScheduleGroup(
                group.days,
                group.start_time,
                group.end_time,
              );
            });

            this.cdr.markForCheck();
          });
        },
        error: (error) => {
          this.log.error('Error loading schedules:', error);
        },
      });
  }

  isDaySelected(day: string): boolean {
    for (const group of this.scheduleGroups.controls) {
      const days = group.get('days')?.value || [];
      if (days.includes(day)) {
        return true;
      }
    }
    return false;
  }

  getAvailableDays(currentGroupIndex: number): string[] {
    const allDays = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ];

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

    return allDays.filter((day) => !selectedDays.includes(day));
  }

  doAction(): void {
    if (this.action === 'Invite') {
      this.sendingData = true;
      if (!this.inviteEmployeeForm.valid) {
        this.openSnackBar('Please fill in all required fields', 'Close');
        this.sendingData = false;
        return;
      }
      const invitationData = {
        name: this.inviteEmployeeForm.value.name,
        email: this.inviteEmployeeForm.value.email,
        company_id: this.inviteEmployeeForm.value.company_id,
        hourly_rate: this.inviteEmployeeForm.value.hourly_rate || 0,
        user_timezone: this.userTimezone,
      };
      this.employeesService.inviteEmployee(invitationData).subscribe({
        next: () => {
          this.dialogRef.close({ event: 'Refresh' });
          this.openSnackBar('Team Member Invited successfully!', 'Close');
          this.sendingData = false;
          this.inviteEmployeeForm.reset();
        },
        error: (err: any) => {
          this.log.error('Error adding Team Member:', err);
          const errorMsg = err?.error?.message || 'Error inviting Team Member';
          this.openSnackBar(errorMsg, 'Close');
          this.sendingData = false;
          this.inviteEmployeeForm.reset();
        },
      });
    } else if (this.action === 'Update') {
      if (!this.editEmployeeForm.valid) {
        this.openSnackBar('Please fill in all required fields', 'Close');
        this.sendingData = false;
        return;
      }

      this.sendingData = true;

      const scheduleData = this.prepareScheduleData();

      const employeeData = {
        ...this.editEmployeeForm.value,
        schedules: scheduleData,
        user_timezone: this.userTimezone,
      };

      const profileId = this.getProfileId();
      if (profileId === null) {
        this.openSnackBar('Missing employee id', 'Close');
        this.sendingData = false;
        return;
      }

      const companyId = this.normalizeCompanyId(
        this.local_data?.profile?.company_id,
      );
      if (companyId === null) {
        this.openSnackBar('Missing company id', 'Close');
        this.sendingData = false;
        return;
      }

      this.employeesService
        .updateEmployee(profileId, employeeData, companyId, this.selectedFile)
        .subscribe({
          next: () => {
            this.dialogRef.close({ event: 'Update' });
            this.openSnackBar('Team Member Updated successfully!', 'Close');
            this.sendingData = false;
          },
          error: (err: any) => {
            this.log.error('Error updating Team Member:', err);
            this.openSnackBar('Error updating Team Member', 'Close');
            this.sendingData = false;
          },
        });
    } else if (this.action === 'Delete') {
      const profileId = this.getProfileId();
      if (profileId === null) {
        this.openSnackBar('Missing employee id', 'Close');
        return;
      }

      this.employeesService.deleteEmployee(profileId).subscribe({
        next: () => {
          this.dialogRef.close({
            event: 'Delete',
            id: profileId,
          });
          this.openSnackBar('Team Member Deleted successfully!', 'Close');
        },
        error: (err: any) => {
          this.log.error('Error deleting Team Member:', err);
          this.openSnackBar('Error deleting Team Member', 'Close');
        },
      });
    }
  }

  prepareScheduleData(): any[] {
    const scheduleData: any[] = [];

    this.scheduleGroups.value.forEach((group: any) => {
      if (
        group.days &&
        group.days.length > 0 &&
        group.start_time &&
        group.end_time
      ) {
        group.days.forEach((day: string) => {
          const startTime = this.convertLocalTimeToUTC(group.start_time);
          const endTime = this.convertLocalTimeToUTC(group.end_time);

          scheduleData.push({
            day: day,
            start_time: startTime,
            end_time: endTime,
            metadata: {
              user_timezone: this.userTimezone,
              converted_at: new Date().toISOString(),
            },
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
    if (img.size > this.maxFileSize) {
      this.openSnackBar('Image size should be 1 MB or less', 'Close');
      return;
    }
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(img.type)) {
      this.openSnackBar('Only JPG or PNG files are allowed!', 'Close');
      return;
    }

    this.selectedFile = img;
    if (this.selectedFile) {
      const reader = new FileReader();
      reader.readAsDataURL(this.selectedFile);
      reader.onload = () => {
        this.local_data.profile.imagePath = reader.result;
      };
    }
  }

  getTimezoneInfo(): string {
    return `${this.userTimezone} (${this.timezoneOffset})`;
  }
}
