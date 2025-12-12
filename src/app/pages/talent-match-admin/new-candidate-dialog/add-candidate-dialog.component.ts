import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { ApplicationsService } from 'src/app/services/applications.service';
import { PositionsService } from 'src/app/services/positions.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatchPercentagesModalComponent } from 'src/app/components/match-percentages-modal/match-percentages-modal.component';

@Component({
  selector: 'app-add-candidate-dialog',
  templateUrl: './add-candidate-dialog.component.html',
  //   styleUrls: ['./add-candidate-dialog.component.scss']

  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule
  ],
})
export class AddCandidateDialogComponent implements OnInit {
  candidateForm: FormGroup;
  positions: any[] = [];
  englishLevels = ['basic', 'intermediate', 'advanced'];
  selectedCVFile: File | null = null;
  selectedProfilePicFile: File | null = null;
  isCreationAllowed: boolean = true;
  restrictionMessage: string = '';
  locations: any[] = [];
  action: string = this.data.action || 'add';
  mode: 'full' | 'minimal' = 'full';

  constructor(
    private fb: FormBuilder,
    private applicationsService: ApplicationsService,
    private positionsService: PositionsService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<AddCandidateDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialog: MatDialog
  ) {
    this.mode = data?.mode || 'full';
    this.candidateForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      skills: ['', Validators.required],
      english_level: ['', Validators.required],
      position_id: ['', Validators.required],
      current_position: [''],
      company_id: [''],
      availability: [false, Validators.required],
      location_id: ['', Validators.required],
      description: [''],
      talent_match_profile_summary: [''],
      hobbies: [''],
      work_experience: ['', Validators.maxLength(1000)],
      education_history: [''],
      ranking: [''],
      profile_observation: [''],
      interview_link: [''],
      inimble_academy: ['']
    });
  }

  ngOnInit(): void {
    this.positionsService.get().subscribe((positions) => {
      this.positions = positions;
      this.applicationsService.getLocations().subscribe((locations) => {
        this.locations = locations;
      
        if (this.data.candidate) {
          this.candidateForm.patchValue({
            name: this.data.candidate.name,
            email: this.data.candidate.email,
            skills: this.data.candidate.skills,
            english_level: this.data.candidate.english_level,
            position_id: this.data.candidate.position_id,
            company_id:
              this.data.candidate.company_id !== undefined
                ? this.data.candidate.company_id
                : '',
            availability: this.data.candidate.availability,
            location_id: this.locations.find((l: any) => l.city == this.data.candidate.location).id,
            current_position: this.data.candidate.current_position,
            description: this.data.candidate.description,
            talent_match_profile_summary: this.data.candidate.talent_match_profile_summary,
            hobbies: this.data.candidate.hobbies,
            work_experience: this.data.candidate.work_experience,
            education_history: this.data.candidate.education_history,
            ranking: this.data.candidate.ranking,
            profile_observation: this.data.candidate.profile_observation,
            interview_link: this.data.candidate.interview_link,
            inimble_academy: this.data.candidate.inimble_academy
          });
        }
      });
    });
  }

  onCVSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      if (file.size > 1000000) {
        this.snackBar.open('CV file size should be 1 MB or less', 'Close', {
          duration: 3000,
        });
        return;
      }
      if (file.type !== 'application/pdf') {
        this.snackBar.open('Only PDF files are allowed for CV', 'Close', {
          duration: 3000,
        });
        return;
      }
      this.selectedCVFile = file;
    }
  }

  onProfilePicSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      if (file.size > 1000000) {
        this.snackBar.open(
          'Profile picture size should be 1 MB or less',
          'Close',
          { duration: 3000 }
        );
        return;
      }
      if (file.type !== 'image/jpeg') {
        this.snackBar.open(
          'Only JPG files are allowed for profile picture',
          'Close',
          { duration: 3000 }
        );
        return;
      }
      this.selectedProfilePicFile = file;
    }
  }

  onSubmit(): void {
    if (this.candidateForm.invalid) {
      this.snackBar.open('Please fill all required fields', 'Close', {
        duration: 3000,
      });
      return;
    }

    if (!this.selectedCVFile && !this.data.candidate) {
      this.snackBar.open('CV is required', 'Close', { duration: 3000 });
      return;
    }

    const formValue = this.candidateForm.value;
    const companyId =
      formValue.company_id === '' ||
      formValue.company_id === null ||
      formValue.company_id === undefined
        ? -1
        : formValue.company_id;

    const data: any = {
      name: formValue.name,
      email: formValue.email,
      skills: formValue.skills,
      english_level: formValue.english_level,
      position_id: formValue.position_id,
      current_position: formValue.current_position,
      company_id: companyId,
      availability: formValue.availability,
      location_id: formValue.location_id,
      description: formValue.description,
      talent_match_profile_summary: formValue.talent_match_profile_summary,
      hobbies: formValue.hobbies,
      work_experience: formValue.work_experience,
      education_history: formValue.education_history,
      ranking: formValue.ranking,
      profile_observation: formValue.profile_observation,
      interview_link: formValue.interview_link,
      inimble_academy: formValue.inimble_academy,
      ...(this.selectedCVFile && { cv: this.selectedCVFile }),
      ...(this.selectedProfilePicFile && {
        profile_pic: this.selectedProfilePicFile,
      }),
      status_id: 3
    };

    const id =
      this.data.candidate && this.data.candidate.id
        ? this.data.candidate.id
        : null;

    this.applicationsService.submit(data, id).subscribe({
      next: (response) => {
        this.snackBar.open(`Candidate ${this.action == 'edit' ? 'edited' : 'added'} successfully`, 'Close', {
          duration: 3000,
        });
        this.dialogRef.close({
          success: true,
          profile_pic: this.selectedProfilePicFile ? this.selectedProfilePicFile.name : null
        });
      },
      error: (error) => {
        this.snackBar.open(
          `Error ${this.action == 'edit' ? 'editing' : 'adding'} candidate: ${error.message}`,
          'Close',
          { duration: 3000 }
        );
      },
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  openMatchScoreModal(): void {
    const dialogRef = this.dialog.open(MatchPercentagesModalComponent, {
      width: '600px',
      maxHeight: '80vh',
      data: {
        candidate: {
          id: this.data.candidate.id,
          name: this.data.candidate.name,
          email: this.data.candidate.email,
          position_id: this.data.candidate.position_id
        }
      },
      disableClose: false,
      hasBackdrop: false
    });

    dialogRef.afterClosed().subscribe((result: string) => {
      if (result === 'success') {
        this.snackBar.open('Match scores updated successfully!', 'Close', { duration: 3000 });
      }
    });
  }
}
