import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { TablerIconsModule } from 'angular-tabler-icons';
import { DiscProfilesService, DiscProfile } from 'src/app/services/disc-profiles.service';
import { forkJoin } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';

export interface PositionDiscModalData {
  positions: any[];
}

interface PositionWithDisc {
  id: number;
  title: string;
  selectedDiscProfileIds: number[];
}

@Component({
  selector: 'app-position-disc-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatCardModule,
    TablerIconsModule,
    MaterialModule
  ],
  templateUrl: './position-disc-modal.component.html',
  styleUrls: ['./position-disc-modal.component.scss']
})
export class PositionDiscModalComponent implements OnInit {
  discProfiles: DiscProfile[] = [];
  positionsWithDisc: PositionWithDisc[] = [];
  loading = false;
  saving = false;

  constructor(
    public dialogRef: MatDialogRef<PositionDiscModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PositionDiscModalData,
    private discProfilesService: DiscProfilesService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.loadDiscProfiles();
  }

  loadDiscProfiles(): void {
    this.discProfilesService.getAll().subscribe({
      next: (profiles) => {
        this.discProfiles = profiles;
        this.initializePositions();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading DISC profiles:', error);
        this.snackBar.open('Error loading DISC profiles', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  initializePositions(): void {
    this.positionsWithDisc = this.data.positions.map(position => ({
      id: position.id,
      title: position.title,
      selectedDiscProfileIds: position.disc_profiles 
        ? position.disc_profiles.map((p: DiscProfile) => p.id)
        : []
    }));
  }

  getDiscProfileColor(profileName: string): string {
    return this.discProfilesService.getDiscProfileColor(profileName);
  }

  onSearch(event: KeyboardEvent): void {
    const searchValue = (event.target as HTMLInputElement).value.toLowerCase();
    this.positionsWithDisc = this.data.positions.map(position => ({
      id: position.id,
      title: position.title,
      selectedDiscProfileIds: position.disc_profiles 
        ? position.disc_profiles.map((p: DiscProfile) => p.id)
        : []
    }));
    this.positionsWithDisc = this.positionsWithDisc.filter(position =>
      position.title.toLowerCase().includes(searchValue)
    );
  }

  onSubmit(): void {
    this.saving = true;

    const assignRequests = this.positionsWithDisc.map(position =>
      this.discProfilesService.assignToPosition(position.id, position.selectedDiscProfileIds)
    );

    forkJoin(assignRequests).subscribe({
      next: () => {
        this.saving = false;
        this.snackBar.open('Position DISC profiles saved successfully!', 'Close', { duration: 3000 });
        this.dialogRef.close('success');
      },
      error: (error) => {
        this.saving = false;
        console.error('Error saving DISC profiles:', error);
        this.snackBar.open('Error saving DISC profiles', 'Close', { duration: 3000 });
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
