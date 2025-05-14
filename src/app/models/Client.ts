export interface PossibleClient {
  name: string;
  lastname: string;
  company: string;
  email: string;
  phone: string;
  positions: string;
  tasks_description: string;
}

export interface PossibleMember {
  name: string;
  lastname: string;
  email: string;
  phone: string;
  englishLevel: string;
  resume: File
}
