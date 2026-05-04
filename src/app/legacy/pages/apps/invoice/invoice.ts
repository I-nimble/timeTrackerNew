export class Company {
  constructor(
    public id = 0,
    public name = '',
    public description = '',
  ) {}
}

export class User {
  constructor(
    public name = '',
    public last_name = '',
    public email = '',
    public company: Company = new Company(),
  ) {}
}

export class PaymentStatus {
  constructor(public name = '') {}
}

export class InvoiceList {
  constructor(
    public id = 0,
    public user_id = 0,
    public plan_id = 0,
    public description = '',
    public amount = 0,
    public currency_id = 0,
    public due_date: Date = new Date(),
    public status_id = 0,
    public created_at: Date = new Date(),
    public updated_at: Date = new Date(),
    public status: PaymentStatus = new PaymentStatus(),
    public user: User = new User(),
  ) {}
}
