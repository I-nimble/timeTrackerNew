import { Component, OnInit } from '@angular/core';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { MatDialog } from '@angular/material/dialog';
import { AppKanbanDialogComponent } from './kanban-dialog.component';
import { AppOkDialogComponent } from './ok-dialog/ok-dialog.component';
import { ModalComponent } from 'src/app/components/confirmation-modal/modal.component';
import { MaterialModule } from 'src/app/material.module';
import { CommonModule } from '@angular/common';
import { TablerIconsModule } from 'angular-tabler-icons';
import { Todos } from './kanban';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { BoardsService } from 'src/app/services/apps/kanban/boards.service';
import { EmployeesService } from 'src/app/services/employees.service';
import { CompaniesService } from 'src/app/services/companies.service';
import { RatingsEntriesService } from 'src/app/services/ratings_entries.service';
import { ColumnDialogComponent } from './column-dialog/column-dialog.component';
import { forkJoin } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-kanban',
  templateUrl: './kanban.component.html',
  standalone: true,
  imports: [
    MaterialModule,
    CommonModule,
    TablerIconsModule,
    DragDropModule,
    NgScrollbarModule,
    FormsModule
  ],
})
export class AppKanbanComponent implements OnInit {
  role = localStorage.getItem('role');
  boards: any[] = [];
  todos: Todos[] = [];
  inprogress: Todos[] = [];
  completed: Todos[] = [];
  onhold: Todos[] = [];
  selectedBoardId: any = null;
  selectedBoardColumns: any[] = [];
  employees: any;
  isLoading = true;
  userId: string | null;
  taskSearch: string = '';

  constructor(
    public dialog: MatDialog,
    private snackBar: MatSnackBar,
    private kanbanService: BoardsService,
    private employeesService: EmployeesService,
    private companieService: CompaniesService,
    public ratingsEntriesService: RatingsEntriesService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.userId = localStorage.getItem('id');

    this.route.paramMap.subscribe(params => {
      const boardIdParam = params.get('id');
      this.selectedBoardId = boardIdParam ? +boardIdParam : null;
      this.loadBoards().then(() => {
        this.loadTasks(this.selectedBoardId);
      });
    });
  }

  onSearchTasks() {
    const query = this.taskSearch?.trim();
    if (!query) {
      this.loadTasks(this.selectedBoardId);
      return;
    }
    if (!this.selectedBoardId) {
      this.showSnackbar('Please select a board first');
      return;
    }
    this.kanbanService.searchTasks(this.selectedBoardId, query).subscribe((tasks: any[]) => {
      this.selectedBoardColumns.forEach(col => col.tasks = []);
      tasks.forEach(task => {
        const col = this.selectedBoardColumns.find(c => c.id === task.column_id);
        if (col) col.tasks.push(task);
      });
    });
  }

  get selectedBoard() {
    return this.boards.find((b) => b.id === this.selectedBoardId) || {};
  }

