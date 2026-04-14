import { FeatureFlags } from '../models/feature-flags.model';

const FLAG_DEFAULTS: FeatureFlags = {
  notificationsRefactor: false,
  intakeRefactor: false,
  dashboardRefactor: false,
  billingRefactor: false,
  workforceRefactor: false,
  timeTrackingRefactor: false,
  talentMatchRefactor: false,
  authenticationRefactor: false,
};

/**
 * Safely maps an environment flags object to a complete FeatureFlags record.
 * Any missing flag falls back to `false` (off by default).
 */
export function fromEnvironment(
  envFlags: Partial<FeatureFlags> | undefined,
): FeatureFlags {
  return { ...FLAG_DEFAULTS, ...envFlags };
}
