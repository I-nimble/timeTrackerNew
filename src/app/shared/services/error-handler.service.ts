import { HttpErrorResponse } from '@angular/common/http';
import { ErrorHandler, Injectable, Provider, inject } from '@angular/core';

import { LoggerService } from './logger.service';
import { NotificationService } from './notification.service';

export interface ErrorHandlerOptions {
  /** Message shown to the user when the error cannot be classified. */
  fallbackMessage?: string;
  /** When `false`, suppresses the user-facing toast (error is still logged). */
  silent?: boolean;
}

const DEFAULT_FALLBACK = 'Something went wrong. Please try again.';

@Injectable({ providedIn: 'root' })
export class ErrorHandlerService implements ErrorHandler {
  private readonly logger = inject(LoggerService);
  private readonly notifications = inject(NotificationService);

  /** Angular `ErrorHandler` contract — invoked for uncaught errors when registered globally. */
  handleError(error: unknown): void {
    this.report(error);
  }

  /**
   * Centralized handler that logs and optionally notifies the user.
   * Safe to call from `catchError` blocks in effects/services.
   */
  report(error: unknown, options: ErrorHandlerOptions = {}): void {
    const { fallbackMessage = DEFAULT_FALLBACK, silent = false } = options;
    const message = this.extractMessage(error, fallbackMessage);

    this.logger.error(message, error);

    if (silent) {
      return;
    }

    this.notifications.error(message);
  }

  private extractMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      const body = error.error as
        | { message?: string }
        | string
        | null
        | undefined;
      if (typeof body === 'string' && body.trim().length > 0) {
        return body;
      }
      if (
        body &&
        typeof body === 'object' &&
        typeof body.message === 'string'
      ) {
        return body.message;
      }
      if (error.message) {
        return error.message;
      }
      return fallback;
    }

    if (error instanceof Error && error.message) {
      return error.message;
    }

    if (typeof error === 'string' && error.trim().length > 0) {
      return error;
    }

    return fallback;
  }
}

/**
 * Opt-in provider that registers `ErrorHandlerService` as Angular's global `ErrorHandler`.
 * Include in `app.config.ts` providers to route all uncaught errors through the service.
 */
export function provideGlobalErrorHandler(): Provider {
  return { provide: ErrorHandler, useExisting: ErrorHandlerService };
}
