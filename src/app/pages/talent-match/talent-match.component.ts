import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppTalentMatchClientComponent } from './client/client.component';

@Component({
  standalone: true,
  selector: 'app-talent-match',
  imports: [
    AppTalentMatchClientComponent,
    CommonModule
  ],
  templateUrl: './talent-match.component.html',
})
export class AppTalentMatchComponent {
  userRole = localStorage.getItem('role');

  constructor() {}
}