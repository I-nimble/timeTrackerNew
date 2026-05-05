export interface Employee {
  id: number;
  Name: string;
  LastName: string;
  Position: number;
  Email: string;
  Password: string;
  Projects: number[];
  image: any;
  hourly_rate?: number;
  action?: string;
}
