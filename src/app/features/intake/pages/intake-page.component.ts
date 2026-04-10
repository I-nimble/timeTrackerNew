import { Component } from '@angular/core';
import { AppIntakeFormComponent } from 'src/app/pages/intake/intake-form.component';

@Component({
  selector: 'app-intake-page',
  standalone: true,
  imports: [AppIntakeFormComponent],
  templateUrl: './intake-page.component.html',
  styleUrl: './intake-page.component.scss',
})
export class IntakePageComponent {}
