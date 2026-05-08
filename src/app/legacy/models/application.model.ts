export interface ApplicationListMeta {
  total: number;
  totalPages: number;
  currentPage: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface ApplicationListItem {
  id: number | string;
  name: string;
  current_position?: string | null;
  position_id?: number | string | null;
  skills?: string | null;
  location?: string | null;
  work_experience?: string | null;
  work_experience_summary?: string | null;
  certifications?: { name?: string | null }[];
  status?: string | null;
  overall_match_percentage?: number | string | null;
  match_percentage?: number | string | null;
  profile_pic_url?: string | null;
  createdAt?: string | Date;
  submission_date?: string | Date;
  ai_rank?: number | string | null;
  position_category?: string | null;
  best_position_category_id?: number | null;
}

export interface ApplicationListResponse {
  items: ApplicationListItem[];
  meta: ApplicationListMeta;
  message?: string;
  sessionId?: string;
}
