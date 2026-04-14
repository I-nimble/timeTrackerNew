import { TestBed } from '@angular/core/testing';

import { FeatureFlagsService } from './feature-flags.service';
import { FeatureFlags } from '../models/feature-flags.model';

describe('FeatureFlagsService', () => {
  let service: FeatureFlagsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FeatureFlagsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('isEnabled() should return false for flags that are off in the environment', () => {
    const allOff: (keyof FeatureFlags)[] = [
      'notificationsRefactor',
      'intakeRefactor',
      'dashboardRefactor',
      'billingRefactor',
      'workforceRefactor',
      'timeTrackingRefactor',
      'talentMatchRefactor',
      'authenticationRefactor',
    ];
    allOff.forEach((flag) => {
      expect(service.isEnabled(flag)).toBe(false);
    });
  });

  it('asSignal() should return a Signal that reflects the flag value', () => {
    const sig = service.asSignal('notificationsRefactor');
    expect(typeof sig).toBe('function');
    expect(sig()).toBe(false);
  });

  it('flags signal should expose a FeatureFlags snapshot', () => {
    const snapshot = service.flags();
    expect(snapshot).toBeDefined();
    expect(typeof snapshot.notificationsRefactor).toBe('boolean');
  });

  it('getAll() should return the same readonly signal as flags', () => {
    const all = service.getAll();
    expect(all()).toEqual(service.flags());
  });

  it('asSignal() should return independent computed signals per flag', () => {
    const notifications = service.asSignal('notificationsRefactor');
    const billing = service.asSignal('billingRefactor');
    expect(notifications()).toBe(false);
    expect(billing()).toBe(false);
  });
});
