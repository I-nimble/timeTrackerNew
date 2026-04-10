import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { FeatureFlags } from '../models/feature-flags.model';

@Injectable({ providedIn: 'root' })
export class FeatureFlagsService {
  private readonly flags: FeatureFlags = environment.featureFlags as FeatureFlags;

  isEnabled(flag: keyof FeatureFlags): boolean {
    return !!this.flags[flag];
  }

  getAll(): FeatureFlags {
    return { ...this.flags };
  }
}
