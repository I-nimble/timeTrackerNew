import { Component, OnInit, inject } from '@angular/core';
import { NavigationExtras, Router } from '@angular/router';

import {
  PendingBill,
  PaymentsService,
} from 'src/app/services/payments.service';
import { environment } from 'src/environments/environment';
import Swal, { SweetAlertIcon } from 'sweetalert2';

declare const stripe: import('@stripe/stripe-js').Stripe;

@Component({
  selector: 'app-bills',
  templateUrl: './bills.component.html',
  styleUrls: ['./bills.component.scss'],
})
export class BillsComponent implements OnInit {
  private readonly billService = inject(PaymentsService);
  private readonly router = inject(Router);

  billsList: PendingBill[] = [];
  readonly assetsPath: string = environment.assets;

  ngOnInit(): void {
    this.getPayments();
    this.checkStatus();
  }

  async checkStatus(): Promise<void> {
    const clientSecret = new URLSearchParams(window.location.search).get(
      'payment_intent_client_secret',
    );

    if (!clientSecret) {
      return;
    }

    const { paymentIntent, error } =
      await stripe.retrievePaymentIntent(clientSecret);

    if (error || !paymentIntent) {
      this.showMessage('Something went wrong.', 'error');
      return;
    }

    switch (paymentIntent.status) {
      case 'succeeded':
        this.showMessage('Payment succeeded!', 'success');
        break;
      case 'processing':
        this.showMessage('Your payment is processing.', 'info');
        break;
      case 'requires_payment_method':
        this.showMessage(
          'Your payment was not successful, please try again.',
          'error',
        );
        break;
      default:
        this.showMessage('Something went wrong.', 'error');
        break;
    }
  }

  showMessage(messageText: string, iconType: SweetAlertIcon): void {
    Swal.fire({
      position: 'center',
      icon: iconType,
      title: messageText,
      showConfirmButton: false,
      timer: 2500,
    });
  }

  public getPayments(): void {
    this.billService.getPendingBills().subscribe({
      next: (bills) => {
        this.billsList = bills.filter((bill) => bill.status.name === 'Pending');
      },
    });
  }

  setPaymentParams(data: PendingBill): void {
    const paymentParams: NavigationExtras = {
      queryParams: data,
    };
    this.router.navigate(['/client/payments'], paymentParams);
  }
}
