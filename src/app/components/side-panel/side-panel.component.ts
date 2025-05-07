import { NgClass } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-side-panel',
  standalone: true,
  imports: [NgClass, RouterLink],
  templateUrl: './side-panel.component.html',
  styleUrl: './side-panel.component.scss',
})
export class SidePanelComponent {
  @Input() title!: string;
  @Output() closePanel = new EventEmitter<void>();
  show: boolean = true;

  close() {
    this.show = false;
    setTimeout(() => {
      this.closePanel.emit();
    }, 400);
  }
}
