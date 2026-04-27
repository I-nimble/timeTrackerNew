import { Injectable } from '@angular/core';

import { environment } from 'src/environments/environment';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

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
  withScope(
    scope: string,
  ): Pick<LoggerService, 'debug' | 'info' | 'warn' | 'error'> {
    const prefix = `[${scope}]`;
    return {
      debug: (message, context) => this.debug(`${prefix} ${message}`, context),
      info: (message, context) => this.info(`${prefix} ${message}`, context),
      warn: (message, context) => this.warn(`${prefix} ${message}`, context),
      error: (message, context) => this.error(`${prefix} ${message}`, context),
    };
  }

  private write(level: LogLevel, message: string, context?: unknown): void {
    if (LEVEL_RANK[level] < LEVEL_RANK[this.minLevel]) {
      return;
    }

    const timestamp = new Date().toISOString();
    const payload = context === undefined ? '' : context;

    switch (level) {
      case 'debug':
        console.debug(timestamp, message, payload);
        break;
      case 'info':
        console.info(timestamp, message, payload);
        break;
      case 'warn':
        console.warn(timestamp, message, payload);
        break;
      case 'error':
        console.error(timestamp, message, payload);
        break;
    }
  }
}
