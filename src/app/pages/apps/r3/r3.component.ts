import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/material.module';
import { MatchComponent } from 'src/app/components/match-search/match.component';
import { MarkdownPipe, LinebreakPipe } from 'src/app/pipe/markdown.pipe';
import { RouterLink, RouterModule } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-r3',
  templateUrl: './r3.component.html',
  //styleUrls: ['./r3.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    MatchComponent,
    MarkdownPipe,
    LinebreakPipe,
    RouterModule,
  ]
})
export class R3Component implements OnInit, OnDestroy {
  theme!: string;
  htmlElement!: HTMLElement;
  private themeObserver: MutationObserver | null = null;

  constructor(
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.htmlElement = document.querySelector('html')!;
    this.checkTheme();
    
    this.themeObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          this.checkTheme();
        }
      });
    });

    this.themeObserver.observe(this.htmlElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
  }

  checkTheme(): void {
    this.theme = this.htmlElement.classList.contains('dark-theme') ? 'dark' : 'light';
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    if (this.themeObserver) {
      this.themeObserver.disconnect();
    }
  }
}