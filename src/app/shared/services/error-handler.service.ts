import { HttpErrorResponse } from '@angular/common/http';
import {
  ErrorHandler,
  Injectable,
  OnDestroy,
  Provider,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';

import { Observable, Subject } from 'rxjs';

import { AUTH_TOKEN_STORAGE_KEY } from './auth-storage.constants';
import { LoggerService } from './logger.service';
import { NotificationService } from './notification.service';

export interface AppErrorValidationIssue {
  field: string;
  error: string;
}

export interface AppError {
  message: string;
  status?: number;
  url?: string;
  technical?: string;
  timestamp: Date;
  validation?: AppErrorValidationIssue[];
  original?: unknown;
}

export interface ErrorHandlerOptions {
  /** Message shown to the user when the error cannot be classified. */
  fallbackMessage?: string;
  /** When `false`, suppresses the user-facing toast (error is still logged). */
  silent?: boolean;
}

const DEFAULT_FALLBACK = 'Something went wrong. Please try again.';
const LOGIN_ROUTE = '/authentication/login';

@Injectable({ providedIn: 'root' })
export class ErrorHandlerService implements ErrorHandler, OnDestroy {
  private readonly logger = inject(LoggerService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly errorSubject = new Subject<AppError>();

  readonly error$: Observable<AppError> = this.errorSubject.asObservable();

  /** Angular `ErrorHandler` contract — invoked for uncaught errors when registered globally. */
  handleError(error: unknown): void {
    try {
      if (error instanceof HttpErrorResponse) {
        const appError = this.fromHttp(error, 'unknown');
        this.handle(appError);
      } else {
        this.report(error);
      }
    } catch (handlerError) {
      console.error(
        'ErrorHandlerService.handleError failed',
        handlerError,
        error,
      );
    }
  }

  ngOnDestroy(): void {
    this.errorSubject.complete();
  }

  /**
   * Centralized handler that logs and optionally notifies the user.
   * Safe to call from `catchError` blocks in effects/services.
   */
  report(error: unknown, options: ErrorHandlerOptions = {}): void {
    const { fallbackMessage = DEFAULT_FALLBACK, silent = false } = options;
    const message = this.resolveMessage(error, fallbackMessage);

    this.logger.error(message, error);

    if (silent) {
      return;
    }

    this.notifications.error(message);
  }

  /**
   * Handle structured HTTP errors with status codes, validation errors, and 401 redirects.
   * Emits error through Observable for subscribers; shows notification to user.
   */
  handle(error: AppError): void {
    this.logger.error(
      `[HTTP ${error.status ?? 'N/A'}] ${error.message}`,
      error,
    );

    this.notifications.error(error.message);

    if (error.status === 401) {
      this.redirectToLogin();
    }

    this.errorSubject.next(error);
  }

  /**
   * Transform raw HttpErrorResponse into structured AppError.
   * Extracts message, validation errors, and technical details.
   */
  fromHttp(error: HttpErrorResponse | null | undefined, url: string): AppError {
    const body = error ? this.extractBody(error) : null;
    const status = error?.status ?? 0;

    return {
      status,
      url,
      timestamp: new Date(),
      message: this.resolveBodyMessage(status, body),
      technical: error?.message,
      validation: this.extractValidation(body),
      original: error,
    };
  }

  private resolveMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      const body = this.extractBody(error);
      return this.resolveBodyMessage(error.status, body, fallback);
    }

    if (error instanceof Error && error.message) {
      return error.message;
    }

    if (typeof error === 'string' && error.trim().length > 0) {
      return error;
    }

    return fallback;
  }

  private resolveBodyMessage(
    status: number,
    body: Record<string, unknown> | string | null,
    fallback = this.defaultMessageForStatus(status),
  ): string {
    if (typeof body === 'string' && body.trim().length > 0) {
      return body;
    }
    if (body && typeof body === 'object') {
      const bodyRecord = body as Record<string, unknown>;
      const message = bodyRecord['message'];
      if (typeof message === 'string' && message.trim().length > 0) {
        return message;
      }
    }
    return fallback;
  }

  private extractBody(
    error: HttpErrorResponse,
  ): Record<string, unknown> | string | null {
    const raw = error.error;
    if (raw == null) return null;
    if (typeof raw === 'string') return raw;
    if (typeof raw === 'object') return raw as Record<string, unknown>;
    return null;
  }

  private extractValidation(
    body: Record<string, unknown> | string | null,
  ): AppErrorValidationIssue[] | undefined {
    if (!body || typeof body !== 'object') return undefined;
    const errors = (body as Record<string, unknown>)['errors'];
    if (!Array.isArray(errors)) return undefined;

    return errors
      .filter(
        (entry): entry is Record<string, unknown> =>
          !!entry && typeof entry === 'object',
      )
      .map((entry) => {
        const e = entry as Record<string, unknown>;
        const field = e['field'] ?? e['fieldName'] ?? e['name'] ?? '';
        const errorValue = e['error'] ?? e['message'] ?? '';
        return {
          field: String(field),
          error:
            typeof errorValue === 'string' ? errorValue : String(errorValue),
        } as AppErrorValidationIssue;
      })
      .filter((v) => v.field.length > 0 && v.error.length > 0);
  }

  private defaultMessageForStatus(status: number): string {
    if (status === 0) return 'Network error. Please check your connection.';
    if (status === 400) return 'The request is invalid.';
    if (status === 401)
      return 'Your session has expired. Please sign in again.';
    if (status === 403)
      return "You don't have permission to perform this action.";
    if (status === 404) return 'The requested resource was not found.';
    if (status === 409)
      return 'Conflict with the current state of the resource.';
    if (status >= 500)
      return 'The server is not responding. Please try again later.';
    return 'An unexpected error occurred.';
  }

  private redirectToLogin(): void {
    try {
      localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    } catch {
      /* ignore storage errors (SSR / privacy mode) */
    }

    const currentUrl = this.router.url ?? '';
    if (!currentUrl.startsWith(LOGIN_ROUTE)) {
      this.router.navigate([LOGIN_ROUTE]);
    }
  }
}

/**
 * Opt-in provider that registers `ErrorHandlerService` as Angular's global `ErrorHandler`.
 * Include in `app.config.ts` providers to route all uncaught errors through the service.
 */
export function provideGlobalErrorHandler(): Provider {
  return { provide: ErrorHandler, useExisting: ErrorHandlerService };
}
