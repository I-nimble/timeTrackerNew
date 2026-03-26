import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { Note } from 'src/app/models/Note.model';
import { CommonModule } from '@angular/common';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { TablerIconsModule } from 'angular-tabler-icons';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from 'src/app/material.module';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UsersService } from 'src/app/services/users.service';
import { NotesService } from 'src/app/services/notes.service';
import { TourMatMenuModule } from 'ngx-ui-tour-md-menu';

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
    TourMatMenuModule,
  ]
})
export class AppNotesComponent implements OnInit, OnDestroy {
  sidePanelOpened = signal(true);

  allNotes = signal<Note[]>([]);

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
  private autoSaveTimeout: ReturnType<typeof setTimeout> | null = null;
  private readonly autoSaveDelayMs = 800;
  private lastSavedContentByNoteId = new Map<number, string>();

  constructor(
    private snackBar: MatSnackBar, 
    private usersService: UsersService,
    private notesService: NotesService
  ) { }

  ngOnInit(): void {
    this.getUserInfo();
  }

  ngOnDestroy(): void {
    this.clearAutoSaveTimeout();
  }

  get currentNote(): Note | null {
    return this.selectedNote();
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.searchText.set(filterValue);
    this.refreshVisibleNotes();
  }

  filter(v: string): Note[] {
    return this.allNotes().filter((x) =>
      (x.content ?? '').toLowerCase().includes(v.toLowerCase())
    );
  }

  isOver(): boolean {
    return window.matchMedia(`(max-width: 960px)`).matches;
  }

  onSelect(note: Note): void {
    this.selectedNote.set(note);
    this.clrName.set(note.color ?? 'warning');
    this.currentNoteTitle.set(note.content ?? '');
    this.selectedColor.set(note.color ?? null);
    this.changedTitle = note.content ?? '';
  }

