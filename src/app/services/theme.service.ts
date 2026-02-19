import { Injectable, NgZone, OnDestroy } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService implements OnDestroy {
  theme = 'light';
  htmlElement: HTMLElement | null = null;
  private themeObserver: MutationObserver | null = null;
  
  constructor(private ngZone: NgZone) {
    this.htmlElement = document.querySelector('html');
    if (!this.htmlElement) {
      return;
    }

    this.checkTheme();

    this.themeObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          this.ngZone.run(() => this.checkTheme());
        }
      });
    });

    this.themeObserver.observe(this.htmlElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
  }

  checkTheme(): void {
    if (!this.htmlElement) {
      return;
    }
    this.theme = this.htmlElement.classList.contains('dark-theme') ? 'dark' : 'light';
  }

  ngOnDestroy(): void {
    if (this.themeObserver) {
      this.themeObserver.disconnect();
    }
  }
}