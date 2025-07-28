import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppTalentMatchClientComponent } from './client/client.component';
import { AppTalentMatchAdminComponent } from '../talent-match-admin/talent-match-admin.component';
import { AppIntakeFormComponent } from '../intake/intake-form.component';

@Component({
  standalone: true,
  selector: 'app-talent-match',
  imports: [
    AppTalentMatchClientComponent,
    AppTalentMatchAdminComponent,
    AppIntakeFormComponent,
    CommonModule
  ],
  templateUrl: './talent-match.component.html',
})
export class AppTalentMatchComponent {
  userRole = localStorage.getItem('role');

  constructor() {}
}