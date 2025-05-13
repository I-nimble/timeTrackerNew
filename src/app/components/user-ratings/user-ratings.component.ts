import { ChangeDetectorRef, ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges, OnInit, ElementRef, inject } from '@angular/core';
import { SharedModule } from '../shared.module';
import { Observable } from 'rxjs';
import Chart from 'chart.js/auto';
import * as filesaver from 'file-saver';
import * as moment from 'moment';
import { RatingsService } from 'src/app/services/ratings.service';
import { RatingsEntriesService } from 'src/app/services/ratings_entries.service';
import { ReportFilter } from '../reports-filter/reports-filter.component';
import { UsersService } from 'src/app/services/users.service';
import { CustomDatePipe } from 'src/app/services/custom-date.pipe';
import { ReportsService } from 'src/app/services/reports.service';
import { CalendarComponent } from '../calendar/calendar.component';
import { NotificationStore } from 'src/app/stores/notification.store';
import { StarRateComponent } from 'src/app/components/star-rate/star-rate.component'
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatOption, MatSelect } from '@angular/material/select';
import { FormsModule } from '@angular/forms';

export interface Link {
  url: string;
  title: string;
}
@Component({
  selector: 'app-user-ratings',
  standalone: true,
  imports: [SharedModule, MatFormField, MatLabel, MatSelect, MatOption, FormsModule, StarRateComponent],
  templateUrl: './user-ratings.component.html',
  styleUrl: './user-ratings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CalendarComponent, StarRateComponent],
})
export class UserRatings implements OnChanges, OnInit {
  store = inject(NotificationStore);
  @Input() selectedUser?: Observable<any>;
  @Input() currUserRatings?: Observable<any[]>;
  public userData: any;
  public ratingsData: any[] = [];
  public loading: boolean = true;
  selectedGoal: any;
  selectedProject: any;
  entries: any = [];
  filteredEntries: any = [];
  isActive: boolean = false;
  datesSelection: any;
  datesRange: any = {};
  calendarHead: any;
  totalEntries: any = [];
  role = localStorage.getItem('role');
  params!: string;
  user: any = { id: null, name: null, company: null };
  projectId: string = '';
  selectedStarIndex = 0
  filters: ReportFilter = {
    user: 'all',
    company: 'all',
    project: 'all',
    byClient: false,
    useTimezone: false,
  };

  // chart init
  single: any;
  chart: any;
  ctx: any;
  canvas: any;
  data: any = [];
  labels: any = [];
  numericGoalValue = 0;
  entry:any

  // chart bottom
  constructor(
    private userService: UsersService,
    public customDate: CustomDatePipe,
    private reportsService: ReportsService,
    private elementRef: ElementRef,
    private cdr:ChangeDetectorRef,
    private ratingsService: RatingsService,
    private ratingsEntriesService: RatingsEntriesService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if(changes['selectedUser'] && changes['selectedUser'].currentValue != changes['selectedUser'].previousValue) {
      this.selectedUser?.subscribe((user) => {
        this.userData = user
        this.loading = false
        this.cdr.detectChanges();
      })
    }
    if(changes['currUserRatings'] && changes['currUserRatings'].currentValue != changes['currUserRatings'].previousValue) {
      this.currUserRatings?.subscribe((ratings) => {
        this.ratingsData = ratings
        this.loading = false  
        this.cdr.detectChanges();
      })
    }
  }

