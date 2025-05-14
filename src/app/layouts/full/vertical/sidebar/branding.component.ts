import { Component } from '@angular/core';
import { CoreService } from 'src/app/services/core.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-branding',
  imports: [RouterModule],
  template: `
    <a [routerLink]="['/dashboards/dashboard2']" class="logodark">
      <img
        src="https://inimble-app.s3.us-east-1.amazonaws.com/assets/images/inimble.png"
        class="logo-img align-middle m-2"
        alt="logo"
      />
    </a> 

    <a [routerLink]="['/dashboards/dashboard2']" class="logolight">
      <img
        src="https://inimble-app.s3.us-east-1.amazonaws.com/assets/images/inimble.png"
        class="logo-img align-middle m-2"
        alt="logo"
      />
    </a>
  `,
    styles: [`
      .logo-img {
        max-width: 100px; /* Ajusta el tamaño máximo */
        height: auto; /* Mantiene la proporción */
        object-fit: contain; /* Asegura que la imagen se ajuste sin deformarse */
      }
    `],
})
export class BrandingComponent {
  options = this.settings.getOptions();
  constructor(private settings: CoreService) {}
}
