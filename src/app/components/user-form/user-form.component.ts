import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';
import { Roles } from 'src/app/models/Roles';
import {
  FormGroup,
  FormControl,
  Validators,
  FormBuilder,
} from '@angular/forms';
import { Loader } from 'src/app/app.models';
import { User } from 'src/app/models/User.model';
import { CompaniesService } from 'src/app/services/companies.service';
import { UsersService } from 'src/app/services/users.service';
import { ModalComponent } from '../confirmation-modal/modal.component';
import { MatDialog } from '@angular/material/dialog';
import { PositionsService } from 'src/app/services/positions.service';
import { Positions } from 'src/app/models/Position.model';
import { TimezoneService } from 'src/app/services/timezone.service';
import { FormDialogComponent } from '../form-dialog/form-dialog.component';
import { SharedModule } from '../shared.module';
import { CustomDatePipe } from 'src/app/services/custom-date.pipe';
import { NotificationStore } from 'src/app/stores/notification.store';
import { MoreVertComponent, options } from '../more-vert/more-vert.component';
import { DomSanitizer } from '@angular/platform-browser';
import * as moment from 'moment';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [SharedModule, MoreVertComponent],
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.scss'],
})
export class UserFormComponent implements OnInit, OnChanges {
  notificationStore = inject(NotificationStore);
  @Input() selectedUser: any;
  @Output() onSaveSelectedUser: EventEmitter<any> = new EventEmitter<any>();
  @Output() onDeletedUser: EventEmitter<any> = new EventEmitter<any>();
  @Output() onMobileCloseForm: EventEmitter<any> = new EventEmitter<any>();
  scheduleOptions: options[] = [
    { name: 'Edit', action: 'edit', icon: 'fa-regular fa-pen-to-square' },
    { name: 'Remove', action: 'delete', icon: 'fa-solid fa-trash' },
  ];

  img: any;
  newUser: User = {
    id: '-1',
    name: '',
    last_name: '',
    email: '',
    password: '',
    role: 0,
    active: 1,
  };
  loader: Loader = new Loader(false, false, false);
  roleList!: Roles[];
  title: string = 'New User';
  userForm!: FormGroup;
  message: string = '';
  companies: any;
  positions: Positions[] = [];
  ADMIN_ROLE = '1';
  EMPLOYEE_ROLE = '2';
  EMPLOYER_ROLE = '3';
  timezones!: any;
  assetsPath: string = environment.assets + '/default-profile-pic.png';

  selectedDaysOfWeek: string[] = [];
  public show: boolean = false;

