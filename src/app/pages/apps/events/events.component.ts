import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/material.module';
import { MarkdownPipe, LinebreakPipe } from 'src/app/pipe/markdown.pipe';
import { RouterModule } from '@angular/router';
import { EventsService } from 'src/app/services/events.service';
import { MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { AppEventsDialogComponent } from './events-dialog/events-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ModalComponent } from 'src/app/components/confirmation-modal/modal.component';

@Component({
  selector: 'app-events',
  templateUrl: './events.component.html',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    MatTableModule,
    MarkdownPipe,
    LinebreakPipe,
    RouterModule,
  ]
})
export class AppEventsComponent implements OnInit {
  displayedColumns: string[] = ['event', 'description', 'type', 'date', 'attendees', 'actions'];
  events: any[] = [];

  constructor(private snackBar: MatSnackBar, private dialog: MatDialog, private eventsService: EventsService) {}

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents() {
    this.eventsService.getEvents().subscribe({
      next: (res) => {
        this.events = res.events || res; 
      },
      error: (err) => {
        console.error('Error loading events:', err);
      }
    });
  }
  
  getAttendeesList(attendees: any[]): string {
    if (!attendees || attendees.length === 0) return '-';
    return attendees.map(a => `${a.name} ${a.last_name}`).join(', ');
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    };
    return date.toLocaleDateString() + ' - ' + date.toLocaleTimeString([], options);
  }

  addEvent() {
    const dialogRef = this.dialog.open(AppEventsDialogComponent, {
      width: '500px',
      data: { action: 'add' },
    });
    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;
      this.eventsService.createEvent(result).subscribe(() => {
        this.loadEvents();
        this.openSnackBar('Event created!', 'Close');
      });
    });
  }

  editEvent(event: any) {
    const dialogRef = this.dialog.open(AppEventsDialogComponent, {
      width: '500px',
      data: { action: 'edit', event },
    });
    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;
      this.eventsService.updateEvent(event.id, result).subscribe(() => {
        this.loadEvents();
        this.openSnackBar('Event updated!', 'Close');
      });
    });
  }

  deleteEvent(event: any) {
    const dialogRef = this.dialog.open(ModalComponent, {
      width: '400px',
      data: {
        action: 'delete',
        subject: 'event',
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.eventsService.deleteEvent(event.id).subscribe(() => {
          this.loadEvents();
        });
        this.openSnackBar('Event deleted!', 'Close');
      }
    });
  }

  openSnackBar(message: string, action: string): void {
    this.snackBar.open(message, action, {
      duration: 2000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }
}