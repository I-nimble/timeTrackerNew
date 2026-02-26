import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApplicationMatchScoresService, PositionCategory, MatchScore } from 'src/app/services/application-match-scores.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MatSelectModule } from '@angular/material/select';
import { DiscProfilesService, DiscProfile } from 'src/app/services/disc-profiles.service';
import { forkJoin } from 'rxjs';

export interface MatchPercentagesModalData {
  candidate: {
    id: number;
    name: string;
    email: string;
    position_id: number;
    disc_profiles?: DiscProfile[];
  };
}

@Component({
  selector: 'app-match-percentages-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    TablerIconsModule,
    MatSelectModule
  ],
  templateUrl: './match-percentages-modal.component.html',
  styleUrls: ['./match-percentages-modal.component.scss']
})
export class MatchPercentagesModalComponent implements OnInit {
  positionCategories: PositionCategory[] = [];
  matchScores: { [key: number]: number } = {};
  loading = false;
  saving = false;
  existingScores: MatchScore[] = [];

  discProfiles: DiscProfile[] = [];
  selectedDiscProfileIds: number[] = [];

  constructor(
    public dialogRef: MatDialogRef<MatchPercentagesModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MatchPercentagesModalData,
    private matchScoresService: ApplicationMatchScoresService,
    private discProfilesService: DiscProfilesService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadPositionCategories();
    this.loadExistingScores();
    this.loadDiscProfiles();
  }

  loadDiscProfiles(): void {
    this.discProfilesService.getAll().subscribe({
      next: (profiles) => {
        this.discProfiles = profiles;
        if (this.data.candidate.disc_profiles) {
          this.selectedDiscProfileIds = this.data.candidate.disc_profiles.map(p => p.id);
        }
      },
      error: (error) => {
        console.error('Error loading DISC profiles:', error);
      }
    });
  }

  getDiscProfileColor(profileName: string): string {
    return this.discProfilesService.getDiscProfileColor(profileName);
  }

  loadPositionCategories(): void {
    this.loading = true;
    this.matchScoresService.getPositionCategories().subscribe({
      next: (categories) => {
        this.positionCategories = categories.sort((a, b) => {
          const order = [
            'Lien Negotiator - Office Manager/Administrative Coordinator',
            'Intake Specialist',
            'Medical Records Clerk - Case Manager - Receptionist',
            'Paralegal Personal Injury - Litigation Assistant'
          ];
          
          const indexA = order.indexOf(a.category_name);
          const indexB = order.indexOf(b.category_name);
          
          if (indexA !== -1 && indexB !== -1) {
            return indexA - indexB;
          }
          
          if (indexA !== -1) return -1;
          if (indexB !== -1) return 1;
          
          return 0;
        });
        
        this.initializeMatchScores();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading position categories:', error);
        this.snackBar.open('Error loading position categories', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  loadExistingScores(): void {
    this.matchScoresService.getByApplicationId(this.data.candidate.id).subscribe({
      next: (scores) => {
        this.existingScores = scores;
        this.initializeMatchScores();
      },
      error: (error) => {
        console.error('Error loading existing scores:', error);
      }
    });
  }

  initializeMatchScores(): void {
    this.positionCategories.forEach(category => {
      const existingScore = this.existingScores.find(score => 
        score.position_category_id === category.id
      );
      this.matchScores[category.id] = existingScore ? existingScore.match_percentage : 0;
    });
  }

  validatePercentage(categoryId: number): boolean {
    const value = this.matchScores[categoryId];
    return value >= 0 && value <= 100;
  }

  getCategoryName(categoryId: number): string {
    const category = this.positionCategories.find(cat => cat.id === categoryId);
    return category ? category.category_name : 'Unknown Category';
  }

  hasValidScores(): boolean {
    return Object.values(this.matchScores).some(score => score > 0 && score <= 100);
  }

  getInvalidCategories(): string[] {
    return this.positionCategories
      .filter(category => !this.validatePercentage(category.id))
      .map(category => category.category_name);
  }

  onSubmit(): void {
    const matchScoresData = Object.entries(this.matchScores).map(([categoryId, percentage]) => ({
      position_category_id: parseInt(categoryId),
      match_percentage: percentage
    }));
    const selectedProfiles = this.discProfiles.filter(p => 
      this.selectedDiscProfileIds.includes(p.id)
    );
    this.dialogRef.close({
      success: true,
      matchScores: matchScoresData,
      discProfiles: selectedProfiles
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}