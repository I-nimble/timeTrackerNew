import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';

interface Event {
  name: string;
  date: Date;
  description: string;
}

@Component({
  selector: 'app-events',
  standalone: true,
  templateUrl: './events.component.html',
  imports: [
    CommonModule,
    FormsModule,
    BrowserAnimationsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
})

export class AppEventsComponent implements OnInit {
//   displayedColumns: string[] = ['event', 'date', 'description', 'actions'];
//   events: MatTableDataSource<Event>;

//   @ViewChild(MatPaginator) paginator!: MatPaginator;

//   constructor() {
//     const initialEvents: Event[] = [
//       { name: 'Annual Meeting', date: new Date('2025-12-15'), description: 'Company-wide meeting' },
//       { name: 'Project Launch', date: new Date('2025-12-20'), description: 'Launch of new project' },
//       { name: 'Team Outing', date: new Date('2025-12-25'), description: 'Fun outing with the team' },
//     ];

//     this.events = new MatTableDataSource(initialEvents);
//   }

  ngOnInit(): void {
    // this.events.paginator = this.paginator;
  }

//   addEvent() {
//     console.log('Add event clicked');
//     // Implement add event logic here
//   }

//   editEvent(event: Event) {
//     console.log('Edit event', event);
//     // Implement edit logic here
//   }

//   deleteEvent(event: Event) {
//     console.log('Delete event', event);
//     // Implement delete logic here
//   }
}