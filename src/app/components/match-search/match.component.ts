import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { TablerIconsModule } from 'angular-tabler-icons';
import { TourMatMenuModule } from 'ngx-ui-tour-md-menu';
import { MaterialModule } from 'src/app/legacy/material.module';

@Component({
  selector: 'app-match',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MaterialModule,
    TablerIconsModule,
    TourMatMenuModule,
  ],
  templateUrl: './match.component.html',
})
export class MatchComponent {
  @Input() aiEnabled = false;
  @Input() canSearch = false;
  @Input() placeholder = 'Search...';
  @Input() loading = false;
  @Input() showInterviewButton = false;
  @Input() interviewDisabled = false;
  @Input() showCustomSearch = true;
  @Input() hasKeywords = false;

  @Output() askAI = new EventEmitter<string>();
  @Output() searchChange = new EventEmitter<string>();
  @Output() interview = new EventEmitter<void>();

  @Input() query = '';
  cooldownActive = false;

  onSearchChange() {
    this.searchChange.emit(this.query);
  }

  onAskAI() {
    if (
      (!this.query && !this.canSearch && !this.hasKeywords) ||
      this.cooldownActive
    )
      return;
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