  loadBoards(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.kanbanService.getBoards().subscribe({
        next: (boards) => {
          this.boards = boards;
          this.isLoading = false;
          resolve();
        },
        error: (err) => {
          console.error(err);
          this.isLoading = false;
          reject(err);
        }
      });
    });
  }

  loadTasks(boardId: number | null): void {
    if (boardId === null) {
      this.kanbanService.getAllBoardsTasks().subscribe((allBoardsData) => {
        const columnsMap = new Map<string, any>();

        allBoardsData.forEach((board: { columns: any[]; tasks: any[] }) => {
          const columns = board.columns || [];
          const tasks = board.tasks || [];
          columns.forEach((column) => {
            if (columnsMap.has(column.name)) {
              const existing = columnsMap.get(column.name);

              existing.tasks.push(
                ...tasks.filter((task: any) => task.column_id === column.id)
              );
            } else {
              columnsMap.set(column.name, {
                ...column,

                tasks: tasks.filter(
                  (task: any) => task.column_id === column.id
                ),
              });
            }
          });
        });

        this.selectedBoardColumns = Array.from(columnsMap.values()).sort(
          (a, b) => a.position - b.position
        );
      });
    } else {
      this.kanbanService.getBoardWithTasks(boardId).subscribe((boardData) => {
        this.selectedBoardColumns = boardData.columns || [];
        this.selectedBoardColumns.sort((a, b) => a.position - b.position);
        const tasks = boardData.tasks || [];
        this.selectedBoardColumns.forEach((column) => {
          column.tasks = tasks.filter(
            (task: any) => task.column_id === column.id
          );
        });
      });
    }
  }

  dropColumn(event: CdkDragDrop<any[]>): void {
    moveItemInArray(
      event.container.data,
      event.previousIndex,
      event.currentIndex
    );
  
    this.updateColumnPositions();
  }

  drop(event: CdkDragDrop<any[]>, newColumnId: number): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      const movedTask = event.previousContainer.data[event.previousIndex];

      movedTask.column_id = newColumnId;

      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      const columns = this.selectedBoardColumns;
      const lastColumn = columns.reduce((prev, curr) =>
        prev.position > curr.position ? prev : curr
      );

      if (newColumnId === lastColumn.id && movedTask.active == true) {
        const todayStr = new Date().toISOString().split('T')[0];
        const entryData = [
          {
            rating_id: movedTask.id,
            date: todayStr,
            achieved: true,
            user_id: movedTask.employee_id || movedTask.user_id,
          },
        ];
        this.ratingsEntriesService.submit(entryData).subscribe({
          next: () => {
            this.showSnackbar('Task marked as completed!');
            this.loadTasks(this.selectedBoardId);
          },
          error: () => {
            this.showSnackbar('Error marking task as completed.');
            this.loadTasks(this.selectedBoardId);
          },
        });
      } else {
        this.kanbanService
          .updateTask(movedTask.id, { column_id: newColumnId })
          .subscribe(
            () => {},
            () => {
              this.showSnackbar('Error moving task.');
              this.loadTasks(this.selectedBoardId);
            }
          );
      }
    }
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
        } else {
          if (action === 'Edit') {
            this.updateTask(result.data);
          } else {
            this.saveTask(result.data);
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

    this.kanbanService.createBoard(newBoard).subscribe({
      next: () => {
        this.loadBoards();
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
    this.kanbanService.updateBoard(board.id, dataToUpdate).subscribe({
      next: () => {
        this.loadBoards();
        this.showSnackbar('Board updated!');
      },
      error: (error: any) => {
        this.showSnackbar(error.error.message);
      },
    });
  }

  saveTask(taskData: any): void {
    if (!taskData.due_date) {
      const now = new Date();
      const dueDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      taskData.due_date = dueDate;
    }

    const newTask = {
      company_id: this.boards[0].company_id,
      goal: taskData.goal,
      recommendations: taskData.recommendations,
      due_date: taskData.due_date,
      priority: taskData.priority,
      board_id: this.selectedBoardId,
      column_id: taskData.columnId,
      employee_id: taskData.employee_id,
      comments: taskData.comments,
      task_attachments: taskData.task_attachments,
    };

    this.kanbanService.addTaskToBoard(newTask).subscribe({
      next: () => {
        this.loadTasks(this.selectedBoardId);
        this.showSnackbar('Task added to board successfully!');
      },
      error: (error: any) => {
        this.showSnackbar(error.error.message);
      },
    });
  }

  updateTask(taskData: any): void {
    const updatedTask = {
      id: taskData.id,
      company_id: this.boards[0].company_id,
      goal: taskData.goal,
      recommendations: taskData.recommendations,
      due_date: taskData.due_date,
      priority: taskData.priority,
      board_id: this.selectedBoardId,
      column_id: taskData.columnId,
      employee_id: taskData.employee_id,
      comments: taskData.comments,
      task_attachments: taskData.task_attachments,
    };

    this.kanbanService.updateTask(updatedTask.id, updatedTask).subscribe(
      () => {
        this.loadTasks(this.selectedBoardId);
        this.showSnackbar('Task updated successfully!');
      },
      () => {
        this.showSnackbar('Error updating task.');
      }
    );
  }

  deleteTask(task: Todos, boardId: number): void {
    const del = this.dialog.open(ModalComponent, {
      data: {
        action: 'delete',
        subject: 'task',
      },
    });

    del.afterClosed().subscribe((result) => {
      if (result) {
        this.kanbanService.removeTaskFromBoard(task).subscribe(() => {
          this.loadTasks(boardId);
          this.showSnackbar('Task deleted successfully!');
        });
      }
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
        this.kanbanService.deleteBoard(id).subscribe(() => {
          this.loadBoards();
          this.showSnackbar('Board deleted!');
        });
      }
    });
  }

  deleteColumn(id: number): void {
    const del = this.dialog.open(ModalComponent, {
      data: {
        action: 'delete',
        subject: 'column',
      },
    });

    del.afterClosed().subscribe((result) => {
      if (result) {
        this.kanbanService.deleteColumn(id).subscribe(() => {
          this.loadBoards();
          this.showSnackbar('Column deleted successfully!');
        });
      }
    });
  }

  showSnackbar(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 2000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }

  getInitials(user: any) {
    return user.name.charAt(0).toUpperCase().concat(user.last_name.charAt(0).toUpperCase());
  }

  isOverdue(date: any) {
    const today = new Date();
    const dueDate = new Date(date);
    return dueDate < today;
  }

  handleCreateTaskClick(column: any) {
    if(!this.selectedBoardId) {
      this.showSnackbar('Please select a board to add a task');
      return;
    }
    this.openDialog('Add', {
      columnId: column.id,
      columnName: column.name,
      company_id: this.selectedBoard.company_id
    })
  }

  createColumn(): void {
  const dialogRef = this.dialog.open(ColumnDialogComponent, {
    width: '400px',
    data: { 
      action: 'Add', 
      name: '', 
    }
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      this.kanbanService.createColumn(this.selectedBoardId, {
        name: result.name,
        position: this.selectedBoardColumns.length + 1,
      }).subscribe(() => {
        this.loadTasks(this.selectedBoardId);
        this.showSnackbar('Column created!');
      });
    }
  });
}

editColumn(column: any): void {
  const dialogRef = this.dialog.open(ColumnDialogComponent, {
    width: '400px',
    data: { 
      action: 'Edit', 
      name: column.name, 
      position: column.position 
    }
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      this.kanbanService.updateColumn(column.id, {
        name: result.name,
        position: result.position
      }).subscribe(() => {
        this.loadTasks(this.selectedBoardId);
        this.showSnackbar('Column updated!');
      });
    }
  });
}

updateColumnPositions(): void {
  this.selectedBoardColumns.forEach((column, index) => {
    column.position = index + 1;
  });

  const updates = this.selectedBoardColumns.map(column => ({
    id: column.id,
    position: column.position
  }));

  const updateObservables = updates.map(update => 
    this.kanbanService.updateColumn(update.id, { position: update.position })
  );

  forkJoin(updateObservables).subscribe({
    next: () => {
      this.showSnackbar('Columns reordered successfully');
    },
    error: (error) => {
      console.error('Error updating column positions:', error);
      this.showSnackbar('Error updating some column positions');
      this.loadTasks(this.selectedBoardId);
    }
  });
}

}
