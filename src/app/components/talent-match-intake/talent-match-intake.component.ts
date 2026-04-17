import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';

export interface IntakeInitialValues {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
}

@Component({
  selector: 'app-talent-match-intake',
  templateUrl: './talent-match-intake.component.html',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
  ]
})
export class TalentMatchIntakeComponent implements OnInit {
  @Input() required: boolean = true;
  @Input() initialValues: IntakeInitialValues = {};
  @Output() formReady = new EventEmitter<FormGroup>();

  intakeForm!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    const req = this.required ? [Validators.required] : [];
    this.intakeForm = this.fb.group({
      name: [this.initialValues.name ?? '', req],
      email: [this.initialValues.email ?? '', [...req, Validators.email]],
      phone: [this.initialValues.phone ?? '', [...req, Validators.pattern(/^\d{7,15}$/)]],
      company: [this.initialValues.company ?? '', req]
    });
    this.formReady.emit(this.intakeForm);
  }
}
