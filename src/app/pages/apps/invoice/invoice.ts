export class Company {
  constructor(
    public id: number = 0,
    public name: string = '',
    public description: string = ''
  ) {}
}

export class User {
  constructor(
    public name: string = '',
    public last_name: string = '',
    public email: string = '',
    public company: Company = new Company()
  ) {}
}

export class PaymentStatus {
  constructor(
    public name: string = ''
  ) {}
}

export class InvoiceList {
  constructor(
    public id: number = 0,
    public user_id: number = 0,
    public plan_id: number = 0,
    public description: string = '',
    public amount: number = 0,
    public currency_id: number = 0,
    public due_date: Date = new Date(),
    public status_id: number = 0,
    public created_at: Date = new Date(),
    public updated_at: Date = new Date(),
    public status: PaymentStatus = new PaymentStatus(),
    public user: User = new User()
) {}
}