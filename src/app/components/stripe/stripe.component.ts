import { Component, Input, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { StripeFactoryService } from './stripe-factory.service';
import { Stripe, StripeElements, StripePaymentElement, StripePaymentElementChangeEvent, PaymentIntent } from '@stripe/stripe-js';
import { MaterialModule } from 'src/app/material.module';
import { CommonModule } from '@angular/common';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StripeService } from 'src/app/services/stripe.service';
import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-stripe',
  templateUrl: './stripe.component.html',
  styleUrls: ['./stripe.component.scss'],
  imports: [MaterialModule, CommonModule, FormsModule, ReactiveFormsModule, TablerIconsModule],
})
export class StripeComponent implements OnInit, AfterViewInit, OnDestroy {
   @Input() amount: number = 0;
  @Input() invoiceId: string = ''; // ID de factura para asociar el pago
  
  paymentForm!: FormGroup;
  stripe: Stripe | null = null;
  elements: StripeElements | null = null;
  paymentElement: StripePaymentElement | null = null;
  isLoading = false;
  paymentStatus: 'initial' | 'processing' | 'succeeded' | 'failed' = 'initial';
  errorMessage: string | null = null;
  paymentIntent: PaymentIntent | null = null;
  clientSecret: string | null = null;
  paymentIntentId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private stripeFactory: StripeFactoryService,
    private snackBar: MatSnackBar,
    private stripeService: StripeService,
    private router: Router
  ) {}

 async ngOnInit() {
    this.paymentForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]]
    });

    this.stripe = await this.stripeFactory.getStripe();
  }

  async ngAfterViewInit() {
    if (!this.stripe) return;

    if (!this.clientSecret) {
    const response = await firstValueFrom(this.stripeService.createPaymentIntent({
      amount: this.amount,
      currency: 'usd',
      invoiceId: this.invoiceId,
    }));
    this.clientSecret = response.clientSecret;
  }
  
  if (typeof this.clientSecret !== 'string') return;

    const appearance = {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#6772e5',
      colorBackground: '#ffffff',
      colorText: '#32325d',
      colorDanger: '#df1b41',
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      spacingUnit: '2px',
      borderRadius: '4px'
    }
  };

  const options = {
    layout: {
      type: 'accordion',
      defaultCollapsed: false,
      radios: true,
      spacedAccordionItems: false
    }
  };

    this.elements = this.stripe.elements({
    clientSecret: this.clientSecret,
    appearance
  });
    this.paymentElement = (this.elements as any).create('payment', options);
    this.paymentElement?.mount('#payment-element');

    // Escuchar cambios en el elemento de pago
    this.paymentElement?.on('change', (event: any) => {
  if (event.error) {
    this.errorMessage = event.error.message;
  } else {
    this.errorMessage = null;
  }
});
  }

  ngOnDestroy() {
    if (this.paymentElement) {
      this.paymentElement.destroy();
    }
  }

  async handleSubmit() {
    if (!this.stripe || !this.elements) return;

    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.paymentStatus = 'processing';

    try {
      const { error } = await this.stripe.confirmPayment({
        elements: this.elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
          payment_method_data: {
            billing_details: {
              name: this.paymentForm.value.name,
              email: this.paymentForm.value.email
            }
          }
        },
        redirect: 'if_required'
      });

      if (error) {
        this.handlePaymentError(error);
      } else {
        await this.handlePaymentSuccess();
      }
    } catch (error: any) {
      this.handlePaymentError(error);
    } finally {
      this.isLoading = false;
    }

//     try {
//       // Crear Payment Intent en el backend
//       const { clientSecret } = await firstValueFrom(this.stripeService.createPaymentIntent({
//   amount: this.amount * 100,
//   currency: 'usd',
//   invoiceId: this.invoiceId,
// }));

//       // Confirmar el pago con Stripe
//      const { error, paymentIntent } = await this.stripe.confirmPayment({
//   elements: this.elements,
//   confirmParams: {
//     return_url: `${window.location.origin}/payment-success`,
//   }
// });

//       if (error) {
//         this.paymentStatus = 'failed';
//         this.errorMessage = error.message || 'Payment failed. Please try again.';
//         this.snackBar.open(this.errorMessage, 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
//       } else if (paymentIntent) {
//         this.paymentStatus = 'succeeded';
//         this.paymentIntent = paymentIntent;
//         this.snackBar.open('Payment succeeded!', 'Close', { duration: 5000, panelClass: ['success-snackbar'] });
//       }
//     } catch (error: any) {
//       this.paymentStatus = 'failed';
//       this.errorMessage = error.message || 'An unexpected error occurred.';
//       this.snackBar.open(this.errorMessage || 'Error', 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
//     } finally {
//       this.isLoading = false;
//     }
  }

  // Método para reintentar el pago
  retryPayment() {
    this.paymentStatus = 'initial';
    this.errorMessage = null;
  }

  private async handlePaymentSuccess() {
    // Verificar el estado del pago
    const paymentIntent = await this.stripe!.retrievePaymentIntent(this.clientSecret!);
    
    if (paymentIntent.paymentIntent?.status === 'succeeded') {
      this.paymentStatus = 'succeeded';
      this.snackBar.open('Payment succeeded!', 'Close', { 
        duration: 5000,
        panelClass: ['success-snackbar']
      });
      
      // Actualizar estado de la factura en el backend
      await this.stripeService.updateInvoiceStatus(this.invoiceId, 'paid');
    } else {
      this.paymentStatus = 'failed';
      this.errorMessage = 'Payment verification failed';
      this.snackBar.open(this.errorMessage, 'Close', { 
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    }
  }

  private handlePaymentError(error: any) {
    this.paymentStatus = 'failed';
    this.errorMessage = error.message || 'An unexpected error occurred';
    // this.snackBar.open(this.errorMessage, 'Close', { 
    //   duration: 5000,
    //   panelClass: ['error-snackbar']
    // });
  }

  viewInvoice() {
    this.router.navigate(['/invoices', this.invoiceId]);
  }
}