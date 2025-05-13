import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-balance',
  templateUrl: './balance.component.html',
  styleUrls: ['./balance.component.scss'],
})
export class BalanceComponent implements OnChanges {
  @Input() payments: any = [];
  balance: any;
  constructor() {}

  ngOnChanges(changes: SimpleChanges): void {
    if (this.payments != undefined) {
      let acc = 0;
      this.payments = this.payments.map((payment: any) => {
        acc = payment.amount + acc;
      });
      this.balance = acc;
    }
  }
}
