import {Component, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrandingComponent } from 'src/app/layouts/full/vertical/sidebar/branding.component';
import { TablerIconsModule } from 'angular-tabler-icons';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [BrandingComponent,TablerIconsModule],
  templateUrl: './footer.component.html',
})

export class AppFooterComponent {
    contructor(){}
}