import { Component, Input, OnInit } from '@angular/core';
import { PaymentsService } from 'src/app/services/payments.service';
import { Router, NavigationExtras } from '@angular/router';
import Swal, { SweetAlertIcon } from 'sweetalert2';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-bills',
  templateUrl: './bills.component.html',
  styleUrls: ['./bills.component.scss'],
})
export class BillsComponent implements OnInit {
  billsList: Array<any> = [];
  assetsPath: string = environment.assets;

  constructor(private billService: PaymentsService, private router: Router) {}
  ngOnInit(): void {
    this.getPayments();
    this.checkStatus();
  }
  async checkStatus() {
    const clientSecret = new URLSearchParams(window.location.search).get(
      'payment_intent_client_secret'
    );
    if (!clientSecret) {
      return;
    }

    const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret);

    switch (paymentIntent.status) {
      case 'succeeded':
        this.showMessage('Payment succeeded!', 'success');
        break;
      case 'processing':
        this.showMessage('Your payment is processing.', 'info');
        break;
      case 'requires_payment_method':
        this.showMessage('Your payment was not successful, please try again.', 'error');
        break;
      default:
        this.showMessage('Something went wrong.', 'error');
        break;
    }
  }
  showMessage(messageText: string, iconType: SweetAlertIcon) {
    Swal.fire({
      position: 'center',
      icon: iconType,
      title: messageText,
      showConfirmButton: false,
      timer: 2500
    });
  }
  public getPayments() {
    this.billService.getPendingBills().subscribe({
      next: (v: any) => {
        v = v as Array<any>[];
        this.billsList = v.filter(
          (item: any) => item.status.name === 'Pending'
        );
      },
    });
  }
  setPaymentParams(data: any) {
    const paymentParams: NavigationExtras = {
      queryParams: data,
    };
    this.router.navigate(['/client/payments'], paymentParams);
  }
}
