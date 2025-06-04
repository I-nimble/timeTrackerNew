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
import { AppDeleteDialogComponent } from './delete-dialog/delete-dialog.component';
import { MaterialModule } from 'src/app/material.module';
import { CommonModule } from '@angular/common';
import { TablerIconsModule } from 'angular-tabler-icons';
import { Todos } from './kanban';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { BoardsService } from 'src/app/services/apps/kanban/boards.service';
import { EmployeesService } from 'src/app/services/employees.service';
import { CompaniesService } from 'src/app/services/companies.service';

@Component({
  selector: 'app-kanban',
  templateUrl: './kanban.component.html',
  imports: [
    MaterialModule,
    CommonModule,
    TablerIconsModule,
    DragDropModule,
    NgScrollbarModule,
  ],
})
export class AppKanbanComponent implements OnInit {
  role = localStorage.getItem('role');
  boards: any[] = [];
  todos: Todos[] = [];
  inprogress: Todos[] = [];
  completed: Todos[] = [];
  onhold: Todos[] = [];
  selectedBoardId: number;
  selectedBoardColumns: any[] = [];
  employees: any;
  userId: any;
  isLoading = true;

 
  companyId: any;

  constructor(
    public dialog: MatDialog,
    private snackBar: MatSnackBar,
    private kanbanService: BoardsService,
    private employeesService: EmployeesService,
    private companieService: CompaniesService,
  ) {
    this.loadBoards();
  }

   ngOnInit(): void {
    this.userId = localStorage.getItem('id');
    this.getEmployee();
    // this.loadBoards();
  }

  loadBoards(): void {
    this.kanbanService.getBoards().subscribe((boards) => {
      console.log(boards)
      if (this.role === '2' || this.role === '3') {
      this.boards = boards.filter((b: { company_id: any; }) => b.company_id === this.companyId);
    } else {
      
      this.boards = boards;
    }
    if (this.boards.length) {
      this.selectedBoardId = this.boards[0].id;
      this.loadTasks(this.selectedBoardId);
    }
    this.isLoading = false;
    });
  }

  getEmployee() {
  console.log(this.role === '2')
    if (this.role === '2' ) {
      this.employeesService.getById(this.userId).subscribe((employee:any) => {
        if(employee?.length > 0) {
          this.companyId = employee[0].company_id
          console.log("El companidi", this.companyId)
          this.loadBoards(); 
        } 
      });
    }
    else if (this.role === '3'){
      this.companieService.getByOwner().subscribe((company: any) => {
        this.companyId = company.company_id;
        console.log("El companidi", this.companyId)
        this.loadBoards(); 
      });
    } else {
      this.loadBoards();
    }
  }
  
  loadTasks(boardId: number): void {
    this.kanbanService.getBoardWithTasks(boardId).subscribe((boardData) => {
      this.selectedBoardColumns = boardData.columns || [];

      this.selectedBoardColumns.sort((a, b) => a.position - b.position);

      const tasks = boardData.tasks || [];
      this.selectedBoardColumns.forEach(column => {
        column.tasks = tasks.filter((task: any) => task.column_id === column.id);
      });
    });
  }

  drop(event: CdkDragDrop<any[]>, newColumnId: number): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const movedTask = event.previousContainer.data[event.previousIndex];

      movedTask.column_id = newColumnId;

      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      this.kanbanService.updateTask(movedTask.id, { column_id: newColumnId }).subscribe(() => {
       
      }, () => {
        this.showSnackbar('Error moving task.');
        this.loadTasks(this.selectedBoardId); 
      });
    }
  }


  openDialog(action: string, data: any): void {
    const dialogRef = this.dialog.open(AppKanbanDialogComponent, {
      width: '600px',
      data: {
        action,
        ...data,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.event === 'Add' || result?.event === 'Edit') {
        if (result.data.type === 'board') {
          this.saveBoard(result.data);
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
      name: board.goal
    };

    this.kanbanService.createBoard(newBoard).subscribe(() => {
      this.loadBoards();
      this.showSnackbar('Board created!');
    });
  }

  saveTask(taskData: any): void {
    const newTask = {
      company_id: this.boards[0].company_id, 
      goal: taskData.goal,
      recommendations: taskData.recommendations,
      due_date: taskData.due_date,
      priority: taskData.priority,
      board_id: this.selectedBoardId,
      column_id: taskData.columnId
    };

    this.kanbanService.addTaskToBoard(newTask).subscribe(() => {
      this.loadTasks(this.selectedBoardId);
      this.showSnackbar('Task added to board successfully!');
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
    column_id: taskData.columnId
  };

  this.kanbanService.updateTask(updatedTask.id, updatedTask).subscribe(() => {
    this.loadTasks(this.selectedBoardId);
    this.showSnackbar('Task updated successfully!');
  }, () => {
    this.showSnackbar('Error updating task.');
  });
}



  deleteTask(task: Todos, boardId: number): void {
    const del = this.dialog.open(AppDeleteDialogComponent);

    del.afterClosed().subscribe((result) => {
      if (result === 'true') {
        this.kanbanService.removeTaskFromBoard(task).subscribe(() => {
          this.loadTasks(boardId);
          this.showSnackbar('Task deleted successfully!');
        });
      }
    });
  }

  createBoard(board: any): void {
    this.kanbanService.createBoard(board).subscribe(() => {
      this.loadBoards();
      this.showSnackbar('Board created!');
    });
  }

  deleteBoard(id: number): void {
    this.kanbanService.deleteBoard(id).subscribe(() => {
      this.loadBoards();
      this.showSnackbar('Board deleted!');
    });
  }

  showSnackbar(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 2000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }
}
