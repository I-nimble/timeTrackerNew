import { Injectable, Signal, computed, signal } from '@angular/core';

import { environment } from 'src/environments/environment';

import { fromEnvironment } from '../adapters/environment-flags.adapter';
import { FeatureFlags } from '../models/feature-flags.model';

@Injectable({ providedIn: 'root' })
export class FeatureFlagsService {
  private readonly _flags = signal<FeatureFlags>(
    fromEnvironment(
      (environment as { featureFlags?: Partial<FeatureFlags> }).featureFlags,
    ),
  );

  /** Read-only signal exposing the full flags snapshot. */
  readonly flags: Signal<FeatureFlags> = this._flags.asReadonly();

  /**
   * Returns `true` synchronously when the flag is enabled.
   * Reads from the signal so it is reactive when called inside a reactive context.
   */
  isEnabled(flag: keyof FeatureFlags): boolean {
    return !!this._flags()[flag];
  }

  /**
   * Returns a `Signal<boolean>` computed from the given flag.
   * Use this in component class fields so the template reacts to changes.
   *
   * @example
   * readonly showNewDashboard = inject(FeatureFlagsService).asSignal('dashboardRefactor');
   */
  asSignal(flag: keyof FeatureFlags): Signal<boolean> {
    return computed(() => !!this._flags()[flag]);
  }

  /** Returns the full flags signal. */
  getAll(): Signal<FeatureFlags> {
    return this.flags;
  }
}
