import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppTalentMatchClientComponent } from './client/client.component';
import { AppTalentMatchAdminComponent } from '../talent-match-admin/talent-match-admin.component';
import { AppTalentMatchTmComponent } from './talent-match-tm/talent-match-tm.component';
import { AppIntakeFormComponent } from '../intake/intake-form.component';
import { environment } from 'src/environments/environment';
import { PermissionService } from 'src/app/services/permission.service';

@Component({
  standalone: true,
  selector: 'app-talent-match',
  imports: [
    AppTalentMatchClientComponent,
    AppTalentMatchAdminComponent,
    AppTalentMatchTmComponent,
    AppIntakeFormComponent,
    CommonModule
  ],
  templateUrl: './talent-match.component.html',
})
export class AppTalentMatchComponent {
  userRole = localStorage.getItem('role');
  userEmail = localStorage.getItem('email');
  isOrphan = localStorage.getItem('isOrphan') === 'true';
  canViewTalentMatch = false;
  allowedTM = false;

  constructor(private permissionService: PermissionService) {
    const allowedEmails = environment.allowedReportEmails;
    this.allowedTM =
      this.userRole === '2' && allowedEmails.includes(this.userEmail || '');

    const userId = Number(localStorage.getItem('id'));
    this.permissionService.getUserPermissions(userId).subscribe({
      next: (userPerms: any) => {
        const effective = userPerms.effectivePermissions || [];
        this.canViewTalentMatch = effective.includes('talent-match.view');
      },
      error: (err) => {
        console.error('Error fetching user permissions', err);
      }
    });
  }
}