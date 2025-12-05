import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';

@Component({
  selector: 'app-match',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MaterialModule,
    TablerIconsModule
  ],
  templateUrl: './match.component.html'
})
export class MatchComponent {
  @Input() aiEnabled: boolean = false;
  @Input() canSearch: boolean = false;
  @Input() placeholder: string = 'Search...';
  @Input() loading = false;
  @Input() showInterviewButton = false;
  @Input() interviewDisabled = false;

  @Output() askAI = new EventEmitter<string>();
  @Output() searchChange = new EventEmitter<string>();
  @Output() interview = new EventEmitter<void>();

  query: string = '';
  cooldownActive = false;

  onSearchChange() {
    this.searchChange.emit(this.query);
  }

  onAskAI() {
    if ((!this.query && !this.canSearch) || this.cooldownActive) return;
    this.loading = true;
    this.askAI.emit(this.query);
    this.cooldownActive = true;
    setTimeout(() => {
      this.cooldownActive = false;
    }, 15000);
  }

  finishLoading() {
    this.loading = false;
  }

  onInterviewClick() {
    this.interview.emit();
  }
}