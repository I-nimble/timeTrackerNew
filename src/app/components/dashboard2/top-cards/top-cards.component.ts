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
  
  ngOnInit() {
  this.loadTeamReport();
}

loadTeamReport() {
  const today = new Date();
  const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
  const dateRange = {
    firstSelect: firstDayOfYear.toISOString().split('T')[0],
    lastSelect: today.toISOString().split('T')[0]
  };

  this.ratingsEntriesService.getTeamReport(dateRange).subscribe({
    next: (data) => {
    const ratings = Array.isArray(data?.ratings) ? data.ratings : [];
    this.totalTasksSum = ratings.reduce((acc: number, curr: { totalTasks?: number }) => acc + (curr.totalTasks || 0), 0)

      console.log('Team Report:', ratings);
      console.log('total: ', this.totalTasksSum);

      // this.teamReport = data;
    },
    error: (err) => {
      console.error('Error loading team report:', err);
    }
  });
}
}
