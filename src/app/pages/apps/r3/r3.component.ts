import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

import { MatchComponent } from 'src/app/components/match-search/match.component';
import { MaterialModule } from 'src/app/legacy/material.module';
import { MarkdownPipe, LinebreakPipe } from 'src/app/pipe/markdown.pipe';
import { ThemeService } from 'src/app/services/theme.service';

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
