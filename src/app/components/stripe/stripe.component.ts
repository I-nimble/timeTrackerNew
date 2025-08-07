import { Component, Input, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { StripeFactoryService } from './stripe-factory.service';
import { Stripe, StripeElements, StripePaymentElement } from '@stripe/stripe-js';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StripeService } from 'src/app/services/stripe.service';
import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';
import { CommonModule } from '@angular/common';
import { TablerIconsModule } from 'angular-tabler-icons';

@Component({
  selector: 'app-stripe',
  templateUrl: './stripe.component.html',
  styleUrls: ['./stripe.component.scss'],
  imports: [MaterialModule, CommonModule, FormsModule, ReactiveFormsModule, TablerIconsModule],
})
export class StripeComponent implements OnInit, OnDestroy {
  @Input() invoiceId: string = '';
  @ViewChild('paymentElementContainer') paymentElementContainer!: ElementRef;
  amount: number = 0;

  paymentForm!: FormGroup;
  stripe: Stripe | null = null;
  elements: StripeElements | null = null;
  paymentElement: StripePaymentElement | null = null;
  isLoading = false;
  paymentStatus: 'initial' | 'processing' | 'succeeded' | 'failed' = 'initial';
  errorMessage: string | null = null;
  clientSecret: string | null = null;

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

    // Inicializar Stripe
    this.stripe = await this.stripeFactory.getStripe();
    
    // Crear PaymentIntent
    try {
      const response = await firstValueFrom(
        this.stripeService.createPaymentIntent(this.invoiceId)
      );
      this.clientSecret = response.clientSecret;
      this.amount = response.amount;

      await this.initializeStripeElements();
    } catch (error) {
      console.error('Error creating PaymentIntent:', error);
      this.errorMessage = 'Failed to initialize payment. Please try again.';
    }
  }

  async initializeStripeElements() {
    if (!this.stripe || !this.clientSecret) return;

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
      },
    };

    // Crear elementos de Stripe
    this.elements = this.stripe.elements({
      clientSecret: this.clientSecret,
      appearance
    });

    // Crear y montar el elemento de pago
    this.paymentElement = (this.elements as any).create('payment', options);
    this.paymentElement?.mount(this.paymentElementContainer.nativeElement);

    // Escuchar cambios en el elemento de pago
    this.paymentElement?.on('change', (event: any) => {
      this.errorMessage = event.error?.message || null;
    });
  }

  ngOnDestroy() {
    if (this.paymentElement) {
      this.paymentElement.destroy();
    }
  }

  async handleSubmit() {
    if (!this.stripe || !this.elements || !this.clientSecret) {
      return;
    }

    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.paymentStatus = 'processing';

    try {
      const { error, paymentIntent } = await this.stripe.confirmPayment({
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
        throw error;
      }

      // Verificar el estado del pago
      if (paymentIntent?.status === 'succeeded') {
        this.paymentStatus = 'succeeded';
        this.snackBar.open('Payment succeeded!', 'Close', {
          duration: 5000,
          panelClass: ['success-snackbar']
        });
      } else {
        throw new Error('Payment not completed');
      }
    } catch (error: any) {
      this.paymentStatus = 'failed';
      this.errorMessage = error.message || 'An unexpected error occurred.';
      this.snackBar.open(this.errorMessage ?? 'An unexpected error occurred.', 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    } finally {
      this.isLoading = false;
    }
  }

  retryPayment() {
    this.paymentStatus = 'initial';
    this.errorMessage = null;
    window.location.reload(); 
  }

  viewInvoice() {
    this.router.navigate(['/apps/viewInvoice', this.invoiceId]);
  }
  
  newPayment() {
    this.router.navigate(['/apps/invoice']);
  }
}