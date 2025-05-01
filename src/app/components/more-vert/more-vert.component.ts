import { NgFor, NgIf } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface options {
  name: string;
  action: string;
  icon: string;
}

@Component({
  selector: 'app-more-vert',
  standalone: true,
  imports: [NgIf, NgFor, MatIconModule, MatButtonModule],
  templateUrl: './more-vert.component.html',
  styleUrl: './more-vert.component.scss',
})
export class MoreVertComponent implements OnInit {
  @ViewChild('moreOptionContainer', { static: false })
  moreOptionsContainer!: ElementRef<HTMLDivElement>;
  @Input() options: options[] = [];
  @Input() itemId!: string;
  @Output() onSelectedItem: EventEmitter<{ id: string; action: string }> =
    new EventEmitter<{ id: string; action: string }>();
  show: boolean = false;

  constructor(private elementRef: ElementRef<HTMLElement>) {}

  ngOnInit(): void {
    document.addEventListener('click', this.toggleVisibility.bind(this));
  }

  toggleVisibility(event: Event): void {
    const target = event.target as Node;
    if (!this.elementRef.nativeElement.contains(target)) this.show = false;
  }
}
