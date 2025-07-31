import { Component, OnInit, signal } from '@angular/core';
import { Note } from './note';
import { NoteService } from 'src/app/services/apps/notes/note.service';
import { CommonModule } from '@angular/common';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { TablerIconsModule } from 'angular-tabler-icons';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from 'src/app/material.module';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UsersService } from 'src/app/services/users.service';
import { NotesService } from 'src/app/services/notes.service';

@Component({
  standalone: true,
  selector: 'app-notes',
  templateUrl: './notes.component.html',
  styleUrls: ['./notes.component.scss'],
  imports: [
    CommonModule,
    NgScrollbarModule,
    TablerIconsModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
  ]
})
export class AppNotesComponent implements OnInit {
  sidePanelOpened = signal(true);

  notes = signal<Note[]>([]);

  selectedNote = signal<Note | null>(null);

  active = signal<boolean>(false);

  searchText = signal<any>('');

  clrName = signal<string>('warning');

  colors = [
    { colorName: 'primary' },
    { colorName: 'warning' },
    { colorName: 'secondary' },
    { colorName: 'error' },
    { colorName: 'success' },
  ];

  currentNoteTitle = signal<string>('');
  selectedColor = signal<string | null>(null);

  userInfo: any;
  changedTitle: string = '';

  constructor(
    public noteService: NoteService, 
    private snackBar: MatSnackBar, 
    private usersService: UsersService, 
    private notesService: NotesService
  ) { }

  ngOnInit(): void {
    this.getUserInfo();
  }

  get currentNote(): Note | null {
    return this.selectedNote();
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.notes.set(this.filter(filterValue));
  }

  filter(v: string): Note[] {
    return this.noteService
      .getNotes()
      .filter((x) => x.content.toLowerCase().includes(v.toLowerCase()));
  }

  isOver(): boolean {
    return window.matchMedia(`(max-width: 960px)`).matches;
  }

  onSelect(note: Note): void {
    this.selectedNote.set(note);
    this.clrName.set(note.color);
    this.currentNoteTitle.set(note.content);
    this.selectedColor.set(note.color);
    this.changedTitle = note.content;
  }

  onSelectColor(colorName: string): void {
    this.clrName.set(colorName);
    this.selectedColor.set(colorName);
    if (this.selectedNote()) {
      this.selectedNote()!.color = colorName;
    }
    const currentNote = this.selectedNote();
    if (currentNote) {
      this.notesService
        .updateNote(currentNote.id, {
          date_time: currentNote.date_time instanceof Date ? currentNote.date_time.toISOString() : currentNote.date_time,
          content: this.changedTitle,
          color: colorName,
        })
        .subscribe({
          next: () => {
            this.loadNotes(this.userInfo.id);
          },
          error: () => {
            this.openSnackBar('Error updating note color', 'Close', 'delete');
          },
        });
    }
    this.active.set(!this.active());
  }

  removenote(note: Note): void {
    this.notesService.deleteNote(note.id).subscribe({
      next: () => {
        this.loadNotes(this.userInfo.id);
        if (this.selectedNote() && this.selectedNote()!.id === note.id) {
          this.selectedNote.set(null);
          this.currentNoteTitle.set('');
        }
        this.openSnackBar('Note deleted successfully!');
      },
      error: () => {
        this.openSnackBar('Error deleting note', 'Close', 'delete');
      },
    });
  }

  addNoteClick(): void {
    const newNote = {
      user_id: this.userInfo.id,
      date_time: new Date().toISOString(),
      content: 'This is a new note',
      color: this.clrName(),
    };
    this.notesService.createNote(newNote).subscribe({
      next: () => {
        this.loadNotes(this.userInfo.id);
        this.openSnackBar('Note added successfully!');
      },
      error: () => {
        this.openSnackBar('Error adding note', 'Close', 'delete');
      },
    });
  }

  updateNoteTitle(newTitle: string): void {
    const currentNote = this.selectedNote();
    if (currentNote) {
      this.notesService
        .updateNote(currentNote.id, {
          date_time: currentNote.date_time instanceof Date ? currentNote.date_time.toISOString() : currentNote.date_time,
          content: newTitle,
          color: currentNote.color,
        })
        .subscribe({
          next: () => {
            this.loadNotes(this.userInfo.id);
          },
          error: () => {
            this.openSnackBar('Error updating note', 'Close', 'delete');
          },
        });
    }
  }

  changeNoteTitle(newTitle: string): void {
    this.changedTitle = newTitle;
  }

  getUserInfo() {
    this.usersService.getUsers({
      searchField: "",
      filter: {
        currentUser: true,
        includeAdmins: true
      }
    }).subscribe((user) => {
      this.userInfo = user[0];
      this.loadNotes(this.userInfo.id);
    });
  }

  loadNotes(userId: number): void {
    this.notesService.getNotesByUserId(userId).subscribe({
      next: (notes: Note[]) => {
        this.notes.set(notes);
        if (!this.selectedNote()) {
          this.selectedNote.set(this.notes()[0]);
          const currentNote = this.selectedNote();
          if (currentNote) {
            this.selectedColor.set(currentNote.color);
            this.clrName.set(currentNote.color);
            this.currentNoteTitle.set(currentNote.content);
            if (this.changedTitle == '') { this.changedTitle = currentNote.content; }
          }
        }
      },
      error: (error) => {
        console.error('Error fetching notes:', error);
      },
    });
  }

  openSnackBar(
    message: string,
    action: string = 'Close',
    type: 'create' | 'delete' = 'create'
  ): void {
    this.snackBar.open(message, action, {
      duration: 2000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }
}