  constructor(
    private userService: UsersService,
    private fb: FormBuilder,
    private companiesService: CompaniesService,
    private positionsService: PositionsService,
    private timezoneService: TimezoneService,
    private customDate: CustomDatePipe,
    private dialog: MatDialog,
  ) {
    this.userForm = this.fb.group({
      profile: [''],
      name: [null, [Validators.required]],
      last_name: [null, [Validators.required]],
      email: [null, [Validators.required]],
      role: ['', [Validators.required]],
      password: [''],
      cpassword: [''],
      company: this.fb.group({
        id: ['', [Validators.required]],
      }),
      employee: this.fb.group({
        id: [''],
        position: ['', [Validators.required]],
        hourly_rate: [''],
        schedule: [[]],
      }),
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedUser']) {
      this.resetForm();
      if (!this.selectedUser) {
        this.title = 'New User';
        return;
      }
      this.getImage()
      this.userForm.patchValue(this.selectedUser);
      if (this.selectedUser) {
        this.title = 'Edit User';
        this.userForm.get('password')?.clearValidators();
      }
      if (!this.selectedUser.employee && this.selectedUser.role == 2) {
        this.userForm.get('employee')?.get('id')?.setValue('');
      }
      this.userForm.get('password')?.updateValueAndValidity();
      for (let propName in this.selectedUser) {
        if (propName == 'employee') {
          for (let employeeKey in this.selectedUser[propName]) {
            if (this.selectedUser[propName][employeeKey] == null) {
              this.userForm.get(propName)?.get(employeeKey)?.setValue('');
            }
          }
        }
      }
      this.img = null;
      this.handlePasswordValidity();
      // this.newUser = this.selectedUser;
      // if (this.userForm.get('company.id')?.value == null) {
      //   this.userForm.get('company.id')?.setValue('');
      // }
    }
  }

  ngOnInit(): void {
    this.getRoles();
    this.getCompanies();
    this.getPositions();
    // this.userForm
    //   .get('email')!
    //   .valueChanges.pipe(debounceTime(1000), distinctUntilChanged())
    //   .subscribe((email) => {
    //     const userId = this.selectedUser ? this.selectedUser.id : -1;
    //     this.userService.verifyUsername(email, userId).subscribe({
    //       next: (v: any) => {
    //         console.log(v);
    //       },
    //       error: (err: any) => {
    //         console.error(err);
    //       },
    //     });
    //   });
    this.handleRole();
    this.timezoneService.fetchTimezonesApi().subscribe((data: any) => {
      if (data.status === 'OK' && Array.isArray(data.zones)) {
        this.timezones = data.zones.map((timezone: any) => {
          timezone.fechaActual = this.timezoneService.convertTimezone(timezone);
          return timezone;
        });
      } else {
        console.error('Error: Invalid data structure');
      }
    });
  }

  resetForm() {
    this.userForm.reset();
    this.userForm.reset({ password: '', cpassword: '' });
    this.userForm.get('role')?.setValue('');
  }

  handlePasswordValidity() {
    const password = this.userForm.get('password');

    if (this.selectedUser && password?.value == '') {
      password?.clearValidators();
    } else {
      password?.setValidators([Validators.required, Validators.minLength(8)]);
    }

    password?.updateValueAndValidity();
  }

  handleRole() {
    this.userForm.get('role')!.valueChanges.subscribe((role: string) => {
      const companyGroup = this.userForm.get('company') as FormGroup;
      const employeeGroup = this.userForm.get('employee') as FormGroup;
      companyGroup.reset();
      employeeGroup.reset();
      if (role == this.ADMIN_ROLE) {
        for (let controlName in companyGroup.controls) {
          companyGroup.removeControl(controlName);
        }
        for (let controlId in employeeGroup.controls) {
          employeeGroup.removeControl(controlId);
        }
      }
      if (role == this.EMPLOYEE_ROLE) {
        for (let controlName in companyGroup.controls) {
          companyGroup.removeControl(controlName);
        }

        if (!employeeGroup.get('position')) {
          employeeGroup.addControl(
            'position',
            this.fb.control('', Validators.required)
          );
        }
        if (!employeeGroup.get('hourly_rate')) {
          employeeGroup.addControl(
            'hourly_rate',
            this.fb.control(null, Validators.required)
          );
        }
        employeeGroup.addControl('id', this.fb.control(''));
        employeeGroup.addControl('schedule', this.fb.control([]));

        if (!this.selectedUser) {
          this.userForm.get('employee')?.get('id')?.setValue('');
          this.userForm.get('employee')?.get('position')?.setValue('');
        }
      } else if (role == this.EMPLOYER_ROLE) {
        for (let controlId in employeeGroup.controls) {
          employeeGroup.removeControl(controlId);
        }
        companyGroup.addControl('id', this.fb.control(''));
        if (!this.selectedUser) {
          companyGroup.get('id')?.setValue('');
        }
      }
    });
  }

  public getRoles() {
    this.userService.getRoles().subscribe({
      next: (roles: any) => {
        this.roleList = roles;
      },
    });
  }
  public getImage() {
    if(this.selectedUser.id) {
      this.userService.getProfilePic(this.selectedUser.id).subscribe({
        next: (image: any) => {
          if(image) {
            this.img = image;
          }
        }
      });
    }
  }
  public getCompanies() {
    this.companiesService.getCompanies().subscribe({
      next: (companies) => {
        this.companies = companies;
      },
    });
  }

  public getPositions() {
    this.positionsService.get().subscribe({
      next: (positions: Positions[]) => {
        this.positions = positions;
      },
    });
  }

  setUserCompany(target: any) {
    const company = this.companies.find(
      (company: any) => company.id == target.value
    );
    this.userForm
      .get('company')
      ?.patchValue({ name: company.name, description: company.description });
  }

  public submitUserForm() {
    this.loader = new Loader(true, false, false);
    if (
      this.userForm.valid &&
      this.userForm.value.role !== 'Select a role' &&
      this.userForm.value.company.id !== 'Select a company'
    ) {
      if (this.selectedUser) this.newUser.id = this.selectedUser.id;
      else this.newUser.id = '-1';
      if (this.userForm.value.password === this.userForm.value.cpassword) {
        this.message = '';
        this.newUser.name = this.userForm.value.name;
        this.newUser.last_name = this.userForm.value.last_name;
        this.newUser.email = this.userForm.value.email;
        this.newUser.role = this.userForm.value.role;
        this.newUser.password = this.userForm.value.password;
        this.newUser.profile = this.userForm.value.profile;
        if (this.userForm.value.role == this.EMPLOYER_ROLE) {
          if (this.userForm.value.company != null) {
            this.newUser.company = { id: this.userForm.value.company.id };
            this.newUser.company!.name = this.userForm.value.company.name;
            this.newUser.company!.timezone =
              this.userForm.value.company.timezone;
            if (this.userForm.value.company.description != null) {
              this.newUser.company!.description =
                this.userForm.value.company.description;
            }
          }
        }
        if (
          this.userForm.value.employee &&
          this.EMPLOYEE_ROLE == this.userForm.value.role
        ) {
          this.newUser.employee = { id: this.userForm.value.employee.id };
          this.newUser.employee!.position =
            this.userForm.value.employee.position;
          this.newUser.employee!.hourly_rate =
            this.userForm.value.employee.hourly_rate;
          if (this.userForm.value.employee.schedule) {
            this.newUser.employee!.schedule = this.userForm.value.employee.schedule.map((
              (schedule:any) => {
                return {
                  ...schedule, 
                  start_time: this.convertIntoUTCStr(schedule.start_time),
                  end_time: this.convertIntoUTCStr(schedule.end_time),
                }
            }))
          }
        }

        this.userService.createUser(this.newUser).subscribe({
          next: (user) => {
            this.onSaveSelectedUser.emit(user);
            this.loader = new Loader(true, true, false);
            // const message =
            //   this.newUser.id == '-1'
            //     ? 'User Added Successfully'
            //     : 'User Updated Successfully';
            // this.notificationStore.addNotifications(message, 'success');
          },
          error: (err) => {
            this.loader = new Loader(true, false, true);
            this.notificationStore.addNotifications(err.error.message, 'error');
          },
        });
      } else {
        this.loader = new Loader(true, false, true);
        this.notificationStore.addNotifications(
          'Confirm password error',
          'error'
        );
      }
    } else {
      this.loader = new Loader(true, false, true);
      this.notificationStore.addNotifications(
        'All fields must be filled',
        'error'
      );
    }
  }

  convertIntoUTCStr(timeString:string) {
    let hours, minutes
    if (timeString.includes(' ')) {
      const [time, modifier] = timeString.split(' ');
      [hours, minutes] = time.split(':').map(Number);
      if (modifier.toLowerCase() == 'pm' && hours !== 12) {
        hours += 12;
      } else if (modifier.toLowerCase() == 'am' && hours === 12) {
        hours = 0;
      }
    } else {
      [hours, minutes] = timeString.split(':').map(Number);
    }
    const today = new Date();
    const dateWithTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes, 0);
    const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const momentTime = moment(dateWithTime).tz(localTimeZone, true)
    const UTCTimeString = momentTime.utc().format('HH:mm:ss')
    return UTCTimeString;
  }

