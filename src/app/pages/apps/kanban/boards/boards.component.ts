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
import { TourMatMenuModule, TourService } from 'ngx-ui-tour-md-menu';
import { RoleTourService } from 'src/app/services/role-tour.service';

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
    TablerIconsModule,
    TourMatMenuModule,
  ],
})
export class AppBoardsComponent implements OnInit {
  boards: any[] = [];
  loading: boolean = true;
  role = localStorage.getItem('role');
  userId: string | null;

  constructor(
    private boardsService: BoardsService,
    private router: Router,
    private snackBar: MatSnackBar,
    public dialog: MatDialog,
    private roleTourService: RoleTourService,
    public tourService: TourService,
  ) {}

  ngOnInit(): void {
    void this.fetchBoards();
    this.userId = localStorage.getItem('id');
  }

  fetchBoards(): Promise<void> {
    this.loading = true;
    return new Promise((resolve) => {
      this.boardsService.getBoards().subscribe({
        next: (res) => {
          this.boards = res;
          localStorage.setItem('kanban.hasBoards', this.boards.length > 0 ? 'true' : 'false');
          if (this.boards.length === 0) {
            this.roleTourService.setKanbanHasTasks(false);
          }
          this.loading = false;
          resolve();
        },
        error: (err) => {
          console.error('Error fetching boards', err);
          localStorage.setItem('kanban.hasBoards', 'false');
          this.roleTourService.setKanbanHasTasks(false);
          this.loading = false;
          resolve();
        }
      });
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
      if (!result || result.event === 'Cancel') {
        this.roleTourService.clearPendingResume();
        return;
      }
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

  onAddBoardClick(): void {
    const current = this.tourService.currentStep;
    if (
      current?.anchorId === 'kanban-new-board' ||
      current?.anchorId === 'kanban-first-board' ||
      this.boards.length === 0
    ) {
      this.roleTourService.setPendingResume('kanban-board-actions');
    }
    this.openDialog('Add', { type: 'board' });
  }

  async saveBoard(board: any): Promise<void> {
    const newBoard = {
      name: board.goal,
      visibility: board.selectedVisibility,
      restrictedUsers: board.restrictedUsers,
    };

    this.boardsService.createBoard(newBoard).subscribe({
      next: async (res) => {
        await this.fetchBoards();
        this.roleTourService.setKanbanHasTasks(false);
        this.showSnackbar('Board created!');

        const pendingAnchor = this.roleTourService.consumePendingResumeAnchor();
        if (pendingAnchor === 'kanban-board-actions') {
          this.router.navigate(['/apps/kanban']).then(() => {
            void this.roleTourService.resumeAtAnchor(pendingAnchor, { ignoreCompleted: true });
          });
        }
      },
      error: (error: any) => {
        this.roleTourService.clearPendingResume();
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