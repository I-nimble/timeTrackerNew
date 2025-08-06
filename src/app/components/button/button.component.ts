import { Component, Input, HostBinding } from '@angular/core';
import { NgIf } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

type ButtonVariant = 'filled' | 'ghost' | 'transparent';
type ButtonSize = 'small' | 'medium' | 'large';

@Component({
  selector: 'app-button',
  imports: [MatIconModule, NgIf],
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss'
})
export class ButtonComponent {
  @Input() text = '';
  @Input() variant: ButtonVariant = 'filled';
  @Input() size: ButtonSize = 'medium';
  @Input() href = '';
  @Input() disabled = false;
  @Input() fullWidth = false;

  @HostBinding('class.full-width') get isFullWidth() { return this.fullWidth; }
  @HostBinding('class.disabled') get isDisabled() { 
    return this.disabled; 
  }
  @HostBinding('class.small') get isSmall() { return this.size === 'small'; }
  @HostBinding('class.medium') get isMedium() { return this.size === 'medium'; }
  @HostBinding('class.large') get isLarge() { return this.size === 'large'; }
  @HostBinding('class.filled') get isFilled() { return this.variant === 'filled'; }
  @HostBinding('class.ghost') get isGhost() { return this.variant === 'ghost'; }
  @HostBinding('class.transparent') get isTransparent() { return this.variant === 'transparent'; }
}
