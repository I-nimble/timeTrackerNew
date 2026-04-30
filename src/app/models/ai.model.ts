export interface CandidateEvaluationFilters {
  selectedRole?: string | null;
  selectedPracticeArea?: string | null;
  roleDescription?: string | null;
  query?: string | null;
}

export interface CandidateEvaluationMeta {
  total: number;
  totalPages: number;
  currentPage: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface CandidateEvaluationItem {
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
  ai_rank?: number | string | null;
  position_category?: string | null;
  best_position_category_id?: number | null;
}

export interface CandidateEvaluationResponse {
  items: CandidateEvaluationItem[];
  meta: CandidateEvaluationMeta;
  message?: string;
  sessionId?: string;
}
