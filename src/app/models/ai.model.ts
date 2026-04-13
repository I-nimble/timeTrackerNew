import { ApplicationListResponse } from './application.model';

export interface CandidateEvaluationFilters {
  selectedRole?: string | null;
  selectedPracticeArea?: string | null;
  roleDescription?: string;
  query?: string;
}

export interface CandidateEvaluationIntakeInfo {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
}

export interface CandidateEvaluationRequest {
  question: string;
  filters?: CandidateEvaluationFilters;
  intakeInfo?: CandidateEvaluationIntakeInfo;
}

export interface CandidateEvaluationResultsParams {
  page?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CandidateEvaluationResponse extends ApplicationListResponse {
  sessionId?: string;
  answer?: { parts: { text: string }[] };
  best_position_category?: {
    id: number;
    name: string;
  } | null;
}