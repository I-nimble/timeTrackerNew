import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RatingsEntriesService } from 'src/app/services/ratings_entries.service';
import { UsersService } from 'src/app/services/users.service';
import { ReportsService } from 'src/app/services/reports.service';

@Component({
  selector: 'app-to-do-report',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './to-do-report.component.html',
  styleUrl: './to-do-report.component.scss'
})
export class ToDoReportComponent implements OnInit {
  tasks: any[] = [];

  constructor(
    private ratingsEntriesService: RatingsEntriesService,
    private usersService: UsersService,
    private reportsService: ReportsService,
  ) { }

  ngOnInit(): void {
    this.usersService.teamMember$.subscribe(id => {
      if(!id) return;
      this.reportsService.dateRange$.subscribe(range => {
        if(!range) return;
        this.ratingsEntriesService.getRange(range, id).subscribe({
          next: (res) => {
            this.tasks = res;
          }
        });
      });
    });
  }
}
