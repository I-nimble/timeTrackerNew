import { Component, EventEmitter, Input } from '@angular/core';
import { User } from 'src/app/models/User.model';
import { PaymentsService } from 'src/app/services/payments.service';
import { PdfInvoiceService } from 'src/app/services/pdf-invoice.service';
import { UsersService } from 'src/app/services/users.service';

@Component({
  selector: 'app-payment-history',
  templateUrl: './payment-history.component.html',
  styleUrls: ['./payment-history.component.scss'],
})
export class PaymentHistoryComponent {
  @Input() payments: any
  allPayments: any[] = [];
  selectedPayment: any;
  name?: any
  last_name?: any


  constructor(private usersService: UsersService, private paymentsService: PaymentsService, private pdfInvoiceService: PdfInvoiceService) {}

  ngOnInit() {
    this.paymentsService.getPendingBills().subscribe((data: any) => {
      this.allPayments = data;
    });

    this.name = this.getUserName()
  }

  viewMore(payment: any) {
    this.selectedPayment = payment; 
  }

  getUserName(){
    const name = localStorage.getItem('name')
    return name;
  }

  downloadPDF() {
    this.pdfInvoiceService.generatePDF(this.name, this.selectedPayment);
  }

}
