import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-client-details',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  templateUrl: './client-details.component.html',
})
export class ClientDetailsComponent {
  @Input() client: any;
  @Output() back = new EventEmitter<void>();
}