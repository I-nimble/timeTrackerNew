export interface PricingFeature {
  label: string;
  description: string;
}

export interface FeaturesSectionLabel {
  prefix: string;
  highlight?: string;
  suffix?: string;
}

export interface PricingPlan {
  title: string;
  description: string;
  price: number;
  priceSuffix?: string;
  featuresLabel: FeaturesSectionLabel;
  features: PricingFeature[];
  buttonText: string;
  buttonLink: string;
  isPopular?: boolean;
}
