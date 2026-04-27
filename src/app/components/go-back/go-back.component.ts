import { Location } from '@angular/common';
import { Component } from '@angular/core';

import { MaterialModule } from '../../legacy/material.module';

@Component({
  selector: 'app-go-back',
  templateUrl: './go-back.component.html',
  styleUrl: './go-back.component.scss',
  imports: [MaterialModule],
})
export class GoBackComponent {
  constructor(private location: Location) {}

  goBack(): void {
    this.location.back();
  }
}
