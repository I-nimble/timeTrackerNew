import { Component, Input, HostBinding } from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

type ButtonVariant = 'filled' | 'pulse' | 'ghost' | 'transparent';

@Component({
  selector: 'app-hero-button',
  imports: [UpperCasePipe, MatIconModule],
  templateUrl: './hero-button.component.html',
  styleUrl: './hero-button.component.scss'
})
export class HeroButtonComponent {
  @Input() text = '';
  @Input() variant: ButtonVariant = 'filled';

  @HostBinding('class.filled') get isFilled() { return this.variant === 'filled'; }
  @HostBinding('class.pulse') get isPulse() { return this.variant === 'pulse'; }
  @HostBinding('class.ghost') get isGhost() { return this.variant === 'ghost'; }
  @HostBinding('class.transparent') get isTransparent() { return this.variant === 'transparent'; }
}