  public deleteUser(id: string) {
    const dialog = this.dialog.open(ModalComponent, {
      data: { subject: 'user' },
    });
    dialog.afterClosed().subscribe((value: any) => {
      if (value) {
        this.userService.delete(id).subscribe({
          next: (value) => {
            // this.notificationStore.addNotifications(
            //   'User Deleted Successfully',
            //   'success'
            // );
            this.onDeletedUser.emit(id);
          },
        });
      }
    });
  }

  openFormModal(type: string, fieldData?: any, index?: string) {
    let data = {
      type,
      fieldData,
    };
    const dialog = this.dialog.open(FormDialogComponent, { data });

    dialog.afterClosed().subscribe((result: boolean | any) => {
      if (result) {
        if (type == 'company') {
          this.companiesService.submit(result).subscribe({
            next: (response: any) => {
              this.companies.push(response);
            },
          });
          return;
        }

        if (
          this.userForm.get('employee')?.get('schedule')?.value &&
          this.userForm.get('employee')?.get('schedule')?.value.length > 0
        ) {
          const daysArray: Array<{ id: string; name: string }> =
            result[type].days;

          const scheduleDays = this.userForm
            .get('employee')
            ?.get(type)
            ?.value.map(
              (
                schedule: {
                  days: Array<{ id: string; name: string }>;
                  start_time: string;
                  end_time: string;
                },
                i: number
              ) => {
                if (i.toString() != index) {
                  return schedule.days.map(
                    (day: { id: string; name: string }) => {
                      return day.name;
                    }
                  );
                }
                return [];
              }
            )
            .flat();

          result[type].days = daysArray.filter(
            (day: { id: string; name: string }) =>
              scheduleDays.indexOf(day.name) == -1
          );
          let checkDays = daysArray.find(
            (day: { id: string; name: string }) =>
              scheduleDays.indexOf(day.name) != -1
          );

          if (checkDays) {
            this.notificationStore.addNotifications(
              "Cant't add days that have already been selected"
            );
          }
        }

        if (result[type].days.length > 0) {
          if(!this.scheduleField.value) this.scheduleField.setValue([]);
          let scheduleArray =
            this.scheduleField.value.map((schedule: any, i: number) => {
              if (index == i.toString()) {
                return result[type];
              } else {
                return schedule;
              }
            }) || [];
          if (!index) scheduleArray.push(result[type]);
          this.userForm.get('employee')?.get(type)?.setValue(scheduleArray);
        }
      }
    });
  }

