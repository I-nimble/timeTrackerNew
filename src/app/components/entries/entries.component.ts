import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject,
} from '@angular/core';
import { CustomDatePipe } from '../../services/custom-date.pipe';
import { EntriesService } from '../../services/entries.service';
import { Entries } from '../../models/Entries';
import { PagesComponent } from '../../pages/pages.component';
import { ModalComponent } from '../confirmation-modal/modal.component';
import { MatDialog } from '@angular/material/dialog';
import { EntryComponent } from '../entry/entry.component';
import { SharedModule } from '../shared.module';
import { NotificationStore } from 'src/app/stores/notification.store';
import * as moment from 'moment';

@Component({
  selector: 'app-entries',
  templateUrl: './entries.component.html',
  styleUrls: ['./entries.component.scss'],
  standalone: true,
  imports: [EntryComponent, SharedModule],
})
export class EntriesComponent implements OnInit {
  store = inject(NotificationStore);
  @Output() getEntries: EventEmitter<any> = new EventEmitter<any>();
  @Output() onDeleteEntry: EventEmitter<any> = new EventEmitter<any>();
  @Output() onAuthorizeEntry: EventEmitter<any> = new EventEmitter<any>();
  @Input() entries: any;
  @Input() reviewEntries: any = [];
  @Input() loaded?: boolean;
  @Input() admin?: boolean = true;
  updateDate: Date = new Date();
  currentEntryId: number = 0;
  timer: any = '00:00:00';
  currenttime: any;
  message: any;
  offHours: boolean = false;
  morebtn?: any;
  menuoff?: any;
  regex = /^\d+$/;
  entry: Entries = {
    status: 0,
    task: '',
    start_time: new Date(),
    end_time: new Date(),
  };
  constructor(
    private entriesService: EntriesService,
    private customDate: CustomDatePipe,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.loaded = false;
  }

  deleteEntry(id: number) {
    const dialog = this.dialog.open(ModalComponent, {
      data: { subject: 'entry' },
    });
    dialog.afterClosed().subscribe((option: boolean) => {
      if (option) {
        this.onDeleteEntry.emit(id);
      }
    });
  }
  authorizeEntry(entry: any) {
    const dialog = this.dialog.open(ModalComponent, {
      data: { subject: 'entry', action: 'confirm' },
    });
    dialog.afterClosed().subscribe((option: boolean) => {
      if (option) {
        entry.status = 1;
        this.onAuthorizeEntry.emit(entry);
      }
    });
  }
  updateTask(entry: any) {
    this.entriesService
      .updateEntryTask(entry.task_id, entry)
      .subscribe({
        next: (res) => {
        // this.message = res.message;
        // this.store.addNotifications(this.message);
        this.getEntries.emit();
      }, error: (res) => {
        this.message = res.message;
        this.store.addNotifications(this.message);
        this.getEntries.emit();
      }
      });
  }

