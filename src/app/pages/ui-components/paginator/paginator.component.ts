import { JsonPipe } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { Highlight, HighlightAuto } from 'ngx-highlightjs';
import { HighlightLineNumbers } from 'ngx-highlightjs/line-numbers';
import { AppCodeViewComponent } from 'src/app/components/code-view/code-view.component';

// snippets
import { PAGINATOR_BASIC_HTML_SNIPPET } from './code/paginator-html-snippet';
import { PAGINATOR_BASIC_TS_SNIPPET } from './code/paginator-ts-snippet';

@Component({
  selector: 'app-paginator',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatSlideToggleModule,
    MatPaginatorModule,
    MatCardModule,
    Highlight,
    HighlightAuto,
    HighlightLineNumbers,
    AppCodeViewComponent,
  ],
  templateUrl: './paginator.component.html',
})
export class AppPaginatorComponent {
  constructor() {}

  // 1 [basic with paginator]
  codeForPaginatorBasic = PAGINATOR_BASIC_HTML_SNIPPET;
  codeForPaginatorBasicTs = PAGINATOR_BASIC_TS_SNIPPET;
}
