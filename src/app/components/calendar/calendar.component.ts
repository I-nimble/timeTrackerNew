import {
  Component,
  OnInit,
  EventEmitter,
  Output,
  Input,
  SimpleChanges,
} from '@angular/core';
import * as moment from 'moment';
import { ReportsService } from 'src/app/services/reports.service';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss'],
})
export class CalendarComponent {
  @Output() rangeSelection: EventEmitter<any> = new EventEmitter<any>();
  @Output() getEntries: EventEmitter<any> = new EventEmitter<any>();
  @Input() datesRange = { firstSelect: '', lastSelect: '' };
  week: string[] = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];
  @Input() calendar!: string;
  monthSelect: any = [];
  dateSelect: any;
  firstSelect: boolean = false;

  constructor(private reportsService: ReportsService) {}

  ngOnInit() {
    this.getDaysfromDate(
      parseInt(moment().format('MM')),
      new Date().getFullYear()
    );
  }
  
  ngOnChanges(change: SimpleChanges) {}

  changeMonth(n: number) {
    const nextMonth = this.dateSelect.clone().add(n, 'month');
    this.getDaysfromDate(nextMonth.format('MM'), nextMonth.format('YYYY'));
  }

  getDaysfromDate(month: number, year: number) {
    const startDay = moment.utc(`${year}/${month}/01`, 'YYYYMMHH');
    const endDay = startDay.clone().endOf('month');
    this.dateSelect = endDay;

    const diffdays = endDay.diff(startDay, 'days', true);
    const numberDays = Math.round(diffdays);
    const arrayDays = Object.keys([...Array(numberDays)]).map((a: any) => {
      a = parseInt(a) + 1;

      const dayObject = moment(`${year}/${month}/${a}`, 'YYYY-MM-DD');
      return {
        name: dayObject.format('dddd'),
        value: a,
        fullDate: dayObject.format('YYYY/MM/DD'),
        indexWeek: dayObject.isoWeekday(),
      };
    });

    const remainingDaysBefore = startDay.isoWeekday() - 1;
    const remainingDaysAfter = 7 - endDay.isoWeekday();

    const previousMonthYear = month != 1 ? year : year-1
    const nextMonthYear = month != 12 ? year : year+1

    const previousMonthDates = this.getLastDaysOfPreviousMonth(
      remainingDaysBefore,
      previousMonthYear,
      endDay
    );
    const afterMonthDates = this.getFirstDaysOfNextMonth(
      remainingDaysAfter,
      nextMonthYear,
      startDay
    );
    this.monthSelect = [
      ...previousMonthDates,
      ...arrayDays,
      ...afterMonthDates,
    ];
  }

  private getMonthReference(i: number, reference: moment.Moment) {
    return moment(reference).clone().add(i, 'month').format('MM');
  }

  private getFirstDaysOfNextMonth(
    firstDays: number,
    year: number,
    dayReference: moment.Moment
  ) {
    const nextMonth = this.getMonthReference(1, dayReference);
    const remainDays = Object.keys([...Array(firstDays)]).map((a: any) => {
      a++;
      const dayObject = moment(`${year}/${nextMonth}/${a}`, 'YYYY/MM/DD');
      return this.formatDateResponse(dayObject);
    });
    return remainDays;
  }

  private getLastDaysOfPreviousMonth(
    lastDays: number,
    year: number,
    dayReference: moment.Moment
  ) {
    const previousMonth = this.getMonthReference(-1, dayReference);
    const dayIndex =
      parseInt(
        moment(dayReference)
          .clone()
          .subtract(1, 'month')
          .endOf('month')
          .format('DD')
      ) - lastDays;

    const remainDays = Object.keys([...Array(lastDays)]).map((a: any) => {
      a++;
      const dayObject = moment(
        `${year}/${previousMonth}/${dayIndex + parseInt(a)}`,
        'YYYY/MM/DD'
      );
      return this.formatDateResponse(dayObject);
    });
    return remainDays;
  }

  private formatDateResponse(data: moment.Moment, a?: string) {
    return {
      name: data.format('dddd'),
      value: data.format('D'),
      fullDate: data.format('YYYY/MM/DD'),
      indexWeek: data.isoWeekday(),
      className: 'opacity-50',
    };
  }

  selectRange(select: any) {
    if (!this.firstSelect) {
      this.datesRange.firstSelect = select;
      this.datesRange.lastSelect = select;
      this.firstSelect = true;
      return;
    }
    if (this.firstSelect) {
      this.datesRange.lastSelect = select;
      this.firstSelect = false;
      if (this.getTime(this.datesRange.firstSelect, select)) {
        this.datesRange.firstSelect = select;
        this.datesRange.lastSelect = '';
        this.firstSelect = true;
        return;
      }
    }
    let selection = {
      firstSelect: new Date(this.datesRange.firstSelect).toUTCString(),
      lastSelect: this.datesRange.lastSelect,
    };
    this.reportsService.setDateRange(
      (this.datesRange.firstSelect.replaceAll('/', '-')), 
      this.datesRange.lastSelect.replaceAll('/', '-')
    );
    this.rangeSelection.emit(selection);

    this.getEntries.emit();
  }

  getTime(date: any, selection: any) {
    const firtsDate = new Date(date).getTime();
    const select = new Date(selection).getTime();
    if (firtsDate >= select) {
      return true;
    } else {
      return false;
    }
  }
}
