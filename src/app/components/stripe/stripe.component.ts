import { Component, Input, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { StripeFactoryService } from './stripe-factory.service';
import { Stripe, StripeElements, StripeCardElement } from '@stripe/stripe-js';
import { MaterialModule } from 'src/app/material.module';
import { CommonModule } from '@angular/common';
import { TablerIconsModule } from 'angular-tabler-icons';

@Component({
  selector: 'app-stripe',
  templateUrl: './stripe.component.html',
  styleUrls: ['./stripe.component.scss'],
  imports: [MaterialModule, CommonModule, FormsModule, ReactiveFormsModule, TablerIconsModule],
})
export class StripeComponent implements OnInit {
  @Input() amount: number = 0; // Recibe el monto a pagar
  paymentForm!: FormGroup;
  stripe: Stripe | null = null;
  elements: StripeElements | null = null;
  cardElement: StripeCardElement | null = null;
  cardError: string | null = null;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private stripeFactory: StripeFactoryService
  ) {}

  async ngOnInit() {
    this.paymentForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]]
    });

    this.stripe = await this.stripeFactory.getStripe();
    if (this.stripe) {
      this.elements = this.stripe.elements();
      this.cardElement = this.elements.create('card', {
        style: {
          base: {
            fontSize: '16px',
            color: '#32325d',
            '::placeholder': {
              color: '#aab7c4'
            },
            fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
          },
          invalid: {
            color: '#fa755a',
            iconColor: '#fa755a'
          }
        }
      });
    }
  }

  ngAfterViewInit() {
    if (this.cardElement) {
      this.cardElement.mount('#card-element');
      this.cardElement.on('change', (event) => {
        this.cardError = event.error ? event.error.message : null;
      });
    }
  }

  async handleSubmit() {
    if (!this.stripe || !this.elements || !this.cardElement) {
      return;
    }

    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    const { paymentMethod, error } = await this.stripe.createPaymentMethod({
      type: 'card',
      card: this.cardElement,
      billing_details: {
        name: this.paymentForm.value.name,
        email: this.paymentForm.value.email
      }
    });

    this.isLoading = false;

    if (error) {
      this.cardError = error.message || 'Error processing payment';
      return;
    }

    console.log('PaymentMethod:', paymentMethod);
    // Aquí llamarías a tu backend para procesar el pago
    // this.processPayment(paymentMethod.id);
  }
}