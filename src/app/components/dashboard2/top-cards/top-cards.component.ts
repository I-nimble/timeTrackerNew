import { Component, OnInit } from '@angular/core';
import { MaterialModule } from '../../../material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { RatingsEntriesService } from 'src/app/services/ratings_entries.service';

@Component({
  selector: 'app-top-cards',
  standalone: true,
  imports: [MaterialModule, TablerIconsModule],
  templateUrl: './top-cards.component.html',
})
export class AppTopCardsComponent implements OnInit {
  totalTasksSum: number = 0;
  constructor(private ratingsEntriesService: RatingsEntriesService) {}

  companyTimezone: string = 'UTC';
  totalHours: number = 0;
  performance: number = 0;
  elapsedHours: number = 0;
  intervalId: any;

  ngOnInit() {
    this.loadTeamReport();
    this.updateElapsedHours();
    this.intervalId = setInterval(() => this.updateElapsedHours(), 60000);
  }

  ngOnDestroy() {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  loadTeamReport() {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const dateRange = {
      firstSelect: todayStr,
      lastSelect: todayStr,
    };

    this.ratingsEntriesService.getTeamReport(dateRange).subscribe({
      next: (data) => {
        const ratings = Array.isArray(data?.ratings) ? data.ratings : [];
        this.totalTasksSum = ratings.reduce(
          (acc: number, curr: { completed?: number }) =>
            acc + (curr.completed || 0),
          0
        );
        this.performance =
          this.elapsedHours > 0
            ? Number((this.totalTasksSum / this.elapsedHours).toFixed(2))
            : 0;
      },
      error: (err) => {
        console.error('Error loading team report:', err);
      },
    });
  }

  getElapsedHours(): number {
    const now = new Date();
    const today9am = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      9,
      0,
      0,
      0
    );
    const diffMs = now.getTime() - today9am.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return diffHours > 0 ? Number(diffHours.toFixed(2)) : 0;
  }

  updateElapsedHours() {
    this.elapsedHours = this.getElapsedHours();
    this.performance =
      this.elapsedHours > 0
        ? Number((this.totalTasksSum / this.elapsedHours).toFixed(2))
        : 0;
  }
}
