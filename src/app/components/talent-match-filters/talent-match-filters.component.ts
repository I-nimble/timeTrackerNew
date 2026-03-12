import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Positions } from 'src/app/models/Position.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-talent-match-filters',
  templateUrl: './talent-match-filters.component.html',
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule
  ]
})
export class TalentMatchFiltersComponent {
  @Input() positions: Positions[] = [];
  @Input() practiceAreas: string[] = [];
  @Output() filtersChange = new EventEmitter<any>();

  selectedRole: string | null = null;
  selectedPracticeArea: string | null = null;

  emitFilters() {
    this.filtersChange.emit({
      position_id: this.selectedRole,
      // practiceArea: this.selectedPracticeArea
    });
  }
}