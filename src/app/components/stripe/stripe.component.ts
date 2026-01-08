import { Component, Input, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { StripeFactoryService } from './stripe-factory.service';
import { Stripe, StripeElements, StripePaymentElement } from '@stripe/stripe-js';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StripeService } from 'src/app/services/stripe.service';
import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';
import { CommonModule } from '@angular/common';
import { TablerIconsModule } from 'angular-tabler-icons';
import { trigger, style, animate, transition } from '@angular/animations';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { CustomSearchService } from 'src/app/services/custom-search.service';

@Component({
  selector: 'app-stripe',
  templateUrl: './stripe.component.html',
  styleUrls: ['./stripe.component.scss'],
  imports: [
    MaterialModule, 
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule, 
    TablerIconsModule,
    MatSlideToggleModule
  ],
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ]
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
  clientInfo: any = null;
  useClientInfoControl = new FormControl(true);
  isClientInfoLoading = false;

  constructor(
    private fb: FormBuilder,
    private stripeFactory: StripeFactoryService,
    private snackBar: MatSnackBar,
    private stripeService: StripeService,
    private router: Router,
    private customSearchService: CustomSearchService
  ) {}

  async ngOnInit() {
    this.paymentForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
    });
    this.useClientInfoControl.valueChanges.subscribe(useInfo => {
      this.onToggleClientInfo(useInfo || false);
    });

    // Initialize Stripe
    this.stripe = await this.stripeFactory.getStripe();
    
    await this.loadClientInfo();
    
    // Create PaymentIntent
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

  async loadClientInfo(): Promise<void> {
    this.isClientInfoLoading = true;
    try {
      const userId = localStorage.getItem('id');
      
      if (!userId) {
        console.warn('User ID not found in localStorage');
        return;
      }

      const response = await firstValueFrom(
        this.customSearchService.getClientInfo(userId)
      );
      
      if (response.success) {
        this.clientInfo = response.data;
        if (this.useClientInfoControl.value) {
          this.populateFormWithClientInfo();
        }
      } else {
        console.warn('Failed to load client info:', response);
      }
    } catch (error) {
      console.error('Error loading client info:', error);
    } finally {
      this.isClientInfoLoading = false;
    }
  }

  populateFormWithClientInfo() {
    if (this.clientInfo) {
      this.paymentForm.patchValue({
        name: this.clientInfo.contact_person || '',
        email: this.clientInfo.email || '',
      });
    }
  }

  clearFormInfo() {
    this.paymentForm.patchValue({
      name: '',
      email: '',
      phone: ''
    });
    
    this.paymentForm.get('name')?.enable();
    this.paymentForm.get('email')?.enable();
    this.paymentForm.get('phone')?.enable();
  }

  onToggleClientInfo(useInfo: boolean) {    
    if (useInfo && this.clientInfo) {
      this.populateFormWithClientInfo();
    } else {
      this.clearFormInfo();
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
    // Create Stripe elements
    this.elements = this.stripe.elements({
      clientSecret: this.clientSecret,
      appearance
    });

    this.paymentElement = (this.elements as any).create('payment', options);
    this.paymentElement?.mount(this.paymentElementContainer.nativeElement);

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

    if (this.paymentForm.disabled) {
      this.paymentForm.enable();
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
    if (!this.invoiceId) {
      this.snackBar.open('Invoice ID not available', 'Close', { duration: 3000 });
      return;
    }

    this.stripeService.getPaymentByInvoiceId(this.invoiceId).subscribe({
      next: ({ paymentId }) => {
        this.stripeService.getReceiptUrl(paymentId).subscribe({
          next: ({ receiptUrl }) => {
            window.open(receiptUrl, '_blank');
          },
          error: () => {
            this.snackBar.open('Failed to load receipt URL', 'Close', { duration: 3000 });
          }
        });
      },
      error: () => {
        this.snackBar.open('No payment found for this invoice', 'Close', { duration: 3000 });
      }
    });
  }

  newPayment() {
    this.router.navigate(['/apps/invoice']);
  }
}