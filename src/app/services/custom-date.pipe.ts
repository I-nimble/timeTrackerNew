import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment';
// import { ClientDashboardComponent } from "../components/dashboard/dashboard.component";

@Pipe({
  name: 'customDate',
})
export class CustomDatePipe implements PipeTransform {
  transform(value: Date, format: string = 'DD-MM-YYYY HH:mm:ss'): string {
    return moment(value).format(format);
  }

  getTotalHours(date: any, now:any = new Date): any {
    let format = new Date(date).getTime();
    const diff = now.getTime() - format;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));
    const seconds = Math.floor(diff / 1000);
    const timer = `${this.padzero(hours)}:${this.padzero(
      minutes - hours * 60
    )}:${this.padzero(seconds - minutes * 60)}`;
    return timer;
  }

  padzero(num: number) {
    return num > 9 ? `${num}` : `0${num}`;
  }
}
