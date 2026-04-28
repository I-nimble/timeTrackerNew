import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';

export interface MentionUser {
  id: number;
  name: string;
  last_name: string;
  email?: string;
}

@Component({
  selector: 'app-mention-popup',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mention-popup.component.html',
  styleUrl: './mention-popup.component.scss',
})
export class MentionPopupComponent {
  @Input() open = false;
  @Input() top = 0;
  @Input() left = 0;
  @Input() users: MentionUser[] = [];
  @Input() activeIndex = 0;

  @Output() select = new EventEmitter<MentionUser>();

  trackById = (_: number, user: MentionUser) => user.id;

  onPick(event: MouseEvent, user: MentionUser) {
    event.preventDefault();
    this.select.emit(user);
  }
}
