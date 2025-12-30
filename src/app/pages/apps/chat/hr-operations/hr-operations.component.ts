import { Component } from '@angular/core';
import { MaterialModule } from 'src/app/material.module';

@Component({
  selector: 'app-hr-operations',
  standalone: true,
  imports: [MaterialModule],
  templateUrl: './hr-operations.component.html',
  styleUrl: './hr-operations.component.scss'
})
export class HrOperationsComponent {
}
