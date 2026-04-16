import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';

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
  @Output() formReady = new EventEmitter<FormGroup>();

  intakeForm!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    const req = this.required ? [Validators.required] : [];
    this.intakeForm = this.fb.group({
      name: ['', req],
      email: ['', [...req, Validators.email]],
      phone: ['', [...req, Validators.pattern(/^\d{7,15}$/)]],
      company: ['', req]
    });
    this.formReady.emit(this.intakeForm);
  }
}
