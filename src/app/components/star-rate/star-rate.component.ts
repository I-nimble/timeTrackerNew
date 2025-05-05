import { Component, inject, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { NotificationStore } from 'src/app/stores/notification.store';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-star-rate',
  standalone: true,
  imports: [NgIf, NgFor],
  templateUrl: './star-rate.component.html',
  styleUrl: './star-rate.component.scss'
})
export class StarRateComponent implements OnInit {
  store = inject(NotificationStore);
  @Input() selectedGoal?: Observable<number>;
  @Input() selectedStarIndex = 0
  @Output() hoverStar: EventEmitter<any> = new EventEmitter<any>();
  @Output() rateToDo: EventEmitter<any> = new EventEmitter<any>();
  userRole?: string | null

  constructor () {}

  ngOnInit(): void {
   this.userRole = localStorage.getItem("role")
  }

  array(num:number) {
    return new Array(num)
  }

  handleHoverStar(i:number) {
    if(this.userRole == '3') this.hoverStar.emit(i)
  }

  handleRateToDo(i:number) {
    if(this.userRole == '3')  this.rateToDo.emit(i)
  }
}
