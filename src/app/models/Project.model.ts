import { User } from "./User.model";

export interface Project {
  id: string;
  name: string;
  description: string;
  company_id: string;
  users?: User[];
}
