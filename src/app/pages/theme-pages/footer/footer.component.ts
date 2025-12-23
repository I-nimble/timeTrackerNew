import {Component, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrandingComponent } from 'src/app/layouts/full/vertical/sidebar/branding.component';
import { TablerIconsModule } from 'angular-tabler-icons';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from 'src/app/components/button/button.component';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [BrandingComponent,TablerIconsModule,RouterLink,ButtonComponent],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})

export class AppFooterComponent {
    contructor(){}
}