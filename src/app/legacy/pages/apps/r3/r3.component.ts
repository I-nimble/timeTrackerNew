import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

import { MatchComponent } from 'src/app/legacy/components/match-search/match.component';
import { MarkdownPipe, LinebreakPipe } from 'src/app/legacy/pipe/markdown.pipe';
import { ThemeService } from 'src/app/legacy/services/theme.service';
import { MaterialModule } from 'src/app/material.module';

@Component({
  selector: 'app-r3',
  templateUrl: './r3.component.html',
  //styleUrls: ['./r3.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    MatchComponent,
    MarkdownPipe,
    LinebreakPipe,
    RouterModule,
  ],
})
export class R3Component {
  constructor(public themeService: ThemeService) {}
}
