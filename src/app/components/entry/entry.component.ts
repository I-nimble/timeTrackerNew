import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { SharedModule } from '../shared.module';
import { CustomDatePipe } from 'src/app/services/custom-date.pipe';
import { Entries } from 'src/app/models/Entries';

@Component({
  selector: 'app-entry',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './entry.component.html',
  styleUrl: './entry.component.scss',
})
export class EntryComponent implements OnInit {
  @Output() onUpdateStartTime: EventEmitter<any> = new EventEmitter<any>();
  @Output() onUpdateEndTime: EventEmitter<any> = new EventEmitter<any>();
  @Output() onUpdateStartDate: EventEmitter<any> = new EventEmitter<any>();
  @Output() onUpdateEndDate: EventEmitter<any> = new EventEmitter<any>();
  @Output() onUpdateTask: EventEmitter<any> = new EventEmitter<any>();
  @Output() onDeleteEntry: EventEmitter<any> = new EventEmitter<any>();
  @Output() onAuthorizeEntry: EventEmitter<any> = new EventEmitter<any>();
  @Input() entry: any;
  @Input() suspicious: boolean = false;
  @Input() admin?: boolean;
  public startDate?: any;
  public endDate?: any;

  btnActions: any = [
    {
      icon: 'fa-solid fa-check',
      forReview: true,
      method: 'authorize',
      class: 'btn-success',
    },
    {
      icon: 'fa-regular fa-trash-can',
      forReview: false,
      method: 'delete',
      class: 'btn-danger',
    },
  ];
  constructor(private customDate: CustomDatePipe) {}

  ngOnInit(): void {
    const userType = localStorage.getItem('role')
    if(userType){
      if(userType === '1') {
        this.admin = true
      } else {
        this.admin = false
      }
    }

    this.startDate = this.entry.start_time.toString().split('T')[0];
    this.endDate = this.entry.end_time.toString().split('T')[0];
  }

  updateStart_time(entry: any, event: Event) {
    this.onUpdateStartTime.emit({ entry, event });
  }
  updateEnd_time(entry: any, event: Event) {
    this.onUpdateEndTime.emit({ entry, event });
  }
  updateStart_date(entry: any, event: Event) {
    this.onUpdateStartDate.emit({ entry, event });
  }
  updateEnd_date(entry: any, event: Event) {
    this.onUpdateEndDate.emit({ entry, event });
  }
  
  updateTask(entry: any, event: any) {
    this.onUpdateTask.emit(entry);
  }

  handleAction(action: string, entry: Entries){
    switch (action){
      case 'authorize':
        this.authorize(entry)
        break;
      case 'delete':
        this.deleteEntry(entry)
        break;
    }
  }
  authorize(entry: any) {
    this.onAuthorizeEntry.emit(entry);
  }

  deleteEntry(entry: any) {
    this.onDeleteEntry.emit(entry.id);
  }

  timeFormat(event: any) {
    event.target.value = event.target.value.replace(/:/g, '');
  }

  getTotalHours(start: Date, end: Date) {
    const [startformat, endformat] = [new Date(start), new Date(end)];
    const starts = startformat.getTime();
    const ends = endformat.getTime();
    const difference = ends - starts;
    const hours = Math.floor(difference / 1000 / 60 / 60);
    const minutes = Math.floor((difference / 1000 / 60) % 60);
    const seconds = Math.floor((difference / 1000) % 60);
    return (
      this.padZero(hours) +
      ':' +
      this.padZero(minutes) +
      ':' +
      this.padZero(seconds)
    );
  }

  padZero(num: number): string {
    return num < 10 ? `0${num}` : `${num}`;
  }

  public isToday(date: any) {
    const yesterday = this.customDate.transform(
      new Date(Date.now() - 24 * 60 * 60 * 1000),
      'DD-MM-YYYY'
    );
    const today = this.customDate.transform(new Date(), 'DD-MM-YYYY');
    const compareDate = this.customDate.transform(
      date.toLocaleString(),
      'DD-MM-YYYY'
    );
    if (compareDate === today) {
      return 'Today';
    } else if (compareDate === yesterday) {
      return 'Yesterday';
    } else {
      return false;
    }
  }
}
