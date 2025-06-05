import { Component, ViewChild, OnInit } from '@angular/core';
import {
  ApexChart,
  ChartComponent,
  ApexDataLabels,
  ApexLegend,
  ApexStroke,
  ApexTooltip,
  ApexAxisChartSeries,
  ApexXAxis,
  ApexYAxis,
  ApexGrid,
  ApexPlotOptions,
  ApexFill,
  ApexMarkers,
  NgApexchartsModule,
} from 'ng-apexcharts';
import { MaterialModule } from '../../../material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { UsersService } from 'src/app/services/users.service';
import { EmployeesService } from 'src/app/services/employees.service';
import { RatingsService } from 'src/app/services/ratings.service';
import { RatingsEntriesService } from 'src/app/services/ratings_entries.service';
import { forkJoin } from 'rxjs';
import { BoardsService } from 'src/app/services/apps/kanban/boards.service';
import { RouterModule } from '@angular/router';

export interface revenuetwoChart {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  yaxis: ApexYAxis;
  xaxis: ApexXAxis;
  fill: ApexFill;
  tooltip: ApexTooltip;
  stroke: ApexStroke;
  legend: ApexLegend;
  grid: ApexGrid;
  marker: ApexMarkers;
}

@Component({
  selector: 'app-profile-expance',
  standalone: true,
  imports: [
    MaterialModule,
    NgApexchartsModule,
    TablerIconsModule,
    RouterModule,
  ],
  templateUrl: './profile-expance.component.html',
})
export class AppProfileExpanceCpmponent implements OnInit {
  @ViewChild('chart') chart: ChartComponent = Object.create(null);
  public revenuetwoChart!: Partial<revenuetwoChart> | any;
  public allTasks: any[] = [];
  public completedCount: number = 0;
  public notCompletedCount: number = 0;
  public totalCount: number = 0;
  public teamReport: any[] = [];
  public todoCount: number = 0;
  public inProgressCount: number = 0;
  public onHoldCount: number = 0;
  public completedCountKanban: number = 0;

