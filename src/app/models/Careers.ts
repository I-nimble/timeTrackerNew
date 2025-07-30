export interface Location {
  id: number;
  city: string;
}

export interface Position {
  id: number;
  title: string;
}

export interface Department {
  id: number;
  name: string;
}

export interface FormQuestion {
  id: number;
  question_text: string;
  input_type: string;
  required: boolean;
}

export interface ApplicationAnswer {
  question_id: number;
  answer: string;
}

export interface SubmitApplicationPayload {
  location_id: number;
  position_id: number | null;
  department_id: number | null;
  answers: ApplicationAnswer[];
}

export interface ApplicationDetails {
  application_id: number;
  full_name: string;
  email: string;
  phone: string;
  location_id: number;
  position_id: number | null;
  department_id: number | null;
  answers: {
    question_id: number;
    question_text: string;
    input_type: string;
    answer: string;
  }[];
}
