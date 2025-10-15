import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppTalentMatchClientComponent } from './client/client.component';
import { AppTalentMatchAdminComponent } from '../talent-match-admin/talent-match-admin.component';
import { AppIntakeFormComponent } from '../intake/intake-form.component';
import { environment } from 'src/environments/environment';

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
  userEmail = localStorage.getItem('email');
  allowedTM = false;

  constructor() {
    const allowedEmails = environment.allowedReportEmails;
    this.allowedTM =
    this.userRole === '2' && allowedEmails.includes(this.userEmail || '');
  }
}