const ENGLISH_LEVEL_BUCKETS = [
  { min: 1, max: 2.0, label: 'A0' },
  { min: 2.1, max: 3.0, label: 'A1' },
  { min: 3.1, max: 4.0, label: 'A2' },
  { min: 4.1, max: 5.0, label: 'B1' },
  { min: 5.1, max: 6.0, label: 'B2' },
  { min: 6.1, max: 7.0, label: 'C1' },
  { min: 7.1, max: 10.0, label: 'C2' }
];

export const getEnglishLevelLabel = (value: number): string => {
  if (!value) return '';
  const bucket = ENGLISH_LEVEL_BUCKETS.find(
    (entry) => value >= entry.min && value <= entry.max
  );
  return bucket ? bucket.label : '';
};

export const getEnglishLevelPercent = (value: number): number => {
  if (!value) return 0;
  return Math.round((value / 10) * 100);
};

export const formatEnglishLevelDisplay = (value: number): string => {
  if (!value) return '';
  const label = getEnglishLevelLabel(value);
  return label ? `${value} (${label})` : String(value);
};