  checkSelectedDays(): boolean {
    let count = 0;

    if (this.scheduleField && this.scheduleField.value) {
      this.scheduleField?.value.forEach((schedule: any) => {
        count = schedule.days.length + count;
      });
      if (count < 7) return false;
      return true;
    }
    return false;
  }

  private get scheduleField() {
    return this.userForm.get('employee')?.get('schedule') as FormControl;
  }

  displaySchedulesDays(days: any): String {
    return days
      .map((day: any) => day.name || day.day)
      .toString()
      .replaceAll(',', ', ');
  }

  displayScheduleTimes(timeStr: string) {
    let modifier;
    let hours, minutes;

    if (timeStr.includes(' ')) {
      return timeStr;
    } else {
      [hours, minutes] = timeStr.split(':', 2).map(Number);
      if (hours >= 12) {
        hours = hours == 12 ? hours : hours - 12;
        modifier = 'PM';
      } else if (hours == 0) {
        hours = 12;
        modifier = 'AM';
      } else if (hours < 12 && hours > 0) {
        modifier = 'AM';
      }
      return `${this.customDate.padzero(hours)}:${this.customDate.padzero(
        minutes
      )} ${modifier}`;
    }
  }

  removeDayFromSchedule(
    selectedDay: { id: string; name: string },
    i: number
  ): void {
    const daysArray = (
      this.scheduleField.value[i].days as Array<{ id: string; name: string }>
    ).filter((day) => day.id != selectedDay.id);
    if (daysArray.length < 1) {
      let schedule = this.scheduleField.value.filter(
        (schedule: any, index: number) => index != i
      );
      this.scheduleField.setValue(schedule);
    } else {
      this.scheduleField.value[i].days = daysArray;
    }
  }

  selectItem(event: { id: string; action: string }) {
    switch (event.action) {
      case 'edit':
        this.openFormModal(
          'schedule',
          this.scheduleField.value[event.id],
          event.id
        );
        break;
      case 'delete':
      case 'remove':
        let scheduleList = this.scheduleField.value.filter(
          (day: any, i: string) => event.id != i
        );
        this.scheduleField.setValue(scheduleList);
        break;
    }
  }

  onFileSelected(event: any) {
    const img = event.target.files[0];
    if (img) {
      if(img.size > 1000000) {
        this.notificationStore.addNotifications("Image size should be 1 MB or less", "error")
        return
      }
      if(img.type != 'image/jpeg') {
        this.notificationStore.addNotifications("Only .jpeg files are allowed!", "error")
        return
      }
      this.previewImage(img);
      this.userForm.patchValue({ profile: img });
    }
  }
  previewImage(file: File) {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.img = e.target.result;
    };
    reader.readAsDataURL(file);
  }
}