  constructor(
    private usersService: UsersService,
    private employeesService: EmployeesService,
    private ratingsService: RatingsService,
    private ratingsEntriesService: RatingsEntriesService,
    private boardsService: BoardsService
  ) {
    this.revenuetwoChart = {
      series: [
        {
          colors: 'var(--mat-sys-primary)',
          name: 'Completed',
          data: [0, 0, 0, 0, 0, 0, 0],
        },
        {
          colors: '#fb977d',
          name: 'No completed',
          data: [0, 0, 0, 0, 0, 0, 0],
        },
      ],

      chart: {
        type: 'bar',
        fontFamily: "'Plus Jakarta Sans', sans-serif;",
        foreColor: '#adb0bb',
        toolbar: {
          show: false,
        },
        height: 300,
        stacked: true,
      },
      colors: ['#0085db', '#fb977d'],
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '27%',
          borderRadius: 6,
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        show: false,
      },

      legend: {
        show: false,
      },
      grid: {
        borderColor: 'rgba(0,0,0,0.1)',
        padding: { top: 0, bottom: -8, left: 20, right: 20 },
      },
      xaxis: {
        categories: [, 'To do', 'In Progress', 'On Hold', 'Completed'],
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
      },
      fill: {
        opacity: 1,
      },
      tooltip: {
        theme: 'dark',
        fillSeriesColor: false,
      },
    };
  }
  ngOnInit() {
    //this.loadAllTasksForClient();
    // this.loadTeamReport();
    this.getKanbanTaskCountsForClient();
  }

  loadAllTasksForClient() {
    this.employeesService.get().subscribe({
      next: (employees: any) => {
        const filteredEmployees = employees.filter(
          (user: any) => user.user.active == 1 && user.user.role == 2
        );
        const employeeIds = filteredEmployees.map((emp: any) => emp.user.id);

        const today = new Date();
        const tasksObservables = employeeIds.map((id: any) =>
          this.ratingsService.getToDo(today, id)
        );

        import('rxjs').then((rxjs) => {
          rxjs.forkJoin(tasksObservables).subscribe((results: any) => {
            this.allTasks = results.flat();

            this.totalCount = this.allTasks.length;
            this.completedCount = this.allTasks.filter(
              (t) => t.achieved
            ).length;
            this.notCompletedCount = this.allTasks.filter(
              (t) => !t.achieved
            ).length;
          });
        });
      },
    });
  }

  loadTeamReport() {
    const today = new Date();
    const year = today.getFullYear();
    const currentMonth = today.getMonth();
    const months: { firstSelect: string; lastSelect: string; label: string }[] =
      [];

    for (let m = 0; m <= currentMonth; m++) {
      const firstDay = new Date(year, m, 1);
      const lastDay = new Date(year, m + 1, 0);
      months.push({
        firstSelect: firstDay.toISOString().split('T')[0],
        lastSelect: lastDay.toISOString().split('T')[0],
        label: firstDay.toLocaleString('en-US', { month: 'short' }),
      });
    }

    const requests = months.map((month) =>
      this.ratingsEntriesService.getTeamReport({
        firstSelect: month.firstSelect,
        lastSelect: month.lastSelect,
      })
    );
    forkJoin(requests).subscribe({
      next: (results: any[]) => {
        const completedData: number[] = [];
        const totalTasksData: number[] = [];

        results.forEach((monthResult, idx) => {
          let completed = 0;
          let totalTasks = 0;

          const safeMonthData = Array.isArray(monthResult?.ratings)
            ? monthResult.ratings
            : [];

          safeMonthData.forEach(
            (entry: { completed: number; totalTasks: number }) => {
              const entryCompleted = entry.completed || 0;
              const entryTotalTasks = entry.totalTasks || 0;
              completed += entryCompleted;

              totalTasks += entryCompleted + entryTotalTasks;
            }
          );

          completedData.push(completed);
          totalTasksData.push(totalTasks);
        });
        const notCompletedData = totalTasksData.map(
          (total, idx) => total - completedData[idx]
        );

        // Actualizar la gráfica
        this.notCompletedCount = this.totalCount - this.completedCount;
        this.revenuetwoChart.series = [
          {
            name: 'Completed',
            data: completedData,
          },
          {
            name: 'Not Completed',
            data: notCompletedData,
          },
        ];
        this.revenuetwoChart.xaxis = {
          ...this.revenuetwoChart.xaxis,
          categories: months.map((m) => m.label),
        };
        this.totalCount = totalTasksData.reduce((acc, val) => acc + val, 0);
        this.completedCount = completedData.reduce((acc, val) => acc + val, 0);
        this.notCompletedCount = this.totalCount - this.completedCount;
      },
      error: (err) => {
        console.error('Error loading team report:', err);
      },
    });
  }

  getKanbanTaskCountsForClient(): void {
    this.boardsService.getBoards().subscribe((boards) => {
      // Inicializa los contadores
      this.todoCount = 0;
      this.inProgressCount = 0;
      this.onHoldCount = 0;
      this.completedCountKanban = 0;

      if (!boards.length) {
        this.setKanbanChart();
        return;
      }

      const boardTasksObservables = boards.map((board: any) =>
        this.boardsService.getBoardWithTasks(board.id)
      );

      forkJoin<any[]>(boardTasksObservables).subscribe((boardsData) => {
        boardsData.forEach((boardData) => {
          const columns = boardData.columns || [];
          const tasks = boardData.tasks || [];

          const todoColumn = columns.find((col: any) =>
            col.name.toLowerCase().includes('to')
          );
          const inProgressColumn = columns.find((col: any) =>
            col.name.toLowerCase().includes('progress')
          );
          const onHoldColumn = columns.find((col: any) =>
            col.name.toLowerCase().includes('hold')
          );
          const completedColumn = columns.find((col: any) =>
            col.name.toLowerCase().includes('completed')
          );

          this.todoCount += todoColumn
            ? tasks.filter((t: any) => t.column_id === todoColumn.id).length
            : 0;
          this.inProgressCount += inProgressColumn
            ? tasks.filter((t: any) => t.column_id === inProgressColumn.id)
                .length
            : 0;
          this.onHoldCount += onHoldColumn
            ? tasks.filter((t: any) => t.column_id === onHoldColumn.id).length
            : 0;
          this.completedCountKanban += completedColumn
            ? tasks.filter((t: any) => t.column_id === completedColumn.id)
                .length
            : 0;
        });

        this.setKanbanChart();
      });
    });
  }

  setKanbanChart() {
    this.revenuetwoChart = {
      series: [
        {
          name: 'Tasks',
          data: [
            this.todoCount,
            this.inProgressCount,
            this.onHoldCount,
            this.completedCountKanban,
          ],
        },
      ],
      chart: {
        type: 'bar',
        fontFamily: "'Plus Jakarta Sans', sans-serif;",
        foreColor: '#adb0bb',
        toolbar: { show: false },
        height: 300,
        stacked: false,
      },
      colors: ['#92b46c', '#6e797f26', '#fb977d', '#4bd08b26'],
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '40%',
          borderRadius: 6,
          distributed: true,
        },
      },
      dataLabels: { enabled: false },
      stroke: { show: false },
      legend: { show: false },
      grid: {
        borderColor: 'rgba(0,0,0,0.1)',
        padding: { top: 0, bottom: -8, left: 20, right: 20 },
      },
      xaxis: {
        categories: ['To-do', 'In progress', 'On Hold', 'Completed'],
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      fill: { opacity: 1 },
      tooltip: {
        theme: 'dark',
        fillSeriesColor: false,
      },
    };
  }
}
