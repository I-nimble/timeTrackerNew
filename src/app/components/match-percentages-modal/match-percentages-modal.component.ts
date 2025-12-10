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

export interface MatchPercentagesModalData {
  candidate: {
    id: number;
    name: string;
    email: string;
    position_id: number;
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
    TablerIconsModule
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

  constructor(
    public dialogRef: MatDialogRef<MatchPercentagesModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MatchPercentagesModalData,
    private matchScoresService: ApplicationMatchScoresService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadPositionCategories();
    this.loadExistingScores();
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
    this.saving = true;

    const matchScoresData = Object.entries(this.matchScores).map(([categoryId, percentage]) => ({
      position_category_id: parseInt(categoryId),
      match_percentage: percentage
    }));

    const requestData = {
      application_id: this.data.candidate.id,
      match_scores: matchScoresData
    };

    this.matchScoresService.createMatchScores(requestData).subscribe({
      next: (response) => {
        this.saving = false;
        
        if (response.errors && response.errors.length > 0) {
          this.snackBar.open('Error saving some match percentages', 'Close', { duration: 5000 });
          return;
        }
        
        this.snackBar.open('Match percentages saved successfully!', 'Close', { duration: 3000 });
        this.dialogRef.close('success');
      },
      error: (error) => {
        this.saving = false;
        console.error('Error saving match scores:', error);
        this.snackBar.open('Error saving match percentages', 'Close', { duration: 3000 });
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}