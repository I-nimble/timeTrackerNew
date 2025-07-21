import { CommonModule } from '@angular/common';
import { Component, Inject, Optional, OnInit, } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MaterialModule } from 'src/app/material.module';
import { DatePipe } from '@angular/common';
import { MatDatepickerModule } from '@angular/material/datepicker';
import {
  MatNativeDateModule,
  provideNativeDateAdapter,
} from '@angular/material/core';
import { RatingsService } from 'src/app/services/ratings.service';
import { CompaniesService } from 'src/app/services/companies.service';
import { EmployeesService } from 'src/app/services/employees.service';
import { UsersService } from 'src/app/services/users.service';
import { ModalComponent } from 'src/app/components/confirmation-modal/modal.component';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-kanban-dialog',
  templateUrl: './kanban-dialog.component.html',
  standalone: true,
  imports: [
    MaterialModule,
    CommonModule,
    TablerIconsModule,
    FormsModule,
    ReactiveFormsModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  providers: [DatePipe, provideNativeDateAdapter()],
})
export class AppKanbanDialogComponent implements OnInit {
  action: string;
  local_data: any;
  priorities: any[] = [];
  visibilities = ['public', 'restricted', 'private'];
  users: any[] = [];
  attachments: any[] = [];
  attachmentsUrl: string =
    'https://inimble-app.s3.us-east-1.amazonaws.com/task_attachments/';
  showMentionList = false;
  mentionQuery = '';
  mentionIndex = 0;
  filteredUsers: any[] = [];
  mentionStartPos = 0;
  commentText: string = '';
  dueTime: string = '';
  companies: any[] = [];

  constructor(
    public dialogRef: MatDialogRef<AppKanbanDialogComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any,
    private datePipe: DatePipe,
    public ratingsService: RatingsService,
    private companiesService: CompaniesService,
    private employeesService: EmployeesService,
    private usersService: UsersService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.getPriorities();
    this.local_data = { ...data };
    this.action = this.local_data.action;

    if (data.type === 'board') {
      this.local_data.type = 'board';
      this.local_data.id = data.id || null;
      this.local_data.goal = data.name || '';
      this.local_data.previousVisibility = data.visibility || 'public';
      this.local_data.selectedVisibility = data.visibility || 'public';
      this.local_data.restrictedUsers =
        data.restrictedUsers?.map((u: any) => u.user_id) || [];
      this.getCompany();
    } else {
      if (
        this.local_data.task_attachments &&
        Array.isArray(this.local_data.task_attachments)
      ) {
        this.attachments = [...this.local_data.task_attachments];
      }
      this.local_data.type = 'task';
      this.local_data.date = this.datePipe.transform(new Date(), 'd MMMM')!;
      this.local_data.taskProperty ||= 'Design';
      this.local_data.imageUrl ||= '/assets/images/taskboard/kanban-img-1.jpg';
      this.getCompany();
    }
  }

  ngOnInit() {
    if (this.local_data.due_date) {
      const dueDate = new Date(this.local_data.due_date);
      if (!isNaN(dueDate.getTime())) {
        const hours = dueDate.getHours().toString().padStart(2, '0');
        const minutes = dueDate.getMinutes().toString().padStart(2, '0');
        this.dueTime = `${hours}:${minutes}`;
      }
    }
  }

  showSnackbar(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 2000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }

  downloadAttachment(filename: string) {
    const url = this.attachmentsUrl + filename;
    fetch(url)
      .then((response) => response.blob())
      .then((blob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(a.href);
      })
      .catch((error) => {
        console.error('Download failed:', error);
      });
  }

  onFileSelected(event: any): void {
    const files: FileList = event.target.files;
    for (let i = 0; i < files.length; i++) {
      this.attachments.push(files.item(i)!);
    }
    event.target.value = '';
  }

  removeAttachment(index: number): void {
    this.attachments.splice(index, 1);
  }

  getCompany() {
    if (localStorage.getItem('role') === '3') {
      this.companiesService.getByOwner().subscribe((company: any) => {
        this.getUsers(company.company_id);
      });
    } else if (localStorage.getItem('role') === '2') {
      this.employeesService.getByEmployee().subscribe((employee: any) => {
        this.getUsers(employee.company_id);
      });
    } else if (
      localStorage.getItem('role') === '1'
    ) {
      this.companiesService.getCompanies().subscribe((companies: any) => {
        this.companies = companies;
        if(this.local_data.company_id) {
          const company = companies.find(
            (c: any) => c.id === this.local_data.company_id
          );
          this.getUsers(company.id);
        }
        else {
          this.getUsers();
        }
      });
    }
  }

