import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
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
import { MatListModule } from '@angular/material/list';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule } from '@angular/material/core';

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
    MatOptionModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatListModule
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

  constructor(
    private fb: FormBuilder,
    private applicationsService: ApplicationsService,
    private positionsService: PositionsService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<AddCandidateDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.candidateForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      skills: ['', Validators.required],
      english_level: ['', Validators.required],
      position_id: ['', Validators.required],
      current_position: [''],
      company_ids: [[]],
      availability: [false, Validators.required],
      location_id: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.positionsService.get().subscribe((positions) => {
      this.positions = positions;
      this.applicationsService.getLocations().subscribe((locations) => {
        this.locations = locations;
        const allCompanyIds = (this.data?.companies || []).map((c: any) => c.id);

        if (this.data.candidate) {
          const candidateCompanyIds = this.data.candidate.companies && this.data.candidate.companies.length > 0
            ? this.data.candidate.companies.map((c: any) => c.id)
            : allCompanyIds;

          this.candidateForm.patchValue({
            name: this.data.candidate.name,
            email: this.data.candidate.email,
            skills: this.data.candidate.skills,
            english_level: this.data.candidate.english_level,
            position_id: this.data.candidate.position_id,
            company_ids: candidateCompanyIds,
            availability: this.data.candidate.availability,
            location_id: this.locations.find((l: any) => l.country == this.data.candidate.location).id,
            current_position: this.data.candidate.current_position,
          });
        } else {
          if (allCompanyIds.length > 0) {
            this.candidateForm.patchValue({ company_ids: allCompanyIds });
          }
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
    const companyIds = formValue.company_ids || [];

    const data: any = {
      name: formValue.name,
      email: formValue.email,
      skills: formValue.skills,
      english_level: formValue.english_level,
      position_id: formValue.position_id,
      current_position: formValue.current_position,
      company_ids: companyIds,
      ...(this.selectedCVFile && { cv: this.selectedCVFile }),
      ...(this.selectedProfilePicFile && { profile_pic: this.selectedProfilePicFile }),
      availability: formValue.availability,
      location_id: formValue.location_id,
    };

    const id =
      this.data.candidate && this.data.candidate.id
        ? this.data.candidate.id
        : null;

    this.applicationsService.submit(data, id).subscribe({
      next: (response) => {
        this.snackBar.open('Candidate added successfully', 'Close', {
          duration: 3000,
        });
        this.dialogRef.close('success');
      },
      error: (error) => {
        this.snackBar.open(
          'Error adding candidate: ' + error.message,
          'Close',
          { duration: 3000 }
        );
      },
    });
  }

  isAllSelected(): boolean {
    const selected = this.candidateForm.get('company_ids')?.value || [];
    const allIds = this.data.companies.map((c: any) => c.id);
    return selected.length === allIds.length && allIds.length > 0;
  }

  getSelectedCompaniesLabel(): string {
    const selected = this.candidateForm.get('company_ids')?.value || [];
    const allIds = this.data.companies.map((c: any) => c.id);

    if (selected.length === allIds.length && allIds.length > 0) {
      return 'All';
    }

    const names = this.data.companies
      .filter((c: any) => selected.includes(c.id))
      .map((c: any) => c.name);

    return names.join(', ');
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
