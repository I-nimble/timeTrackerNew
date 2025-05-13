import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { StripeService } from 'src/app/services/stripe.service';
import { Router, ActivatedRoute } from '@angular/router';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-stripe',
  templateUrl: './stripe.component.html',
  styleUrls: ['./stripe.component.scss'],
})
export class StripeComponent implements AfterViewInit {
  @ViewChild('cardInfo') cardInfo?: ElementRef;
  @ViewChild('emailElement') emailElement?: ElementRef;
  cardError: any;
  card: any;
  email: any;
  data: any;

  constructor(
    private stripeService: StripeService,
    private router: ActivatedRoute
  ) {}
  ngAfterViewInit(): void {
    this.router.queryParams.subscribe((params) => {
      this.data = params;
    });
    this.loadStripe();
  }
  onChange({ error }: any) {
    if (error) {
      this.cardError = error.message;
    } else {
      this.cardError = null;
    }
  }
  async loadStripe() {
    this.stripeService.charge(this.data).subscribe((next) => {
      const { clientSecret } = next;
      const appearance = {
        theme: 'night',
      };
      // this.data = {
      //   amount: 1000,
      //   description: 'payment',
      // };
      elements = stripe.elements({ clientSecret, appearance });

      this.card = elements.create('card');

      this.card.mount(this.cardInfo?.nativeElement);
      const emailAddress = '';
      const linkAuthenticationElement = elements.create('linkAuthentication');
      linkAuthenticationElement.mount('#link-authentication-element');
      // const userIdElement = elements.create('#userRef');
      
      // linkAuthenticationElement.attr('placeholder', 'Email address')

      linkAuthenticationElement.on('change', this.change.bind(this));

      const paymentElementOptions = {
        layout: 'tabs',
      };

      const paymentElement = elements.create('payment', paymentElementOptions);
      paymentElement.mount('#payment-element');
    });
    // }else{
    //   this.cardError = null
    // }
  }
  change($event: any) {
    const field = document.getElementById('Field-emailInput');
  }
  ngOnInit(): void {
    //     // This is a public sample test API key.
    // // Don’t submit any personally identifiable information in requests made with this key.
    // // Sign in to see your own test API key embedded in code samples.
    // // The items the customer wants to buy
  }
  // // ------- UI helpers -------

  // Show a spinner on payment submission
  setLoading(isLoading: boolean) {
    if (isLoading) {
      // Disable the button and show a spinner
      // document.querySelector("#submit")!.disabled = true;
      document.querySelector('#spinner')!.classList.remove('hidden');
      document.querySelector('#button-text')!.classList.add('hidden');
    } else {
      // document.querySelector("#submit")!.disabled = false;
      document.querySelector('#spinner')!.classList.add('hidden');
      document.querySelector('#button-text')!.classList.remove('hidden');
    }
  }
  async handleSubmit(e: Event) {
    e.preventDefault();
    this.setLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Make sure to change this to your payment completion page
        return_url: environment.url + '/client',
        receipt_email: 'crivas@i-nimble.com',
      },
    });
    // This point will only be reached if there is an immediate error when
    // confirming the payment. Otherwise, your customer will be redirected to
    // your `return_url`. For some payment methods like iDEAL, your customer will
    // be redirected to an intermediate site first to authorize the payment, then
    // redirected to the `return_url`.
    if (error.type === 'card_error' || error.type === 'validation_error') {
      this.showMessage(error.message);
    } else {
      this.showMessage('An unexpected error occurred.');
    }
    
    this.setLoading(false);
  }
  // // Fetches the payment intent status after payment submission
  showMessage(messageText: string) {
    const messageContainer = document.querySelector('#payment-message');

    messageContainer!.classList.remove('hidden');
    messageContainer!.textContent = messageText;

    setTimeout(function () {
      messageContainer!.classList.add('hidden');
      messageContainer!.textContent = '';
    }, 4000);
  }
}