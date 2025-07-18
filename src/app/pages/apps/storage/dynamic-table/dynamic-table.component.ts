import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { AppCodeViewComponent } from 'src/app/components/code-view/code-view.component';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MaterialModule } from 'src/app/material.module';

// snippets
import { DYNAMIC_TABLE_HTML_SNIPPET } from './code/dynamic-table-html-snippet';
import { DYNAMIC_TABLE_TS_SNIPPET } from './code/dynamic-table-ts-snippet';

import { Highlight, HighlightAuto } from 'ngx-highlightjs';
import { HighlightLineNumbers } from 'ngx-highlightjs/line-numbers';

export interface PeriodicElement {
  name: string;
  position: number;
  weight: number;
  symbol: string;
}

const ELEMENT_DATA: any[] = [
  { download: '', name: 'file.txt', size: '1kb', preview: '' },
  { download: '', name: 'file.txt', size: '1kb', preview: '' },
  { download: '', name: 'file.txt', size: '1kb', preview: '' },
  { download: '', name: 'file.txt', size: '1kb', preview: '' },
  { download: '', name: 'file.txt', size: '1kb', preview: '' },
  { download: '', name: 'file.txt', size: '1kb', preview: '' },
  { download: '', name: 'file.txt', size: '1kb', preview: '' },
  { download: '', name: 'file.txt', size: '1kb', preview: '' },
  { download: '', name: 'file.txt', size: '1kb', preview: '' },
  { download: '', name: 'file.txt', size: '1kb', preview: '' },
];

@Component({
  standalone: true,
    selector: 'app-dynamic-table',
    imports: [
      MatTableModule, 
      MatCardModule, 
      CommonModule, 
      MatButtonModule,
      Highlight,
      HighlightAuto,
      HighlightLineNumbers,
      AppCodeViewComponent,
      TablerIconsModule,
      MaterialModule
    ],
    templateUrl: './dynamic-table.component.html'
})
export class AppDynamicTableComponent implements OnInit {
  // 1 [Top Projects with Table]
  codeForDynamicTable = DYNAMIC_TABLE_HTML_SNIPPET;
  codeForDynamicTableTs = DYNAMIC_TABLE_TS_SNIPPET;


  displayedColumns: string[] = ['name', 'size', 'preview', 'download'];
  columnsToDisplay: string[] = this.displayedColumns.slice();
  data: PeriodicElement[] = ELEMENT_DATA;

  addColumn(): void {
    const randomColumn = Math.floor(
      Math.random() * this.displayedColumns.length
    );
    this.columnsToDisplay.push(this.displayedColumns[randomColumn]);
  }

  removeColumn(): void {
    if (this.columnsToDisplay.length) {
      this.columnsToDisplay.pop();
    }
  }

  shuffle(): void {
    let currentIndex = this.columnsToDisplay.length;
    while (0 !== currentIndex) {
      const randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;

      // Swap
      const temp = this.columnsToDisplay[currentIndex];
      this.columnsToDisplay[currentIndex] = this.columnsToDisplay[randomIndex];
      this.columnsToDisplay[randomIndex] = temp;
    }
  }

  constructor() {}

  ngOnInit(): void {}
}
