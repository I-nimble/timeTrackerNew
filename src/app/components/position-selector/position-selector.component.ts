import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-position-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './position-selector.component.html',
  styleUrl: './position-selector.component.scss'
})
export class PositionSelectorComponent {
  @Input() positions: any[] = [];
  @Output() selectPosition = new EventEmitter<any>();
  showOptions: boolean = false;
  selectedPosition: any = null;
  searchTerm: string = '';
  filteredPositions: any[] = [];
  showOtherOption: boolean = false;

  ngOnChanges() {
    this.filteredPositions = [...this.positions];
  }

  toggleSelector(): void {
    this.showOptions = !this.showOptions;
    if (this.showOptions) {
      this.filteredPositions = [...this.positions];
      this.searchTerm = '';
    }
  }

  filterPositions(): void {
    if (!this.searchTerm) {
      this.filteredPositions = [...this.positions];
      this.showOtherOption = false;
      return;
    }

    const searchLower = this.searchTerm.toLowerCase();
    this.filteredPositions = this.positions.filter(position => 
      position.title.toLowerCase().includes(searchLower)
    );

    // Mostrar opción "Other" si no hay coincidencias
    this.showOtherOption = this.filteredPositions.length === 0;
  }

  handleSelect(position: any): void {
    this.selectPosition.emit(position);
    this.selectedPosition = position;
    this.showOptions = false;
  }

  handleOtherInput(event: any): void {
    if (event.key === 'Enter') {
      const newPosition = {
        id: undefined,
        title: event.target.value,
      }
      this.selectPosition.emit(newPosition);
      this.selectedPosition = event.target.value;
      this.showOptions = false;
    }
  }
}