  onSelectColor(colorName: string): void {
    const currentNote = this.selectedNote();
    if (currentNote) {
      const contentToSave = this.changedTitle ?? currentNote.content ?? '';
      const currentColor = currentNote.color ?? 'warning';

      if (currentColor === colorName && this.isSameAsLastSaved(currentNote.id, contentToSave)) {
        return;
      }

      this.clrName.set(colorName);
      this.selectedColor.set(colorName);

      this.notesService
        .updateNote(currentNote.id, {
          date_time: currentNote.date_time instanceof Date ? currentNote.date_time.toISOString() : currentNote.date_time,
          content: contentToSave,
          color: colorName,
        })
        .subscribe({
          next: () => {
            this.updateLocalNote(currentNote.id, {
              color: colorName,
              content: contentToSave,
            });
            this.lastSavedContentByNoteId.set(currentNote.id, contentToSave);
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
        this.removeLocalNote(note.id);
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
      content: '',
      color: this.clrName(),
    };
    this.notesService.createNote(newNote).subscribe({
      next: (createdNote: Note) => {
        this.addLocalNote(createdNote);
        this.onSelect(createdNote);
        this.openSnackBar('Note added successfully!');
      },
      error: () => {
        this.openSnackBar('Error adding note', 'Close', 'delete');
      },
    });
  }

  updateNoteTitle(newTitle: string): void {
    const currentNote = this.selectedNote();
    const contentToSave = newTitle ?? '';

    if (currentNote) {
      if (this.isSameAsLastSaved(currentNote.id, contentToSave)) {
        return;
      }

      this.notesService
        .updateNote(currentNote.id, {
          date_time: currentNote.date_time instanceof Date ? currentNote.date_time.toISOString() : currentNote.date_time,
          content: contentToSave,
          color: currentNote.color ?? 'warning',
        })
        .subscribe({
          next: () => {
            this.setLocalNoteContent(currentNote.id, contentToSave);
            this.lastSavedContentByNoteId.set(currentNote.id, contentToSave);
          },
          error: () => {
            this.openSnackBar('Error updating note', 'Close', 'delete');
          },
        });
    }
  }

  changeNoteTitle(newTitle: string): void {
    this.changedTitle = newTitle ?? '';
    this.scheduleAutoSave();
  }

  private scheduleAutoSave(): void {
    const currentNote = this.selectedNote();
    if (!currentNote) {
      return;
    }

    this.clearAutoSaveTimeout();
    this.autoSaveTimeout = setTimeout(() => {
      this.updateNoteTitle(this.changedTitle);
    }, this.autoSaveDelayMs);
  }

  private clearAutoSaveTimeout(): void {
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
      this.autoSaveTimeout = null;
    }
  }

  private isSameAsLastSaved(noteId: number, content: string): boolean {
    const currentSelected = this.selectedNote();
    const currentContent = currentSelected?.id === noteId ? currentSelected.content ?? '' : '';
    const lastSavedContent = this.lastSavedContentByNoteId.get(noteId) ?? currentContent;

    return content === currentContent || content === lastSavedContent;
  }

  private setLocalNoteContent(noteId: number, content: string): void {
    this.updateLocalNote(noteId, { content });

    const currentSelected = this.selectedNote();
    if (currentSelected?.id === noteId) {
      this.currentNoteTitle.set(content);
    }
  }

  private refreshVisibleNotes(): void {
    const query = (this.searchText() ?? '').trim();
    this.notes.set(query ? this.filter(query) : [...this.allNotes()]);
  }

  private addLocalNote(note: Note): void {
    const normalizedNote: Note = {
      ...note,
      content: note.content ?? '',
      color: note.color ?? 'warning',
    };

    this.allNotes.set([normalizedNote, ...this.allNotes()]);
    this.lastSavedContentByNoteId.set(normalizedNote.id, normalizedNote.content ?? '');
    this.refreshVisibleNotes();
  }

  private removeLocalNote(noteId: number): void {
    this.allNotes.set(this.allNotes().filter((note) => note.id !== noteId));
    this.lastSavedContentByNoteId.delete(noteId);
    this.refreshVisibleNotes();

    const currentSelected = this.selectedNote();
    if (currentSelected?.id !== noteId) {
      return;
    }

    const fallback = this.allNotes()[0] ?? null;
    this.selectedNote.set(fallback);

    if (fallback) {
      this.currentNoteTitle.set(fallback.content ?? '');
      this.changedTitle = fallback.content ?? '';
      this.selectedColor.set(fallback.color ?? null);
      this.clrName.set(fallback.color ?? 'warning');
      return;
    }

    this.currentNoteTitle.set('');
    this.changedTitle = '';
    this.selectedColor.set(null);
  }

  private updateLocalNote(noteId: number, changes: Partial<Note>): void {
    this.allNotes.set(
      this.allNotes().map((note) =>
        note.id === noteId ? { ...note, ...changes } : note
      )
    );
    this.refreshVisibleNotes();

    const currentSelected = this.selectedNote();
    if (currentSelected?.id === noteId) {
      const updatedSelected = { ...currentSelected, ...changes };
      this.selectedNote.set(updatedSelected);
      if (changes.content !== undefined) {
        this.currentNoteTitle.set(changes.content ?? '');
        this.changedTitle = changes.content ?? '';
      }
      if (changes.color !== undefined) {
        this.selectedColor.set(changes.color ?? null);
        this.clrName.set(changes.color ?? 'warning');
      }
    }
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

  loadNotes(userId: number, noteIdToSelect?: number): void {
    this.notesService.getNotesByUserId(userId).subscribe({
      next: (notes: Note[]) => {
        this.allNotes.set(notes);
        this.refreshVisibleNotes();
        this.lastSavedContentByNoteId.clear();
        notes.forEach((note) => {
          this.lastSavedContentByNoteId.set(note.id, note.content ?? '');
        });

        if (noteIdToSelect != null) {
          this.selectedNote.set(
            notes.find((note) => note.id === noteIdToSelect) ?? null
          );
        }

        const selectedNoteId = this.selectedNote()?.id;
        if (selectedNoteId != null) {
          this.selectedNote.set(notes.find((note) => note.id === selectedNoteId) ?? null);
        }

        const currentNote = this.selectedNote();
        if (currentNote) {
          this.selectedColor.set(currentNote.color ?? null);
          this.clrName.set(currentNote.color ?? 'warning');
          this.currentNoteTitle.set(currentNote.content ?? '');
          this.changedTitle = currentNote.content ?? '';
        }

        if (!this.selectedNote() && notes.length > 0) {
          this.selectedNote.set(this.notes()[0]);
          const firstNote = this.selectedNote();
          if (firstNote) {
            this.selectedColor.set(firstNote.color ?? null);
            this.clrName.set(firstNote.color ?? 'warning');
            this.currentNoteTitle.set(firstNote.content ?? '');
            if (this.changedTitle == '') { this.changedTitle = firstNote.content ?? ''; }
          }
        } else if (!this.selectedNote()) {
          this.selectedColor.set(null);
          this.currentNoteTitle.set('');
          this.changedTitle = '';
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
