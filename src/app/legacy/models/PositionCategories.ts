export interface Position {
  id?: number;
  title: string;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
  hired?: boolean;
}

export interface PositionCategory {
  title: string;
  subcategories?: PositionCategory[];
  positions?: Position[];
  highlighted: boolean;
}
