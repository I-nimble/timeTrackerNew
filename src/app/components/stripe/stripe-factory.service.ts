import { Injectable } from '@angular/core';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StripeFactoryService {
  private stripePromise: Promise<Stripe | null>;

  constructor() {
    this.stripePromise = loadStripe(environment.stripePublicKey);
  }

  async getStripe(): Promise<Stripe | null> {
    return this.stripePromise;
  }
}