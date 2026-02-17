import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MaterialModule } from '../../material.module';
import { Highlight, HighlightAuto } from 'ngx-highlightjs';
import { HighlightLineNumbers } from 'ngx-highlightjs/line-numbers';
import { allSkills } from './skills';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { IntakeService } from 'src/app/services/intake.service';
import { environment } from 'src/environments/environment';

@Component({
  standalone: true,
  selector: 'app-intake-form',
  imports: [
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    HighlightLineNumbers,
    Highlight,
    HighlightAuto,
    CommonModule
  ],
  templateUrl: './discovery-form.component.html',
  styleUrl: './discovery-form.component.scss',
})
export class AppDiscoveryFormComponent implements OnInit {
  contactInfo = this.fb.group({
    companyName: ['', Validators.required],
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    countryCode: ['+1', Validators.required],
    phone: ['', [Validators.required, Validators.pattern(/^\d{7,11}$/)]
    ],
  });
  roleInfo = this.fb.group({
    jobNameAndDescription: ['', Validators.required],
    requiredSkillsCategory: ['', Validators.required],
    otherSkillsCategory: [''],
    requiredSkills: [[], Validators.required],
    routineOriented: ['', Validators.required],
    socialOriented: ['', Validators.required],
    decisionMaking: ['', Validators.required],
    attentionToDetail: ['', Validators.required],
  });
  personalInfo = this.fb.group({
    managementStyle: ['', Validators.required],
    feedbackStyle: ['', Validators.required],
    communicationStyle: ['', Validators.required],
    conflictHandling: ['', Validators.required],
    acceptOtherCommunications: [true, Validators.requiredTrue],
    acceptPersonalData: [true, Validators.requiredTrue],
  });
  skills: any[] = [];
  formSubmitted = false;
  otherSkillset = false;
  videoUrl = environment.videos + '/intake-presentation.mp4';

  constructor(
    private fb: FormBuilder,
    public snackBar: MatSnackBar,
    private intakeService: IntakeService,
  ) {}

  ngOnInit(): void {
    this.roleInfo.get('requiredSkillsCategory')?.valueChanges.subscribe((value) => {
      this.roleInfo.get('requiredSkills')?.enable();
      this.roleInfo.get('requiredSkills')?.reset();
      if(value === 'other') {
        this.otherSkillset = true;
        this.filterSkillsByCategory()
      }
      else {
        this.otherSkillset = false;
        this.roleInfo.get('otherSkillsCategory')?.reset();
        this.filterSkillsByCategory(value as string)
      }
    });
  }

  filterSkillsByCategory(category?: string) {
    if(category) {
      this.skills = allSkills.filter((skill) => skill.category === category);
    }
    else {
      this.skills = allSkills;
    }
  }

  sendForm() {
    if (!this.contactInfo.get('email')?.valid) {
      this.openSnackBar('Please enter a valid email address', 'Close');
      return;
    }
    if (!this.contactInfo.get('phone')?.valid) {
      this.openSnackBar('Please enter a valid phone number', 'Close');
      return;
    }
    if (
      !this.contactInfo.valid ||
      !this.roleInfo.valid ||
      !this.personalInfo.valid
    ) {
      this.openSnackBar('Fill all the required fields', 'Close');
      return;
    }
    if (!this.personalInfo.get('acceptOtherCommunications')?.valid || !this.personalInfo.get('acceptPersonalData')?.valid) {
      this.openSnackBar('Please accept the terms and conditions', 'Close');
      return;
    }

    const data = {
      ...this.contactInfo.value,
      ...this.roleInfo.value,
      ...this.personalInfo.value,
    };
    this.intakeService.submitDiscovery(data).subscribe({
      next: () => {
        this.openSnackBar('Form submitted successfully', 'Close');
        this.formSubmitted = true;
        this.contactInfo.reset();
        this.roleInfo.reset();
        this.personalInfo.reset();
      },
      error: () => {
        this.openSnackBar('Error submitting form', 'Close');
      },
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
