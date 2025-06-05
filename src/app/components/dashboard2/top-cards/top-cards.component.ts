import { Component, OnInit } from '@angular/core';
import { MaterialModule } from '../../../material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { RatingsEntriesService } from 'src/app/services/ratings_entries.service';
import { EmployeesService } from 'src/app/services/employees.service';
import { forkJoin } from 'rxjs';
import { SchedulesService } from 'src/app/services/schedules.service';
import { ReportsService } from 'src/app/services/reports.service';
import moment from 'moment-timezone';

@Component({
  selector: 'app-top-cards',
  standalone: true,
  imports: [MaterialModule, TablerIconsModule],
  templateUrl: './top-cards.component.html',
})
export class AppTopCardsComponent implements OnInit {
  totalTasksSum: number = 0;
  constructor(
    private ratingsEntriesService: RatingsEntriesService,
    private employeesService: EmployeesService,
    private schedulesService: SchedulesService,
    private reportsService: ReportsService,
  ) {}

  companyTimezone: string = 'UTC';
  totalHours: number = 0;
  performance: number = 0;

  ngOnInit() {
    this.loadTeamReport();
    this.getAllUsers();
  }

  loadTeamReport() {
    const today = new Date();
    const year = today.getFullYear();
    const firstDay = new Date(year, 0, 1);
    const lastDay = today;

    const dateRange = {
      firstSelect: firstDay.toISOString().split('T')[0],
      lastSelect: lastDay.toISOString().split('T')[0],
    };

    this.ratingsEntriesService.getTeamReport(dateRange).subscribe({
      next: (data) => {
        const ratings = Array.isArray(data?.ratings) ? data.ratings : [];
        this.totalTasksSum = ratings.reduce(
          (acc: number, curr: { completed?: number }) =>
            acc + (curr.completed || 0),
          0
        );
      },
      error: (err) => {
        console.error('Error loading team report:', err);
      },
    });
  }

  getAllUsers() {
    this.employeesService.get().subscribe({
      next: (employees: any) => {
        const filteredEmployees = employees.filter(
          (user: any) => user.user.active == 1 && user.user.role == 2
        );
        const employeeIds = filteredEmployees.map((emp: any) => emp.user.id);

        const today = new Date();
        const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
        const firstday = firstDayOfYear.toISOString().split('T')[0];
        const lastday = today.toISOString().split('T')[0];

        const schedulesRequests = employeeIds.map((id: number) =>
          this.schedulesService.getById(id)
        );
        forkJoin<any[]>(schedulesRequests).subscribe((allSchedules: any[]) => {
          const entriesRequests = employeeIds.map((id: number) =>
            this.reportsService.getRange(
              { firstSelect: firstday, lastSelect: lastday },
              { id },
              {
                user: String(id),
                company: '',
                project: 'all',
                byClient: false,
                useTimezone: true,
              }
            )
          );
          (
            forkJoin(entriesRequests) as import('rxjs').Observable<any[][]>
          ).subscribe((allEntries: any[][]) => {
            const workedHoursPerDay: { [day: string]: number } = {};
            const totalHoursPerDay: { [day: string]: number } = {};

            allEntries.forEach((entries, idx) => {
              const employeeWorked = entries.reduce((acc, entry) => {
                const date = moment(entry.start_time)
                  .tz(this.companyTimezone)
                  .format('ddd');
                const duration =
                  (new Date(entry.end_time).getTime() -
                    new Date(entry.start_time).getTime()) /
                  (1000 * 60 * 60);
                acc[date] = (acc[date] || 0) + duration;
                return acc;
              }, {} as { [day: string]: number });

              const employeeSchedules = allSchedules[idx]?.schedules || [];
              const employeeTotal = employeeSchedules.reduce(
                (acc: any, schedule: any) => {
                  const todayStr = moment()
                    .tz(this.companyTimezone)
                    .format('YYYY-MM-DD');
                  const start = moment.tz(
                    `${todayStr} ${schedule.start_time}`,
                    'YYYY-MM-DD HH:mm:ss',
                    this.companyTimezone
                  );
                  const end = moment.tz(
                    `${todayStr} ${schedule.end_time}`,
                    'YYYY-MM-DD HH:mm:ss',
                    this.companyTimezone
                  );
                  if (end.isBefore(start)) end.add(1, 'day');
                  const duration = end.diff(start, 'hours', true);
                  if (Array.isArray(schedule.days)) {
                    schedule.days.forEach((dayObj: any) => {
                      const dayShort = dayObj.name.substring(0, 3);
                      acc[dayShort] = (acc[dayShort] || 0) + duration;
                    });
                  }
                  return acc;
                },
                {} as { [day: string]: number }
              );

              // --- Sumar al total general ---
              Object.keys(employeeWorked).forEach((day) => {
                workedHoursPerDay[day] =
                  (workedHoursPerDay[day] || 0) + employeeWorked[day];
              });
              Object.keys(employeeTotal).forEach((day) => {
                totalHoursPerDay[day] =
                  (totalHoursPerDay[day] || 0) + employeeTotal[day];
              });
            });

            const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            const workedData = days.map((day) =>
              Number(workedHoursPerDay[day] || 0).toFixed(2)
            );
            const notWorkedData = days.map((day) => {
              const total = totalHoursPerDay[day] || 0;
              const worked = workedHoursPerDay[day] || 0;
              return Number(Math.max(total - worked, 0)).toFixed(2);
            });

            const totalWorked = workedData.reduce(
              (acc, val) => acc + Number(val),
              0
            );
            const totalScheduled = days.reduce(
              (acc, day) => acc + (totalHoursPerDay[day] || 0),
              0
            );

            let workedPercent = 0;
            let notWorkedPercent = 0;
            if (totalScheduled > 0) {
              workedPercent = Math.round((totalWorked / totalScheduled) * 100);
              notWorkedPercent = 100 - workedPercent;
            }

            const totalWorkedYear = Object.values(workedHoursPerDay).reduce(
              (acc, val) => acc + Number(val),
              0
            );
            const totalScheduledYear = Object.values(totalHoursPerDay).reduce(
              (acc, val) => acc + Number(val),
              0
            );

            this.totalHours = totalWorkedYear + totalScheduledYear;
            if (this.totalHours > 0) {
              this.performance = this.totalTasksSum / this.totalHours;
              this.performance = Number(this.performance.toFixed(2));
            }
            // console.log('Worked Data:', totalWorkedYear);
            // console.log('Not Worked Data:', totalScheduledYear);
          });
        });
      },
      error: (err: any) => {
        console.error('Error fetching employees:', err);
      },
    });
  }
}
