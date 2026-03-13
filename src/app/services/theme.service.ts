import { Injectable } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { AppSettings, ThemePreference } from 'src/app/config';
import { CoreService } from './core.service';
import { UsersService } from './users.service';

export const THEME_STORAGE_KEY = 'themePreference';
const LIGHT_ONLY_ROUTE_PREFIXES = ['/landingpage', '/authentication'];

@Injectable({ providedIn: 'root' })
export class ThemeService {
  htmlElement: HTMLElement | null = null;

  get theme(): ThemePreference {
    return this.settings.getOptions().theme || 'light';
  }
  
  constructor(
    private settings: CoreService,
    private usersService: UsersService
  ) {
    this.htmlElement = document.querySelector('html');
    if (!this.htmlElement) {
      return;
    }

    this.syncThemeWithRoute(typeof window !== 'undefined' ? window.location.pathname : '');
  }

  hydrateFromServerIfAuthenticated(): void {
    if (!localStorage.getItem('jwt') || this.hasStoredThemePreference()) {
      return;
    }

    this.usersService
      .getThemePreference()
      .pipe(catchError(() => of(null)))
      .subscribe((response) => {
        if (!response) {
          return;
        }
        this.setResolvedTheme(response, true);
      });
  }

  initializeFromLogin(themePreference?: ThemePreference): void {
    this.setResolvedTheme(themePreference || 'light', true);
  }

  setTheme(theme: ThemePreference, persistForAuthenticatedUser = true): void {
    this.setResolvedTheme(theme || 'light', true);

    if (persistForAuthenticatedUser && localStorage.getItem('jwt')) {
      this.usersService
        .updateThemePreference(theme || 'light')
        .pipe(catchError(() => of(null)))
        .subscribe();
    }
  }

  applyThemeFromOptions(options: AppSettings): void {
    this.applyTheme(options.theme || 'light');
  }

  syncThemeWithRoute(url: string): void {
    const preferredTheme = this.getStoredOrConfiguredTheme();

    if (this.isLightOnlyRoute(url)) {
      this.setResolvedTheme('light', false);
      return;
    }

    this.setResolvedTheme(preferredTheme, false);
  }

  applyColorTheme(activeTheme: string): void {
    if (!this.htmlElement) {
      return;
    }

    this.htmlElement.classList.forEach((className) => {
      if (className.endsWith('_theme')) {
        this.htmlElement?.classList.remove(className);
      }
    });

    this.htmlElement.classList.add(activeTheme);
  }

  clearStoredThemePreference(): void {
    localStorage.removeItem(THEME_STORAGE_KEY);
  }

  private resolveInitialTheme(): ThemePreference {
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
    if (this.isLightOnlyRoute(currentPath)) {
      return 'light';
    }

    return this.getStoredOrConfiguredTheme();
  }

  private getStoredOrConfiguredTheme(): ThemePreference {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (storedTheme) {
      return storedTheme as ThemePreference;
    }

    return this.settings.getOptions().theme || 'light';
  }

  private setResolvedTheme(theme: ThemePreference, persistLocally: boolean): void {
    this.applyTheme(theme);
    this.applyThemeToSettings(theme);

    if (persistLocally) {
      this.persistThemeLocal(theme);
    }
  }

  private isLightOnlyRoute(url: string): boolean {
    return LIGHT_ONLY_ROUTE_PREFIXES.some((prefix) => url.startsWith(prefix));
  }

  private applyTheme(theme: ThemePreference): void {
    if (!this.htmlElement) {
      return;
    }

    if (theme === 'dark') {
      this.htmlElement.classList.add('dark-theme');
      this.htmlElement.classList.remove('light-theme');
      return;
    }

    this.htmlElement.classList.remove('dark-theme');
    this.htmlElement.classList.add('light-theme');
  }

  private applyThemeToSettings(theme: ThemePreference): void {
    this.settings.setOptions({ theme });
  }

  private persistThemeLocal(theme: ThemePreference): void {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }

  private hasStoredThemePreference(): boolean {
    return !!localStorage.getItem(THEME_STORAGE_KEY);
  }
}