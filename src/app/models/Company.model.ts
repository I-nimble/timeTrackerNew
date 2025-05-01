export interface Company {
  id: number | null;
  name?: string;
  description?: string;
  timezone?: string;
  countryName?: string;
  logo?: string | undefined;
}