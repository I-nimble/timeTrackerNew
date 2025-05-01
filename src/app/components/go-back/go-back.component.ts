import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { SharedModule } from '../shared.module';
import { Location, LocationStrategy } from '@angular/common';

@Component({
  selector: 'app-go-back',
  templateUrl: './go-back.component.html',
  styleUrl: './go-back.component.scss',
})
export class GoBackComponent {

  constructor(private location: Location) { }
 
  goBack(): void {
    this.location.back();
  }
}
