import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

import { MaterialModule } from '../../../legacy/material.module';

@Component({
  selector: 'app-error',
  standalone: true,
  imports: [RouterModule, MaterialModule],
  templateUrl: './error.component.html',
})
export class AppErrorComponent {}
