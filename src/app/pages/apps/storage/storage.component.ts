import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MaterialModule } from 'src/app/material.module';

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
      TablerIconsModule,
      MaterialModule
    ],
    templateUrl: './storage.component.html'
})
export class AppStorageComponent implements OnInit {
  displayedColumns: string[] = ['name', 'size', 'preview', 'download'];
  columnsToDisplay: string[] = this.displayedColumns.slice();
  data: any[] = ELEMENT_DATA;

  constructor() {}

  ngOnInit(): void {}

  onFileSelected(event: any) {
    // const files = event.target.files;
    // if (files.length > 0) {
    //   const file = files[0];
    //   const reader = new FileReader();
    //   reader.readAsDataURL(file);
    //   reader.onload = () => {
    //     const preview = reader.result;
    //     this.data.push({ download: '', name: file.name, size: file.size, preview });
    //     this.columnsToDisplay.push('download');
    //   };
    // }
  }
}
