import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BoardsService } from 'src/app/services/apps/kanban/boards.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { MatFormField } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatCard, MatCardContent, MatCardTitle, MatCardActions } from '@angular/material/card';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { AppKanbanDialogComponent } from '../kanban-dialog.component';
import { ModalComponent } from 'src/app/components/confirmation-modal/modal.component';
import { MatMenu } from '@angular/material/menu';
import { MatMenuModule } from '@angular/material/menu';
import { TablerIconsModule } from 'angular-tabler-icons';

@Component({
  selector: 'app-boards',
  templateUrl: './boards.component.html',
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatFormField,
    MatIcon,
    MatCard,
    MatCardContent,
    MatCardTitle,
    MatCardActions,
    FormsModule,
    MatMenu,
    MatMenuModule,
    TablerIconsModule
  ],
})
export class AppBoardsComponent implements OnInit {
  boards: any[] = [];
  loading: boolean = true;
  role = localStorage.getItem('role');
  userId: string | null;

  constructor(private boardsService: BoardsService, private router: Router, private snackBar: MatSnackBar, public dialog: MatDialog) {}

  ngOnInit(): void {
    this.fetchBoards();
    this.userId = localStorage.getItem('id');
  }

  fetchBoards(): void {
    this.loading = true;
    this.boardsService.getBoards().subscribe({
      next: (res) => {
        this.boards = res;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching boards', err);
        this.loading = false;
      }
    });
  }

  openBoard(boardId: number) {
    this.router.navigate(['/apps/kanban', boardId]);
  }

  showSnackbar(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 2000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }

  openDialog(action: string, data: any): void {
    const dialogRef = this.dialog.open(AppKanbanDialogComponent, {
      width: '900px',
      maxWidth: '90vw',
      data: {
        action,
        ...data,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.event === 'Add' || result?.event === 'Edit') {
        if (result.data.type === 'board') {
          if (action === 'Edit') {
            this.updateBoard(result.data);
          } else {
            this.saveBoard(result.data);
          }
        }
      }
    });
  }

  saveBoard(board: any): void {
    const newBoard = {
      name: board.goal,
      visibility: board.selectedVisibility,
      restrictedUsers: board.restrictedUsers,
    };

    this.boardsService.createBoard(newBoard).subscribe({
      next: () => {
        this.fetchBoards();
        this.showSnackbar('Board created!');
      },
      error: (error: any) => {
        this.showSnackbar(error.error.message);
      },
    });
  }

  updateBoard(board: any): void {
    const dataToUpdate = {
      ...board,
      name: board.goal,
      visibility: board.selectedVisibility,
    };
    this.boardsService.updateBoard(board.id, dataToUpdate).subscribe({
      next: () => {
        this.fetchBoards();
        this.showSnackbar('Board updated!');
      },
      error: (error: any) => {
        this.showSnackbar(error.error.message);
      },
    });
  }

  deleteBoard(id: number): void {
    const del = this.dialog.open(ModalComponent, {
      data: {
        action: 'delete',
        subject: 'board',
      },
    });

    del.afterClosed().subscribe((result) => {
      if (result) {
        this.boardsService.deleteBoard(id).subscribe(() => {
          this.fetchBoards();
          this.showSnackbar('Board deleted!');
        });
      }
    });
  }
}