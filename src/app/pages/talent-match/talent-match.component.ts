import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppTalentMatchClientComponent } from './client/client.component';
import { AppTalentMatchAdminComponent } from '../talent-match-admin/talent-match-admin.component';

@Component({
  standalone: true,
  selector: 'app-talent-match',
  imports: [
    AppTalentMatchClientComponent,
    AppTalentMatchAdminComponent,
    CommonModule
  ],
  templateUrl: './talent-match.component.html',
})
export class AppTalentMatchComponent {
  userRole = localStorage.getItem('role');

  constructor() {}
}