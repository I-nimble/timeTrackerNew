import { Component } from '@angular/core';
import { AppDailyProductivityComponent } from 'src/app/components/dashboard2/daily-productivity/daily-productivity.component';
import { AppMixTableComponent } from '../../tables/mix-table/mix-table.component';

@Component({
  selector: 'app-productivity',
  standalone: true,
  imports: [AppDailyProductivityComponent, AppMixTableComponent],
  templateUrl: './productivity.component.html',
  styleUrl: './productivity.component.scss'
})
export class ProductivityComponent {

}
