import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';

import { UsersFilter } from '@features/users/models/users-filter.model';

@Component({
  selector: 'app-users-controls',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
export class UsersControlsComponent {
  @Input() filter: UsersFilter | null = null;
  @Output() readonly searchChange = new EventEmitter<string>();
  @Output() readonly filterByRole = new EventEmitter<number | undefined>();
  @Output() readonly newUser = new EventEmitter<void>();
}
