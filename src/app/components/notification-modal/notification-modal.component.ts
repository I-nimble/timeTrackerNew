import { NgClass, NgFor, NgIf, CommonModule } from '@angular/common';
import {
  Component,
  inject,
  effect,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { getState } from '@ngrx/signals';
import { NotificationStore } from 'src/app/stores/notification.store';

@Component({
  selector: 'app-notification-modal',
  standalone: true,
  imports: [NgIf, NgFor, NgClass],
  templateUrl: './notification-modal.component.html',
  styleUrl: './notification-modal.component.scss',
  // changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationModalComponent implements OnInit {
  notificationStore = inject(NotificationStore);

  constructor() {
    effect(() => {
      const state = getState(this.notificationStore);
    });
  }

  ngOnInit(): void {}

  deleteNotification(id:any) {
    this.notificationStore.removeNotification(id)
  }

  deleteAll() {
    this.notificationStore.removeAll()
  }
}
