import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SharedModule } from '../shared.module';
import { TimerComponent } from '../timer/timer.component';
import { UserOptionsComponent } from '../user-options/user-options.component';

export interface Link {
  url: string;
  title: string;
}
@Component({
  selector: 'app-positions-list',
  standalone: true,
  imports: [SharedModule, TimerComponent, UserOptionsComponent],
  templateUrl: './positions-list.component.html',
  styleUrl: './positions-list.component.scss',
})
export class PositionsListComponent {
  @Input() positions!: any;
  @Input() loaded!: boolean;
  @Input() links: Link[] = [];
  @Output() onSelectPosition: EventEmitter<any> = new EventEmitter<any>();
  @Output() onToggleStatus: EventEmitter<any> = new EventEmitter<any>();

  constructor() {}

  parseTitle(position_title:string) {
    if(position_title.slice(-1).toUpperCase() == 'S') {
      return position_title.trim()
    } else {
      return position_title.trim() + 's'
    }
  }

  selectPosition(position: any) {
    this.onSelectPosition.emit(position);
  }

  toggleUserStatus(position: any) {
    this.onToggleStatus.emit(position);
  }
}
