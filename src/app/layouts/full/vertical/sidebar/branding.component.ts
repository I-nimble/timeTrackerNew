import { Component, Input } from '@angular/core';
import { CoreService } from 'src/app/services/core.service';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-branding',
  imports: [RouterModule, CommonModule],
  template: `
    <a [routerLink]="['/dashboards/dashboard2']" class="logodark">
      <!-- Iso Logo -->
      <img
        src="https://inimble-app.s3.us-east-1.amazonaws.com/assets/images/inimble-iso.png"
        [class]="
          this.collapsed
            ? 'logo-img align-middle m-2 iso-logo visible'
            : 'logo-img align-middle m-2 iso-logo hidden'
        "
        [ngStyle]="fullLogoMaxWidth ? { 'max-width': fullLogoMaxWidth } : {}"
        alt="logo"
      />
      <!-- Full logo -->
      <img
        src="https://inimble-app.s3.us-east-1.amazonaws.com/assets/images/inimble.png"
        [class]="
          this.collapsed
            ? 'logo-img align-middle m-2 full-logo hidden'
            : 'logo-img align-middle m-2 full-logo visible'
        "
        [ngStyle]="fullLogoMaxWidth ? { 'max-width': fullLogoMaxWidth } : {}"
        alt="logo"
      />
    </a>
    <a [routerLink]="['/dashboards/dashboard2']" class="logolight">
      <!-- Iso Logo -->
      <img
        src="https://inimble-app.s3.us-east-1.amazonaws.com/assets/images/inimble-iso.png"
        [class]="
          this.collapsed
            ? 'logo-img align-middle m-2 iso-logo visible'
            : 'logo-img align-middle m-2 iso-logo hidden'
        "
        [ngStyle]="fullLogoMaxWidth ? { 'max-width': fullLogoMaxWidth } : {}"
        alt="logo"
      />
      <!-- Full logo -->
      <img
        src="https://inimble-app.s3.us-east-1.amazonaws.com/assets/images/inimble.png"
        [class]="
          this.collapsed
            ? 'logo-img align-middle m-2 full-logo hidden'
            : 'logo-img align-middle m-2 full-logo visible'
        "
        [ngStyle]="fullLogoMaxWidth ? { 'max-width': fullLogoMaxWidth } : {}"
        alt="logo"
      />
    </a>
  `,
  styles: [
    `
      .logo-img.full-logo {
        max-width: 70%;
        height: auto;
        object-fit: contain;
      }
      .logo-img.iso-logo {
        max-width: 100%;
        height: auto;
        object-fit: contain;
      }
      .hidden {
        display: none;
      }
      .visible {
        display: block;
      }
    `,
  ],
})
export class BrandingComponent {
  @Input() collapsed = false;
  @Input() fullLogoMaxWidth: string | null = null;
  options = this.settings.getOptions();
  constructor(private settings: CoreService) {}
}
