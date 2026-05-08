import { ChangeDetectionStrategy, Component, Input, signal, Output, EventEmitter } from '@angular/core';
import { DecimalPipe } from '@angular/common';

import { PricingPlan } from '../pricing.model';

@Component({
  selector: 'app-pricing-card',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './pricing-card.component.html',
  styleUrl: './pricing-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PricingCardComponent {
  @Input({ required: true }) plan!: PricingPlan;
  @Input() isCurrentPlan = false;

  @Output() planSelected = new EventEmitter<PricingPlan>();

  openFeatureIndex = signal<number | null>(null);

  toggleFeature(index: number): void {
    this.openFeatureIndex.update((current) => (current === index ? null : index));
  }

  onSelectPlan(): void {
    this.planSelected.emit(this.plan);
  }
}
