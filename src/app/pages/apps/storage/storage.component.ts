import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MaterialModule } from 'src/app/material.module';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StorageService } from 'src/app/services/storage.service';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  standalone: true,
    selector: 'app-dynamic-table',
    imports: [
      MatTableModule, 
      MatCardModule, 
      CommonModule, 
      MatButtonModule,
      TablerIconsModule,
      MaterialModule
    ],
    templateUrl: './storage.component.html',
    styleUrl: './storage.component.scss',
})
export class AppStorageComponent implements OnInit {
  displayedColumns: string[] = ['name', 'size', 'preview', 'download'];
  columnsToDisplay: string[] = this.displayedColumns.slice();
  data: any[] = [];
  selectedFile: File | null = null;
  filePreview: string | ArrayBuffer | null = null;
  sendingFile: boolean = false;

  constructor(
    private storageService: StorageService, 
    public snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // TODO: Get the list of files from the server
    console.log('getting files')
    this.storageService.get().subscribe({
      next: (files) => {
        console.log('FILES: ',files)
        // this.data = files;
      },
      error: (err: any) => {
        this.openSnackBar("Error fetching files", "Close");
      }
    });
  }

  onFileSelected(event: any) {
    const files = event.target.files;
    if (files.length > 0) {
      const file = files[0];
      // Validate file type and size
      if (file.size > 10 * 1024 * 1024) { // 10 MB limit
        this.openSnackBar('File size exceeds the limit', 'Close');
        return;
      }
      const fileName = file.name.toLowerCase();
      if (!fileName.endsWith('.pdf') && !fileName.endsWith('.docx') && !fileName.endsWith('.txt') && !fileName.endsWith('.jpg') && !fileName.endsWith('.jpeg') && !fileName.endsWith('.png')) {
        this.openSnackBar('Invalid file type', 'Close');
        return;
      }

      this.selectedFile = file;
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        this.filePreview = reader.result;
      };
    }
  }

  uploadFile() {
    if(!this.selectedFile) {
      this.openSnackBar('Please select a file to upload', 'Close');
      return;
    }
    this.sendingFile = true;
    this.storageService.uploadFile(this.selectedFile).subscribe({
      next: (res: any) => {
        console.log('FILE UPLOADED: ', res)
        this.openSnackBar('File uploaded successfully', 'Close');
        this.data.push({ download: res.url, name: this.selectedFile?.name, size: this.selectedFile?.size, preview: res.url });
        this.cdr.detectChanges();
        this.sendingFile = false;
      },
      error: (err: any) => {
        this.openSnackBar(err.error.message, 'Close');
      }
    });
  }

  openSnackBar(message: string, action: string): void {
    this.snackBar.open(message, action, {
      duration: 2000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }
}