  ngOnInit(): void {
    this.defaultWeek();

    this.user = this.userService.selectedUser
      ? this.userService.selectedUser
      : null;

    this.filteredEntries = [];

    document.addEventListener('click', this.onClick.bind(this));
    this.canvas = document.getElementById('myChart') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d');
    let delayed: boolean;
    let self = this; 
    if (this.ctx) {
      this.chart = new Chart(this.ctx, {
        type: 'bar',
        data: {
          datasets: [
            {
              label: 'Completed',
              data: this.data.map((item: any) => item.value),
              backgroundColor: '#92b46c',
            },
            {
              label: 'Not Completed',
              data: this.data.map((item: any) => item.value),
              backgroundColor: '#cccccc',
            },
          ],
        },
        options: {
          animation: {
            onComplete: () => {
              delayed = true;
            },
            delay: (context) => {
              let delay = 0;
              if (
                context.type === 'data' &&
                context.mode === 'default' &&
                !delayed
              ) {
                delay = context.dataIndex * 300 + context.datasetIndex * 100;
              }
              return delay;
            },
          },
          responsive: true,
          scales: {
            x: {
              stacked: true,
            },
            y: {
              beginAtZero: true,
              stacked: true,
            },
          },
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: {
                generateLabels: (chart) => {
                  const originalLabels = Chart.defaults.plugins.legend.labels.generateLabels(chart);
                  return originalLabels.map((label) => {
                    if (label.text === 'Completed') {
                      label.fillStyle = '#92b46c'; 
                    } else if (label.text === 'Not Completed') {
                      label.fillStyle = '#cccccc'; 
                    }
                    return label;
                  });
                },
              },
            },
            tooltip: {
              callbacks: {
                label: function(context:any) {
                  let labelContent = [];
                  let isCompleted = context.dataset.label || '';
                  const justification = self.data[context.dataIndex].justification;

                  if (context.parsed.y !== null && self.data[context.dataIndex].isNumeric) {
                    const currentValue = context.parsed.y;
                    const numericGoal = self.data[context.dataIndex].goal;
                    labelContent.push(`${isCompleted}. Done: ${currentValue} | Goal: ${numericGoal}`);
                  }
                  
                  if (context.parsed.y !== null && !self.data[context.dataIndex].isNumeric) {
                    labelContent.push(`${isCompleted}: YES`);
                  }

                  if(justification) labelContent.push(`Justification: ${justification}`)

                  return labelContent;
                }
              }
            }
          }
          
        },
      });
    }
  }

  toggleCalendar() {
    this.isActive = !this.isActive;
  }

  onClick(event: MouseEvent): void {
    if (!(event.target as HTMLElement).closest('#content')) {
      this.isActive = false;
    }
  }

  handleSelection(filters: ReportFilter) {
    this.filters = filters;
    this.getEntries();
  }

  getEntries() {
    this.ratingsEntriesService
      .getByUser(this.userData.id)
      .subscribe((v) => {
        this.entries = v;
        this.setStarValue()
        this.arrangeEntries(v);
      });
  }

  downloadToDoReport() {        
    this.reportsService
      .getToDoReport(this.datesRange, { user: this.userData }, null)
      .subscribe((v) => {
        let filename;
        filename = `I-nimble_TODO_${moment(
          new Date(this.datesRange.firstSelect)
        ).format('DD-MM-YYYY')}_${moment(
          new Date(this.datesRange.lastSelect)
        ).format('DD-MM-YYYY')}.xlsx`;
        filesaver.saveAs(v, filename);
      });
  }

  defaultWeek() {
    const today = moment().format('DD/MM/YYYY');
    const firstday = moment().isoWeekday(1).format('DD/MM/YYYY');
    if (firstday == today) {
      this.getLastWeek();
    } else {
      const lastday = moment().isoWeekday(7).toLocaleString();
      this.datesRange = {
        firstSelect: moment(firstday, 'DD/MM/YYYY').format('YYYY/MM/DD'),
        lastSelect: moment(new Date(lastday)).format('YYYY/MM/DD'),
      };
      this.calendarHead = 'This Week';
    }
    this.setDatesGroup(this.datesRange);
  }

  getLastWeek() {
    const now = new Date();
    const firstday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 7
    );
    const lastday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 1
    );
    this.datesRange = {
      firstSelect: moment(firstday).format('YYYY/MM/DD'),
      lastSelect: moment(lastday).format('YYYY/MM/DD'),
    };
    this.calendarHead = 'Last Week';
  }

  setDatesGroup(dateRange: any) {
    this.toggleCalendar();
    const startDate = new Date(dateRange.firstSelect);
    const endDate = new Date(dateRange.lastSelect);
    const dates = [];
    for (let day = startDate; day <= endDate; day.setDate(day.getDate() + 1)) {
      dates.push(new Date(day));
    }
    this.calendarHead =
      moment(new Date(this.datesRange.firstSelect)).format('MMM, DD') +
      ' - ' +
      moment(new Date(this.datesRange.lastSelect)).format('MMM, DD');
    this.datesSelection = dates;
  }

  arrangeEntries(entries: any = []) {
    const selectedGoalId = this.selectedGoal;

    const filteredEntries = entries.filter((entry: any) => entry?.rating_id === selectedGoalId);

    let displayData = this.datesSelection.map((date: any) => {
        return {
            date: moment(date).format('YYYY-MM-DD'),
            result: null,
            value: null,
        };
    });

    this.labels = [];
    this.data = [];
    
    displayData.forEach((element: any) => {
      let single = moment(element.date).format('ddd, MMM DD');
      this.labels.push(single);
  
      let valueToAdd = 0;
      let isNumeric = true;
      let completedGoal = false;
      let justification = "";
  
      filteredEntries.forEach((entry: any) => {
        this.entry = entry

        if (moment(entry.date).format('YYYY-MM-DD') === element.date) {
          valueToAdd = entry?.amount_achieved || 0;

          if (this.entry?.achieved && (entry?.amount_achieved >= this.entry?.rating.numeric_goal)) {
            completedGoal = this.entry?.achieved ? true : false;
          }

          if (!this.entry?.rating.is_numeric) {
            isNumeric = false
            valueToAdd = this.entry?.achieved ? 100 : 0;
            completedGoal = this.entry?.achieved ? true : false;
          }

          if(!completedGoal && this.entry?.justification) justification = this.entry.justification
        }
      });
      this.data.push({
          value: valueToAdd,
          achieve: completedGoal,
          goal: this.entry?.rating.numeric_goal || this.entry?.achieved,
          isNumeric: isNumeric,
          backgroundColor: completedGoal ? '#92b46c' : '#cccccc', 
          justification,
      });
    });

    const completedData: number[] = this.data.map((item: any) => item.achieve ? item.value : 0);
    const notCompletedData: number[] = this.data.map((item: any) => !item.achieve ? item.value : 0);
    
    this.chart.data.labels = this.labels;
    this.chart.data.datasets[0].data = completedData;
    this.chart.data.datasets[1].data = notCompletedData;
    this.chart.data.datasets[0].backgroundColor = this.data.map((item: any) => item.backgroundColor);
    this.chart.update();
}

  testHours(start: any, end: any) {
    let total = new Date(end).getTime() - new Date(start).getTime();
    return total;
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

  hoverStar(i:number) {
    this.selectedStarIndex = i + 1
  }

  rateToDo(i: any) {
    const rating = i + 1
    this.ratingsService.rate({rating}, this.selectedGoal).subscribe({
      next: () => {
        this.selectedStarIndex = rating
        this.cdr.detectChanges();
      },
      error: (e) => {
        this.store.addNotifications("There was an error rating the to do", "error")
      }
    })
  }

  setStarValue() {
    this.ratingsService.getById(this.selectedGoal).subscribe({
      next: (rating) => {
        if(rating[0]?.rating) {
          this.selectedStarIndex = rating[0]?.rating
          this.cdr.detectChanges();
        }
        else {
          this.selectedStarIndex = 0
          this.cdr.detectChanges();
        }
      }
    })
  }
}