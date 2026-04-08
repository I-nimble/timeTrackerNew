import { Certification } from './certifications';
import { DiscProfile } from './disc-profile.model';

export type ApplicationPendingUpdateStatus = 'pending' | 'approved' | 'rejected';
export type ApplicationSortOrder = 'asc' | 'desc' | 'ASC' | 'DESC';
export interface ApplicationStatusFilter {
	id: number;
	status: string;
}

export interface ApplicationListParams {
	page?: number;
	limit?: number;
	offset?: number;
	sortBy?: string;
	sortOrder?: ApplicationSortOrder;
	statusIds?: number[];
	search?: string;
	onlyTalentPool?: boolean;
}

export interface ApplicationListMeta {
	total: number;
	totalPages: number;
	currentPage: number;
	limit: number;
	sortBy: string;
	sortOrder: ApplicationSortOrder;
}

export interface ApplicationListResponse {
	items: Application[];
	message?: string;
	meta: ApplicationListMeta;
}

export interface ApplicationUser {
	id: number;
	email?: string | null;
}

export interface ApplicationRanking {
	id: number;
	ranking: string;
	profile_observation: string | null;
}

export interface ApplicationMatchScoreSummary {
	match_percentage: number;
	category_name: string | null;
}

export interface ApplicationPendingUpdates {
	[key: string]: unknown;
}

export interface Application {
	id: number;
	user_id?: number | null;
	user?: ApplicationUser | null;
	resume?: string | null;
	picture?: string | null;
	full_name?: string | null;
	name?: string | null;
	email?: string | null;
	phone?: string | null;
	inmediate_availability?: boolean | null;
	availability?: boolean | null;
	english_level?: number | string | null;
	position_id?: number | null;
	current_position?: string | null;
	company_id?: number | null;
	skills?: string | null;
	location_id?: number | null;
	location?: string;
	country?: string;
	status_id?: number | null;
	status?: string | null;
	applied_where?: string | null;
	referred?: string | null;
	referrer_name?: string | null;
	age?: number | null;
	additional_phone?: string | null;
	current_residence?: string | null;
	address?: string | null;
	children?: number | null;
	competencies?: string | null;
	tech_proficiency?: number | null;
	education_history?: string | null;
	work_experience?: string | null;
	work_experience_summary?: string | null;
	work_references?: string | null;
	hobbies?: string | null;
	schedule_availability?: boolean | null;
	salary_range?: string | null;
	programming_languages?: string | null;
	introduction_video?: string | null;
	portfolio?: string | null;
	description?: string | null;
	talent_match_profile_summary?: string | null;
	interview_link?: string | null;
	inimble_academy?: string | null;
	rejection_reason?: string | null;
	pending_updates?: ApplicationPendingUpdates | null;
	pending_update_status?: ApplicationPendingUpdateStatus | null;
	ranking_id?: number | null;
	ranking?: ApplicationRanking | null;
	suggested_salary?: number | null;
	profile_pic_url?: string | null;
	resume_url?: string | null;
	submission_date?: string;
	match_percentage?: number;
	position_category?: string | null;
	all_match_scores?: ApplicationMatchScoreSummary[];
	certifications?: Certification[];
	disc_profiles?: DiscProfile[];
	createdAt?: string;
	updatedAt?: string;
}