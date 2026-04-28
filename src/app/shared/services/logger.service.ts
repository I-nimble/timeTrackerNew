import { Injectable } from '@angular/core';

import { environment } from 'src/environments/environment';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface ScopedLogger {
  debug(message: string, context?: unknown): void;
  info(message: string, context?: unknown): void;
  warn(message: string, context?: unknown): void;
  error(message: string, context?: unknown): void;
  withScope(scope: string): ScopedLogger;
}

const LEVEL_RANK: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

@Injectable({ providedIn: 'root' })
export class LoggerService {
  private readonly minLevel: LogLevel = environment.production
    ? 'warn'
    : 'debug';

  debug(message: string, context?: unknown): void {
    this.write('debug', message, context);
  }

  info(message: string, context?: unknown): void {
    this.write('info', message, context);
  }

  warn(message: string, context?: unknown): void {
    this.write('warn', message, context);
  }

  error(message: string, context?: unknown): void {
    this.write('error', message, context);
  }

  /**
   * Returns a scoped logger that prefixes every message with `[scope]`.
   * Useful for feature-specific logging without leaking the scope into callers.
   */
  withScope(scope: string): ScopedLogger {
    return this.createScopedLogger(`[${scope}]`);
  }

  private write(level: LogLevel, message: string, context?: unknown): void {
    if (LEVEL_RANK[level] < LEVEL_RANK[this.minLevel]) {
      return;
    }

    const timestamp = new Date().toISOString();

    switch (level) {
      case 'debug':
        if (context === undefined) {
          console.debug(timestamp, message);
          break;
        }

        console.debug(timestamp, message, context);
        break;
      case 'info':
        if (context === undefined) {
          console.info(timestamp, message);
          break;
        }

        console.info(timestamp, message, context);
        break;
      case 'warn':
        if (context === undefined) {
          console.warn(timestamp, message);
          break;
        }

        console.warn(timestamp, message, context);
        break;
      case 'error':
        if (context === undefined) {
          console.error(timestamp, message);
          break;
        }

        console.error(timestamp, message, context);
        break;
    }
  }

  private createScopedLogger(prefix: string): ScopedLogger {
    return {
      debug: (message, context) => this.debug(`${prefix} ${message}`, context),
      info: (message, context) => this.info(`${prefix} ${message}`, context),
      warn: (message, context) => this.warn(`${prefix} ${message}`, context),
      error: (message, context) => this.error(`${prefix} ${message}`, context),
      withScope: (scope: string) =>
        this.createScopedLogger(`${prefix} [${scope}]`),
    };
  }
}
