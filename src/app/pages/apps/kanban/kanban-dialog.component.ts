import { CommonModule } from '@angular/common';
import { Component, Inject, Optional, OnInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MaterialModule } from 'src/app/material.module';
import { environment } from '../../../../environments/environment';
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
import { MentionPopupComponent } from './mention-popup/mention-popup.component';

@Component({
  selector: 'app-kanban-dialog',
  templateUrl: './kanban-dialog.component.html',
  styleUrl: './kanban-dialog.component.scss',
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
    MentionPopupComponent,
  ],
  providers: [DatePipe, provideNativeDateAdapter()],
})
export class AppKanbanDialogComponent implements OnInit {
  action: string;
  local_data: any;
  priorities: any[] = [];
  visibilities = ['public', 'restricted', 'private'];
  users: any[] = [];
  boardMembers: any[] = [];
  attachments: any[] = [];
  showMentionList = false;
  mentionQuery = '';
  mentionIndex = 0;
  filteredUsers: any[] = [];
  mentionStartPos = 0;
  commentText: string = '';
  comments: any[] = [];
  editingComment: any = null;
  selectedComment: any = null;

  mentionPopupOpen = false;
  mentionPopupTop = 0;
  mentionPopupLeft = 0;
  mentionTarget: 'description' | 'comment' | null = null;
  private mentionAnchor:
    | { node: Node; start: number; end: number; mentionElement?: HTMLElement }
    | null = null;
  dueDateTime: Date | null = null;
  companies: any[] = [];
  firstAttachmentImage: any = null;
  pastedAttachments: any[] = [];
  @ViewChild('commentTextarea') commentTextarea?: ElementRef<HTMLTextAreaElement>;
  @ViewChild('descriptionEditor') descriptionEditor!: ElementRef;
  @ViewChild('commentEditor') commentEditor?: ElementRef<HTMLDivElement>;
  formTouched: boolean = false;
  isSaving: boolean = false;
  isOrphan: boolean = false;
  userId: number | null = null;
  selectedEmployeeId: number | null = null;
  imageUrls: { [key: string]: string } = {};

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
    private kanbanService: BoardsService,
    private cdr: ChangeDetectorRef
  ) {
    this.getPriorities();
    this.local_data = { ...data };
    this.action = this.local_data.action;
    this.boardMembers = Array.isArray(data?.boardMembers) ? data.boardMembers : [];
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
    this.loadImageUrls();
    setTimeout(() => {
      if (this.descriptionEditor && this.local_data.recommendations) {
        this.descriptionEditor.nativeElement.innerHTML = this.local_data.recommendations;
      }
    });
  }

  loadImageUrls() {
    this.attachments.forEach(att => {
      if (!(att instanceof File) && att.file_name && !this.imageUrls[att.file_name]) {
        this.kanbanService.getAttachmentUrl(att.file_name).subscribe(response => {
          this.imageUrls[att.file_name] = response.url;
          this.cdr.detectChanges();
        });
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
    this.kanbanService.getAttachmentUrl(filename).subscribe((response: any) => {
      window.open(response.url, '_blank');
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
    } else {
      return this.imageUrls[attachment.file_name] || '';
    }
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
      const pool = this.boardMembers.length ? this.boardMembers : this.users;
      const assignedUser = pool.find(u => u.id === this.local_data.employee_id);
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
    this.local_data.comments = this.comments
      .filter(c => c.isPending && c.comment && String(c.comment).trim())
      .map(c => ({ comment: c.comment, user_id: c.user_id }));

    if (this.dueDateTime) {
      this.local_data.due_date = this.dueDateTime;
    }

    this.local_data.mentioned_user_ids = this.extractMentionIds(this.local_data.recommendations);

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

  onEditorKeydown(event: KeyboardEvent, target: 'description' | 'comment') {
    if (!this.mentionPopupOpen || this.mentionTarget !== target) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.mentionIndex = (this.mentionIndex + 1) % this.filteredUsers.length;
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.mentionIndex =
        (this.mentionIndex - 1 + this.filteredUsers.length) % this.filteredUsers.length;
    } else if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault();
      const picked = this.filteredUsers[this.mentionIndex];
      if (picked) this.insertMention(picked);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.closeMentionPopup();
    }
  }

  onDialogScroll() {
    this.updateMentionPopupPosition();
  }

  private updateMentionPopupPosition() {
    if (!this.mentionPopupOpen || !this.mentionAnchor) return;

    if (this.mentionAnchor.mentionElement) {
      if (!document.contains(this.mentionAnchor.mentionElement)) {
        this.closeMentionPopup();
        return;
      }

      const mentionRect = this.mentionAnchor.mentionElement.getBoundingClientRect();
      this.mentionPopupTop = mentionRect.bottom + 4;
      this.mentionPopupLeft = mentionRect.left;
      return;
    }

    const { node, end } = this.mentionAnchor;
    if (!document.contains(node)) {
      this.closeMentionPopup();
      return;
    }

    const range = document.createRange();
    try {
      range.setStart(node, end);
      range.setEnd(node, end);
    } catch {
      this.closeMentionPopup();
      return;
    }

    const rect = range.getBoundingClientRect();
    this.mentionPopupTop = rect.bottom + 4;
    this.mentionPopupLeft = rect.left;
  }

  detectMention(target: 'description' | 'comment') {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) {
      this.closeMentionPopup();
      return;
    }

    const range = sel.getRangeAt(0);
    const node = range.startContainer;

    const nodeElement = node.nodeType === Node.ELEMENT_NODE ? (node as HTMLElement) : null;
    const parentElement = node.nodeType === Node.TEXT_NODE ? node.parentElement : null;
    const rawMentionElement =
      nodeElement?.closest('span.mention') || parentElement?.closest('span.mention');
    const mentionElement = rawMentionElement instanceof HTMLElement ? rawMentionElement : null;

    if (mentionElement) {
      const mentionText = mentionElement.textContent || '';
      const mentionQuery = mentionText.startsWith('@') ? mentionText.slice(1).trim() : '';

      this.mentionQuery = mentionQuery;
      this.mentionTarget = target;
      this.mentionIndex = 0;
      const source = this.boardMembers.length ? this.boardMembers : this.users;
      this.filteredUsers = source;
      this.mentionAnchor = {
        node: mentionElement,
        start: 0,
        end: mentionText.length,
        mentionElement,
      };
      this.mentionPopupOpen = this.filteredUsers.length > 0;

      if (!this.mentionPopupOpen) {
        this.closeMentionPopup();
        return;
      }

      this.updateMentionPopupPosition();
      return;
    }

    if (node.nodeType !== Node.TEXT_NODE) {
      this.closeMentionPopup();
      return;
    }

    const text = node.textContent || '';
    const offset = range.startOffset;

    let i = offset - 1;
    while (i >= 0 && /[\p{L}\p{N}_]/u.test(text[i])) i--;
    if (i < 0 || text[i] !== '@') {
      this.closeMentionPopup();
      return;
    }
    if (i > 0 && /\S/.test(text[i - 1])) {
      this.closeMentionPopup();
      return;
    }

    this.mentionQuery = text.substring(i + 1, offset);
    this.mentionTarget = target;
    this.mentionIndex = 0;
    const source = this.boardMembers.length ? this.boardMembers : this.users;
    this.filteredUsers = source.filter(u =>
      `${u.name} ${u.last_name}`.toLowerCase().includes(this.mentionQuery.toLowerCase())
    );
    if (this.filteredUsers.length === 0) {
      this.closeMentionPopup();
      return;
    }
    this.mentionAnchor = { node, start: i, end: offset };

    this.mentionPopupOpen = true;
    this.updateMentionPopupPosition();
  }

  insertMention(user: any) {
    if (!this.mentionAnchor) return;
    const range = document.createRange();

    if (this.mentionAnchor.mentionElement) {
      const mentionElement = this.mentionAnchor.mentionElement;
      if (!document.contains(mentionElement)) {
        this.closeMentionPopup();
        return;
      }

      range.setStartBefore(mentionElement);
      range.setEndAfter(mentionElement);
    } else {
      const { node, start, end } = this.mentionAnchor;
      range.setStart(node, start);
      range.setEnd(node, end);
    }

    range.deleteContents();

    const span = document.createElement('span');
    span.className = 'mention';
    span.setAttribute('data-user-id', String(user.id));
    span.setAttribute('contenteditable', 'false');
    span.style.color = '#92b46c';
    span.style.backgroundColor = 'rgba(146, 180, 108, 0.14)';
    span.textContent = `@${user.name} ${user.last_name}`;
    range.insertNode(span);

    const space = document.createTextNode(' ');
    span.after(space);
    const newRange = document.createRange();
    newRange.setStart(space, 1);
    newRange.collapse(true);
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(newRange);
    }

    if (this.mentionTarget === 'description') {
      this.updateRecommendationsValue();
    }
    this.closeMentionPopup();
  }

  closeMentionPopup() {
    this.mentionPopupOpen = false;
    this.mentionTarget = null;
    this.mentionAnchor = null;
    this.filteredUsers = [];
  }

  private extractMentionIds(html: string | null | undefined): number[] {
    if (!html) return [];
    const div = document.createElement('div');
    div.innerHTML = html;
    const ids = Array.from(div.querySelectorAll('span.mention[data-user-id]'))
      .map(el => parseInt(el.getAttribute('data-user-id') || '0', 10))
      .filter(id => Number.isFinite(id) && id > 0);
    return Array.from(new Set(ids));
  }

  submitComment() {
    const html = (this.commentEditor?.nativeElement.innerHTML || '').trim();
    const text = (this.commentEditor?.nativeElement.innerText || '').trim();
    if (!text) return;

    const mentioned_user_ids = this.extractMentionIds(html);

    if (this.selectedComment) {
      this.editComment(this.selectedComment, html, mentioned_user_ids);
      this.selectedComment = null;
      this.clearCommentEditor();
      this.showSnackbar('Comment updated!');
      return;
    }

    if (!this.local_data.id) {
      const currentUser = this.users.find(u => u.id == this.userId) || {
        name: localStorage.getItem('name') || 'Unknown',
        last_name: localStorage.getItem('last_name') || 'User',
      };
      const localComment = {
        comment: this.commentText,
        user_id: this.userId,
        createdAt: new Date(),
        user: { name: currentUser.name, last_name: currentUser.last_name },
        isPending: true,
      };
      this.comments.push(localComment);
      this.local_data.comments = this.comments.filter(c => c.isPending);
      this.commentText = '';
      this.showSnackbar('Comment added!');
      return;
    }

    const payload = {
      rating_id: this.local_data.id,
      comment: html,
        mentioned_user_ids,
    };
    this.ratingsService.addComment(payload).subscribe(newComment => {
      this.comments.push(newComment);
      this.clearCommentEditor();
      this.showSnackbar('Comment added!');
    });
  }

  private clearCommentEditor() {
    this.commentText = '';
    if (this.commentEditor?.nativeElement) {
      this.commentEditor.nativeElement.innerHTML = '';
    }
  }

  hasCommentText(): boolean {
    return !!(this.commentEditor?.nativeElement.innerText || '').trim();
  }

  startEditingComment(comment: any) {
    this.selectedComment = comment;
    setTimeout(() => {
      if (this.commentEditor?.nativeElement) {
        this.commentEditor.nativeElement.innerHTML = comment.comment || '';
        this.commentEditor.nativeElement.focus();
      }
    });
  }

  editComment(comment: any, newHtml: string, mentioned_user_ids: number[] = []) {
    if (!newHtml.trim()) return;
    if (comment.isPending) {
      comment.comment = newHtml;
      return;
    }
    this.ratingsService.updateComment(comment.id, newHtml, mentioned_user_ids).subscribe(updated => {
      comment.comment = updated.comment;
      comment.isEditing = false;
    });
  }

  deleteComment(comment: any) {
    if (!comment) return;

    if (comment.isPending) {
      this.comments = this.comments.filter(c => c !== comment);
      this.local_data.comments = this.comments.filter(c => c.isPending);
      this.showSnackbar('Comment deleted!');
      return;
    }

    this.ratingsService.deleteComment(comment.id).subscribe(() => {
      this.comments = this.comments.filter(c => c.id !== comment.id);
      this.showSnackbar('Comment deleted!');
    });
  }

  async onPaste(event: ClipboardEvent) {
    const clipboardData = event.clipboardData;
    if (!clipboardData) return;
    const items = clipboardData.items;
    if (items && items.length > 0) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            event.preventDefault();
            try {
              const upload$ = this.kanbanService.uploadTaskAttachments([file]);
              const uploadedFiles = await lastValueFrom(upload$);

              if (uploadedFiles && uploadedFiles.length > 0) {
                const uploadedFile = uploadedFiles[0];
                if (!this.attachments.some(a => (a instanceof File ? false : a.file_name) === uploadedFile.file_name)) {
                  this.attachments.push(uploadedFile);
                }
                this.updateFirstAttachmentImage();
                await this.insertImageInEditor(uploadedFile);
              } else {
                await this.insertImageInEditor(file);
              }
            } catch (error) {
              console.error('Error processing pasted image:', error);
              this.showSnackbar('Error processing pasted image');
            }
          }
          break;
        }
      }
      return;
    }

    const html = clipboardData.getData('text/html');
    if (html) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const images = doc.querySelectorAll('img');

      if (images.length > 0) {
        event.preventDefault();
        const editor = this.descriptionEditor?.nativeElement;
        if (editor) {
          images.forEach(imgEl => {
            const img = document.createElement('img');
            img.src = imgEl.src;
            img.style.maxWidth = '100%';
            img.alt = imgEl.alt || 'Pasted image';
            editor.appendChild(img);
          });
          this.updateRecommendationsValue();
        }
      }
    }
  }

  async insertImageInEditor(file: any) {
    let imageUrl: string;
    
    if (file instanceof File) {
      imageUrl = URL.createObjectURL(file);
      this.pastedAttachments.push({ file, url: imageUrl });
      if (!this.attachments.includes(file)) {
        this.attachments.push(file);
        this.updateFirstAttachmentImage();
      }
    } else {
      if (!this.imageUrls[file.file_name]) {
        const response = await lastValueFrom(this.kanbanService.getAttachmentUrl(file.file_name));
        this.imageUrls[file.file_name] = response.url;
      }
      imageUrl = this.imageUrls[file.file_name];
    }
    
    const editor = this.descriptionEditor.nativeElement;
    const img = document.createElement('img');
    img.src = imageUrl;
    img.style.maxWidth = '100%';
    img.alt = file.name || 'Pasted image';

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(img);
      range.collapse(false);
      
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      editor.appendChild(img);
    }

    this.updateRecommendationsValue();
  }

  async syncAttachmentsWithEditor() {
    const editor = this.descriptionEditor?.nativeElement;
    if (!editor) return;

    const imgs = Array.from(editor.querySelectorAll('img')).map((img: any) => img.src);
    const imgSet = new Set(imgs);

    for (let i = this.attachments.length - 1; i >= 0; i--) {
      const att = this.attachments[i];
      if (att instanceof File) continue; 

      if (att && att.file_name) {
        if (!this.imageUrls[att.file_name]) {
          try {
            const resp: any = await lastValueFrom(this.kanbanService.getAttachmentUrl(att.file_name));
            this.imageUrls[att.file_name] = resp.url;
          } catch (e) {}
        }

        const url = this.imageUrls[att.file_name] || '';
        if (url && !imgSet.has(url)) {
          this.attachments.splice(i, 1);
          if (this.firstAttachmentImage === att) this.updateFirstAttachmentImage();
        }
      }
    }

    for (let i = this.attachments.length - 1; i >= 0; i--) {
      const att = this.attachments[i];
      if (!(att instanceof File)) continue;

      const mapped = this.pastedAttachments.find(p => p.file === att);
      const url = mapped ? mapped.url : '';
      if (url && !imgSet.has(url)) {
        this.attachments.splice(i, 1);
        const mi = this.pastedAttachments.findIndex(p => p.file === att);
        if (mi !== -1) this.pastedAttachments.splice(mi, 1);
        if (this.firstAttachmentImage === att) this.updateFirstAttachmentImage();
      }
    }
  }

  updateRecommendationsValue() {
    this.local_data.recommendations = this.descriptionEditor.nativeElement.innerHTML;
  }

  onEditorInput() {
    this.updateRecommendationsValue();
    void this.syncAttachmentsWithEditor();
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
            const uploadedFile = uploadedFiles[0];
            if (!this.attachments.some(a => (a instanceof File ? false : a.file_name) === uploadedFile.file_name)) {
              this.attachments.push(uploadedFile);
            }
            this.updateFirstAttachmentImage();
            this.insertImageInEditor(uploadedFile);
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