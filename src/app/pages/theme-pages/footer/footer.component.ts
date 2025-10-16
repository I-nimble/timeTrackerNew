import { Component } from '@angular/core';
import { TablerIconsModule } from 'angular-tabler-icons';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from 'src/app/components/button/button.component';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [TablerIconsModule,RouterLink,ButtonComponent],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})

export class AppFooterComponent {
    contructor(){}
}