import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/material.module';
import { ScrapperTableComponent } from './scrapper-table/scrapper-table.component';

@Component({
  selector: 'app-scrapper',
  templateUrl: './scrapper.component.html',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    ScrapperTableComponent
  ]
})
export class ScrapperComponent {
  mockItems = [
    {
      title: 'Inimble',
      url: 'https://inimble.com',
      keyword: 'staffing',
      author: 'John Doe',
      created_utc: '2025-09-05 12:00',
      suggestion: ''
    },
  ];
}