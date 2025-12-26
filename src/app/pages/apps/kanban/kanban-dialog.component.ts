import { CommonModule } from '@angular/common';
import { Component, Inject, Optional, OnInit, ViewChild, ElementRef } from '@angular/core';
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
import { DomSanitizer } from '@angular/platform-browser';
import { lastValueFrom } from 'rxjs';
import { BoardsService } from 'src/app/services/apps/kanban/boards.service';
import { SafeHtmlPipe } from './safe-html.pipe';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

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
    SafeHtmlPipe,
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
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
  comments: any[] = [];
  editingComment: any = null;
  selectedComment: any = null;
  dueDateTime: Date | null = null;
  companies: any[] = [];
  firstAttachmentImage: any = null;
  pastedAttachments: any[] = [];
  @ViewChild('commentTextarea') commentTextarea?: ElementRef<HTMLTextAreaElement>;
  @ViewChild('descriptionEditor') descriptionEditor!: ElementRef;
  formTouched: boolean = false;
  isSaving: boolean = false;
  isOrphan: boolean = false;
  userId: number | null = null;
  selectedEmployeeId: number | null = null;

  constructor(
    public dialogRef: MatDialogRef<AppKanbanDialogComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any,
    private datePipe: DatePipe,
    public ratingsService: RatingsService,
    private companiesService: CompaniesService,
    private employeesService: EmployeesService,
    private usersService: UsersService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private sanitizer: DomSanitizer,
    private kanbanService: BoardsService
  ) {
    this.getPriorities();
    this.local_data = { ...data };
    this.action = this.local_data.action;
    this.isOrphan = localStorage.getItem('isOrphan') === 'true' || localStorage.getItem('role') === '4';
    if (this.isOrphan && (!this.data.type || this.data.type === 'task')) {
      const employeeId = this.local_data.employee_id;
      this.local_data.employee_id = employeeId;
    }
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
    this.userId = Number(localStorage.getItem('id'));
    if (this.local_data.due_date) {
      const dueDate = new Date(this.local_data.due_date);
      if (!isNaN(dueDate.getTime())) {
        this.dueDateTime = dueDate;
      }
    } else {
      const defaultDate = new Date();
      defaultDate.setHours(defaultDate.getHours() + 24);
      this.dueDateTime = defaultDate;
      this.local_data.due_date = defaultDate;
    }
    this.updateFirstAttachmentImage();
    this.loadComments();
    setTimeout(() => {
      if (this.descriptionEditor && this.local_data.recommendations) {
        this.descriptionEditor.nativeElement.innerHTML = this.local_data.recommendations;
      }
    });
  }

  isFormValid(): boolean {
    if (this.local_data.type === 'board') {
      return !!this.local_data.goal?.trim();
    }
    if (this.isOrphan) {
      return !!this.local_data.goal?.trim() && !!this.local_data.priority && !!this.local_data.due_date;
    }
    return !!this.local_data.goal?.trim() && !!this.local_data.employee_id && !!this.local_data.priority && !!this.local_data.due_date;
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

  updateFirstAttachmentImage() {
    this.firstAttachmentImage = this.attachments.find(att =>
      att.file_type?.startsWith('image/') ||
      (att instanceof File && att.type.startsWith('image/'))
    );
  }


  getImageUrl(attachment: any): string {
    if (attachment instanceof File) {
      return URL.createObjectURL(attachment);
    } else if (attachment.s3_filename) {
      return this.attachmentsUrl + attachment.s3_filename;
    }
    return '';
  }

  isImage(file: any): boolean {
    if (file instanceof File) {
      return file.type.startsWith('image/');
    } else if (file.file_type) {
      return file.file_type.startsWith('image/');
    }
    return false;
  }

  onFileSelected(event: any): void {
    const files: FileList = event.target.files;
    for (let i = 0; i < files.length; i++) {
      this.attachments.push(files.item(i)!);
    }
    event.target.value = '';
    this.updateFirstAttachmentImage();
  }

  removeAttachment(index: number): void {
    const removed = this.attachments.splice(index, 1)[0];
    if (removed === this.firstAttachmentImage) {
      this.updateFirstAttachmentImage();
    }
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
        if (this.local_data.company_id) {
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
    if (companyId) {
      this.companiesService.getEmployees(companyId).subscribe((employees: any) => {
        this.users = employees.map((e: any) => e.user);

        this.companiesService.getEmployer(companyId).subscribe((employer: any) => {
          this.users.push(employer.user);
          this.users = this.users.sort((a: any, b: any) => a.name.localeCompare(b.name));
          this.setSelectedEmployee();
        });
      });
    } else {
      this.employeesService.getOrphanEmployees().subscribe((orphans: any[]) => {
        this.users = orphans.map((o: any) => o.user);
        this.users = this.users.sort((a: any, b: any) => a.name.localeCompare(b.name));
        this.setSelectedEmployee();
      });
    }
  }

  setSelectedEmployee() {
    if (this.local_data.employee_id) {
      const assignedUser = this.users.find(u => u.id === this.local_data.employee_id);
      if (assignedUser) {
        this.selectedEmployeeId = assignedUser.id;
      }
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

  loadComments() {
    this.ratingsService.getComments(this.local_data.id).subscribe(res => {
      this.comments = res.map(c => ({ ...c, isEditing: false, editText: c.comment }));
    });
  }

  doAction(): void {
    this.formTouched = true;

    if (!this.isFormValid()) {
      this.showSnackbar('Please fill all required fields');
      return;
    }

    if (this.isSaving) return;
    this.isSaving = true;

    this.local_data.task_attachments = this.attachments;

    if (this.dueDateTime) {
      this.local_data.due_date = this.dueDateTime;
    }

    if (
      this.action === 'Edit' &&
      this.local_data.previousVisibility === 'private' &&
      this.local_data.selectedVisibility === 'public'
    ) {
      const dialogRef = this.dialog.open(ModalComponent, {
        data: {
          action: this.action,
          type: 'board visibility',
          message: 'This will make the board public. Everyone will be able to see it.',
        },
      });

      dialogRef.afterClosed().subscribe((result: any) => {
        this.isSaving = false;
        if (!result) return;
        if (result) {
          this.dialogRef.close({ event: this.action, data: this.local_data });
        }
      });
    } else {
      this.dialogRef.close({ event: this.action, data: this.local_data });
      this.isSaving = false;
    }
  }

  onFieldChange(): void {
    this.formTouched = true;
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
      this.filteredUsers = this.users.filter(u =>
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
      if (this.filteredUsers[this.mentionIndex]) {
        this.selectMention(this.filteredUsers[this.mentionIndex]);
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.showMentionList = false;
    }
  }

  selectMention(user: any) {
    const textarea = this.commentTextarea?.nativeElement;
    if (!textarea) return;

    const value = this.commentText || '';
    const before = value.substring(0, this.mentionStartPos);
    const after = value.substring(textarea.selectionStart);

    const mentionText = `@${user.name} ${user.last_name}`;
    this.commentText = before + mentionText + ' ' + after;

    this.showMentionList = false;

    setTimeout(() => {
      textarea.focus();
      const newPosition = before.length + mentionText.length + 1;
      textarea.selectionStart = newPosition;
      textarea.selectionEnd = newPosition;
    });
  }

  getMentionMarkup(user: any): string {
    return `@${user.name}${user.last_name}`;
  }

  submitComment() {
    if (!this.commentText.trim()) return;

    if (this.selectedComment) {
      this.editComment(this.selectedComment, this.commentText);
      this.selectedComment = null;
      this.commentText = '';
      this.showSnackbar('Comment updated!');
    } else {
      const payload = {
        rating_id: this.local_data.id,
        comment: this.commentText
      };
      this.ratingsService.addComment(payload).subscribe(newComment => {
        this.comments.push(newComment);
        this.commentText = '';
        this.showSnackbar('Comment added!');
      });
    }
  }

  startEditingComment(comment: any) {
    this.commentText = comment.comment;
    this.selectedComment = comment;
    setTimeout(() => {
      this.commentTextarea?.nativeElement.focus();
    });
  }

  editComment(comment: any, newText: string) {
    if (!newText.trim()) return;
    this.ratingsService.updateComment(comment.id, newText).subscribe(updated => {
      comment.comment = updated.comment;
      comment.isEditing = false;
    });
  }

  deleteComment(commentId: number) {
    this.ratingsService.deleteComment(commentId).subscribe(() => {
      this.comments = this.comments.filter(c => c.id !== commentId);
      this.showSnackbar('Comment deleted!');
    });
  }

  async onPaste(event: ClipboardEvent) {
    const clipboardData = event.clipboardData;
    if (!clipboardData) return;

    if (clipboardData.files.length > 0 && clipboardData.files[0].type.startsWith('image/')) {
      event.preventDefault();

      const file = clipboardData.files[0];
      try {
        const upload$ = this.kanbanService.uploadTaskAttachments([file]);
        const uploadedFiles = await lastValueFrom(upload$);

        if (uploadedFiles.length > 0) {
          const uploadedFile = uploadedFiles[0];
          this.pastedAttachments.push(uploadedFile);

          this.insertImageInEditor(uploadedFile);
        }
      } catch (error) {
        console.error('Error uploading pasted image:', error);
        this.showSnackbar('Error uploading image');
      }
    }
  }

  insertImageInEditor(file: any) {
    const editor = this.descriptionEditor.nativeElement;
    const img = document.createElement('img');
    img.src = this.attachmentsUrl + file.s3_filename;
    img.style.maxWidth = '100%';

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.insertNode(img);
      range.collapse(false);

      this.updateRecommendationsValue();
    }
  }

  updateRecommendationsValue() {
    this.local_data.recommendations = this.descriptionEditor.nativeElement.innerHTML;
  }

  onEditorInput() {
    this.updateRecommendationsValue();
  }


  insertImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (event: any) => {
      const file = event.target.files[0];
      if (file) {
        try {
          const upload$ = this.kanbanService.uploadTaskAttachments([file]);
          const uploadedFiles = await lastValueFrom(upload$);

          if (uploadedFiles.length > 0) {
            this.insertImageInEditor(uploadedFiles[0]);
          }
        } catch (error) {
          console.error('Error uploading image:', error);
          this.showSnackbar('Error uploading image');
        }
      }
    };
    input.click();
  }

  safeHtmlPipe = this.sanitizer.bypassSecurityTrustHtml;
}