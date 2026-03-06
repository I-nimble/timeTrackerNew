import { PaginationMeta } from './PaginationMeta.model';

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
  message?: string;
}
