import { Signal, inject } from '@angular/core';

import { FeatureFlags } from '../models/feature-flags.model';
import { FeatureFlagsService } from '../services/feature-flags.service';

/**
 * Injection helper that returns a `Signal<boolean>` for the given feature flag.
 * Must be called inside an injection context (component/directive class field,
 * constructor, or an explicit `inject()` call).
 *
 * @example
 * // In a component class:
 * readonly isNotificationsEnabled = withFeatureFlag('notificationsRefactor');
 *
 * // In a template:
 * @if (isNotificationsEnabled()) { … }
 */
export function withFeatureFlag(flag: keyof FeatureFlags): Signal<boolean> {
  return inject(FeatureFlagsService).asSignal(flag);
}