  getUsers(companyId?: number) {
    if(companyId) {
      this.companiesService
        .getEmployees(companyId)
        .subscribe((employees: any) => {
          this.users = this.users.concat(employees.map((e: any) => e.user));
          this.companiesService
            .getEmployer(companyId)
            .subscribe((employer: any) => {
              this.users.push(employer.user);
              this.users = this.users.sort((a: any, b: any) =>
                a.name.localeCompare(b.name)
              );
            });
        });
    }
    else {
      this.companies.forEach((company: any) => {
        this.companiesService
          .getEmployees(company.id)
          .subscribe((employees: any) => {
            this.users = this.users.concat(employees.map((e: any) => e.user));
            this.companiesService
              .getEmployer(company.id)
              .subscribe((employer: any) => {
                this.users.push(employer.user);
                this.users = this.users.sort((a: any, b: any) =>
                  a.name.localeCompare(b.name)
                );
              });
          });
      });
    }
  }

  getPriorities() {
    this.ratingsService.getPriorities().subscribe({
      next: (priorities: any[]) => {
        this.priorities = priorities || [];
        if (!this.priorities.length) {
          this.showSnackbar("No priorities found.");
        }
      },
      error: () => {
        this.showSnackbar("Error getting priorities.")
        this.priorities = [];
      }
    });
  }

  doAction(): void {
    this.local_data.task_attachments = this.attachments;
    if (
      this.action === 'Edit' &&
      this.local_data.previousVisibility === 'private' &&
      this.local_data.selectedVisibility === 'public'
    ) {
      const dialogRef = this.dialog.open(ModalComponent, {
        data: {
          action: this.action,
          type: 'board visibility',
          message:
            'This will make the board public. Everyone will be able to see it.',
        },
      });

      dialogRef.afterClosed().subscribe((result: any) => {
        if (!result) return;
        if (result) {
          this.dialogRef.close({ event: this.action, data: this.local_data });
        }
      });
    } else {
      this.dialogRef.close({ event: this.action, data: this.local_data });
    }
  }

  closeDialog(): void {
    this.dialogRef.close({ event: 'Cancel' });
  }

  handleVisibilityChange(event: any) {
    this.local_data.selectedVisibility = event.value;
    this.local_data.restrictedUsers = [];
  }

  onCommentInput(event: any) {
    const textarea = event.target;
    const value = textarea.value;
    const pos = textarea.selectionStart;
    const textUpToCursor = value.slice(0, pos);
    const atMatch = /@([a-zA-Z0-9_]*)$/.exec(textUpToCursor);

    if (atMatch) {
      this.mentionQuery = atMatch[1];
      this.filteredUsers = this.users.filter((u) =>
        `${u.name} ${u.last_name}`
          .toLowerCase()
          .includes(this.mentionQuery.toLowerCase())
      );
      this.showMentionList = this.filteredUsers.length > 0;
      this.mentionStartPos = pos - this.mentionQuery.length - 1;
      this.mentionIndex = 0;
    } else {
      this.showMentionList = false;
    }
  }

  onCommentKeydown(event: KeyboardEvent) {
    if (!this.showMentionList) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.mentionIndex = (this.mentionIndex + 1) % this.filteredUsers.length;
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.mentionIndex =
        (this.mentionIndex - 1 + this.filteredUsers.length) %
        this.filteredUsers.length;
    } else if (event.key === 'Enter') {
      event.preventDefault();
      this.selectMention(this.filteredUsers[this.mentionIndex]);
    } else if (event.key === 'Escape') {
      this.showMentionList = false;
    }
  }

  selectMention(user: any) {
    const textarea: HTMLTextAreaElement | null = document.querySelector(
      'textarea[name="comments"]'
    );
    if (!textarea) return;
    const value = this.local_data.comments || '';
    const before = value.slice(0, this.mentionStartPos);
    const after = value.slice(textarea.selectionStart);
    const mentionText = `@${user.name} ${user.last_name}`;
    this.local_data.comments =
      before + this.getMentionMarkup(user) + ' ' + after;
    this.showMentionList = false;
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = (
        before +
        this.getMentionMarkup(user) +
        ' '
      ).length;
    });
  }

  getMentionMarkup(user: any): string {
    return `@${user.name}${user.last_name}`;
  }

  addComment() {
    const username = localStorage.getItem('username') || 'Usuario';
    if (!this.local_data.comments) this.local_data.comments = '';
    if (this.commentText.trim()) {
      if (this.local_data.comments.length > 0) {
        this.local_data.comments += '\n';
      }
      this.local_data.comments += `${username}: ${this.commentText.trim()}`;
      this.commentText = '';
    }
  }

  onDueDateChange(event: any) {
  const date = event.value;
  let time = this.dueTime || '00:00';
  this.setDueDateTime(date, time);
}

onDueTimeChange(event: any) {
  this.dueTime = event.target.value;
  const date = this.local_data.due_date;
  this.setDueDateTime(date, this.dueTime);
}

setDueDateTime(date: Date | string, time: string) {
  if (!date || !time) return;

  let localDate: Date;
  if (typeof date === 'string') {
    // Si es formato ISO, extrae solo la fecha y crea Date en local
    const dateOnly = date.split('T')[0];
    const [year, month, day] = dateOnly.split('-').map(Number);
    localDate = new Date(year, month - 1, day);
  } else {
    localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  const [hours, minutes] = time.split(':').map(Number);
  localDate.setHours(hours, minutes, 0, 0);

  this.local_data.due_date = localDate;
}
}
