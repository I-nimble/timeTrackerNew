import { Injectable, inject } from '@angular/core';

import { IndividualConfig, ToastrService } from 'ngx-toastr';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationOptions extends Partial<IndividualConfig> {
  title?: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly toastr = inject(ToastrService);

  success(message: string, options: NotificationOptions = {}): void {
    this.show('success', message, options);
  }

  error(message: string, options: NotificationOptions = {}): void {
    this.show('error', message, options);
  }

  warning(message: string, options: NotificationOptions = {}): void {
    this.show('warning', message, options);
  }

  info(message: string, options: NotificationOptions = {}): void {
    this.show('info', message, options);
  }

  dismissAll(): void {
    this.toastr.clear();
  }

  private show(
    type: NotificationType,
    message: string,
    options: NotificationOptions,
  ): void {
    const { title, ...config } = options;
    switch (type) {
      case 'success':
        this.toastr.success(message, title, config);
        break;
      case 'error':
        this.toastr.error(message, title, config);
        break;
      case 'warning':
        this.toastr.warning(message, title, config);
        break;
      case 'info':
        this.toastr.info(message, title, config);
        break;
    }
  }
}
