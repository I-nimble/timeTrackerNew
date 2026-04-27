import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

import { TablerIconsModule } from 'angular-tabler-icons';
import { ButtonComponent } from 'src/app/components/button/button.component';
import { BrandingComponent } from 'src/app/layouts/full/vertical/sidebar/branding.component';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [BrandingComponent, TablerIconsModule, RouterLink, ButtonComponent],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
})
export class AppFooterComponent {
  contructor() {}
}
