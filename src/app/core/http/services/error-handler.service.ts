import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';

import { LoggerService } from '@shared/services/logger.service';
import { Observable, Subject } from 'rxjs';

import { AppError, AppErrorValidationIssue } from '../models/app-error.model';

const LOGIN_ROUTE = '/authentication/login';

@Injectable({ providedIn: 'root' })
export class ErrorHandlerService {
  private readonly logger = inject(LoggerService);
  private readonly router = inject(Router);
  private readonly errorSubject = new Subject<AppError>();

  readonly error$: Observable<AppError> = this.errorSubject.asObservable();

  handle(error: AppError): void {
    this.logger.error(
      `[HTTP ${error.status ?? 'N/A'}] ${error.message}`,
      error,
    );

    if (error.status === 401) {
      this.redirectToLogin();
    }

    this.errorSubject.next(error);
  }

  fromHttp(error: HttpErrorResponse, url: string): AppError {
    const body = this.extractBody(error);

    return {
      status: error.status,
      url,
      timestamp: new Date(),
      message: this.resolveMessage(error.status, body),
      technical: error.message,
      validation: this.extractValidation(body),
      original: error,
    };
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

  private resolveMessage(
    status: number,
    body: Record<string, unknown> | string | null,
  ): string {
    if (typeof body === 'string' && body.trim().length > 0) {
      return body;
    }
    if (body && typeof body === 'object') {
      const message = (body as Record<string, unknown>)['message'];
      if (typeof message === 'string' && message.trim().length > 0) {
        return message;
      }
    }
    return this.defaultMessageForStatus(status);
  }

  private extractValidation(
    body: Record<string, unknown> | string | null,
  ): AppErrorValidationIssue[] | undefined {
    if (!body || typeof body !== 'object') return undefined;
    const errors = (body as Record<string, unknown>)['errors'];
    if (!Array.isArray(errors)) return undefined;

    return errors
      .filter(
        (entry): entry is AppErrorValidationIssue =>
          !!entry &&
          typeof entry === 'object' &&
          typeof (entry as AppErrorValidationIssue).field === 'string' &&
          typeof (entry as AppErrorValidationIssue).error === 'string',
      )
      .map((entry) => ({ field: entry.field, error: entry.error }));
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
      localStorage.removeItem('jwt');
    } catch {
      /* ignore storage errors (SSR / privacy mode) */
    }

    const currentUrl = this.router.url ?? '';
    if (!currentUrl.startsWith(LOGIN_ROUTE)) {
      this.router.navigate([LOGIN_ROUTE]);
    }
  }
}
