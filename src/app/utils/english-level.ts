const ENGLISH_LEVEL_BUCKETS = [
  { min: 1, max: 2, label: 'A0' },
  { min: 3, max: 3, label: 'A1' },
  { min: 4, max: 4, label: 'A2' },
  { min: 5, max: 5, label: 'B1' },
  { min: 6, max: 6, label: 'B2' },
  { min: 7, max: 7, label: 'C1' },
  { min: 8, max: 10, label: 'C2' }
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
