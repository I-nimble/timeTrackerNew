export interface Plan {
  id: number;
  name: string;
  description: string;
  price: number;
  currency_id?: number;
}

export interface CompanyPlan {
  id: number;
  company_id: string | number;
  plan: Plan;
  status: string;
  start_date: string | null;
  end_date: string | null;
  next_payment_date: string | null;
  subscription: {
    status: string;
    current_period_end: string | null;
    cancel_at_period_end: boolean;
  } | null;
  client_plan: {
    status: string;
    current_period_end: string | null;
    cancel_at_period_end: boolean;
  } | null;
}