  updateStart_date(data: any) {
    const { entry, event } = data;
    let input = (event.target as HTMLInputElement).value; 
    const newData = {
      start_time: this.getFormatByDate(entry.start_time, input),
      end_time: this.toUTCString(entry.end_time),
      date: entry.date.toString(),
    };
    if(!newData.start_time || !newData.end_time || !newData.date || !entry.id) {
      this.store.addNotifications("Invalid data");
    }
    this.entriesService.updateEntry(entry.id, newData).subscribe({
      next: () => {
        this.getEntries.emit();
        // this.message = 'Start time updated successfully!';
        // this.store.addNotifications(this.message);
      },
      error: (e) => {
        this.message = e.error.message;
        this.store.addNotifications(this.message);
        this.getEntries.emit();
      },
    });
  }
  updateEnd_date(data: any) {
    const { entry, event } = data;
    let input = (event.target as HTMLInputElement).value; 
    const newData = {
      start_time: this.toUTCString(entry.start_time),
      end_time: this.getFormatByDate(entry.end_time, input),
      date: entry.date.toString(),
    };
    if(!newData.start_time || !newData.end_time || !newData.date || !entry.id) {
      this.store.addNotifications("Invalid data");
    }
    this.entriesService.updateEntry(entry.id, newData).subscribe({
      next: () => {
        this.getEntries.emit();
        // this.message = 'End time updated successfully!';
        // this.store.addNotifications(this.message);
      },
      error: (e) => {
        this.message = e.error.message;
        this.store.addNotifications(this.message);
        this.getEntries.emit();
      },
    });
  }
  updateStart_time(data: any) {
    const { entry, event } = data;
    let input = (event.target as HTMLInputElement).value;
    if (this.regex.test(input)) {
      if (input.length == 3) {
        input = 0 + input;
      }
      const newData = {
        start_time: this.getFormatByTime(entry.start_time, input),
        end_time: this.toUTCString(entry.end_time),
        date: entry.date.toString(),
      };
      if(!newData.start_time || !newData.end_time || !newData.date || !entry.id) {
        this.store.addNotifications("Invalid data");
      }
      this.entriesService.updateEntry(entry.id, newData).subscribe({
        next: () => {
          this.getEntries.emit();
          // this.message = 'Start time updated successfully!';
          // this.store.addNotifications(this.message);
        },
        error: (e) => {
          this.message = e.error.message;
          this.store.addNotifications(this.message);
          this.getEntries.emit();
        },
      });
    } else {
      this.getEntries.emit();
    }
  }
  updateEnd_time(data: any) {
    const { entry, event } = data;
    let input = (event.target as HTMLInputElement).value;
    if (this.regex.test(input)) {
      if (input.length == 3) {
        input = 0 + input;
      }
      const newData = {
        start_time: this.toUTCString(entry.start_time),
        end_time: this.getFormatByTime(entry.end_time, input),
        date: entry.date.toString(),
      };
      if(!newData.start_time || !newData.end_time || !newData.date || !entry.id) {
        this.store.addNotifications("Invalid data");
      }
      this.entriesService.updateEntry(entry.id, newData).subscribe({
        next: (v) => {
          this.getEntries.emit();
          // this.message = 'End time updated successfully!';
          // this.store.addNotifications(this.message);
        },
        error: (e) => {
          this.message = e.error.message;
          this.store.addNotifications(this.message);
          this.getEntries.emit();
        },
      });
    } else {
      this.getEntries.emit();
    }
  }
  getFormatByTime(date: Date, value: any) {
    const seconds = this.customDate.transform(date, 'ss');
    const [hours, minutes] = [value.slice(0, 2), value.slice(2)];
    const newYear = new Date(date).getFullYear();
    const newMonth = new Date(date).getMonth();
    const newDay = new Date(date).getDate();
    const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const newMoment = moment(`${newYear}-${(newMonth + 1).toString().padStart(2, '0')}-${newDay.toString().padStart(2, '0')}T${hours}:${minutes}:${seconds}`).tz(localTimeZone, true)
    const newUTCMoment = newMoment.clone().utc()
    return newUTCMoment.format("YYYY-MM-DDTHH:mm:ss.000Z");
  }
  getFormatByDate(date: Date, value: any) {
    const dateString = date.toString()
    let timeString = dateString.split('T')[1].split('.')[0];
    const [hours, minutes, seconds] = timeString.split(':');
    const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const newMoment = moment(`${value}T${hours}:${minutes}:${seconds}`).tz(localTimeZone, true)
    const newUTCMoment = newMoment.clone().utc()
    return newUTCMoment.format("YYYY-MM-DDTHH:mm:ss.000Z");
  }
  toUTCString(date: Date) {
    const dateTimeString = date.toString()
    const dateParts = dateTimeString.split('T')
    const timeString = dateParts[1].split('.')[0];
    const dateString = dateParts[0]
    const [hours, minutes, seconds] = timeString.split(':');
    const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const newMoment = moment(`${dateString}T${hours}:${minutes}:${seconds}`).tz(localTimeZone, true)
    const newUTCMoment = newMoment.clone().utc()
    return newUTCMoment.format("YYYY-MM-DDTHH:mm:ss.000Z");
  }
}
