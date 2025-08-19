import { ViewportScroller, CommonModule } from "@angular/common"
import { Component, ViewChild, ElementRef } from "@angular/core"
import { FormsModule } from "@angular/forms"
import { MatButtonModule } from "@angular/material/button"
import { MatCardModule } from "@angular/material/card"
import { MatRadioModule } from "@angular/material/radio"
import { TablerIconsModule } from "angular-tabler-icons"
import { MaterialModule } from "src/app/material.module"
import { CoreService } from "src/app/services/core.service"
import { StripeComponent } from 'src/app/components/stripe/stripe.component';
import { ActivatedRoute } from '@angular/router';
import { BankTransferComponent } from "src/app/components/stripe/bank-transfer/bank-transfer.component"
import { PaymentModalComponent } from "src/app/components/payment-modal/payment-modal.component"
import { MatDialog } from '@angular/material/dialog';

interface pricecards {
  id: number
  plan: string
  btnText: string
  popular?: boolean
}

@Component({
  selector: "app-pricing-stripe",
  imports: [TablerIconsModule, MatCardModule, MatButtonModule, MatRadioModule, MaterialModule, FormsModule, StripeComponent, CommonModule, BankTransferComponent],
  templateUrl: "./pricing.component.html",
  styleUrl: './pricing.component.scss'
})
export class AppPricingStripeComponent {
  public selectedPaymentMethod = ""
  selectedInvoiceId: string | null = null;
  @ViewChild('paymentForm') paymentForm!: ElementRef;

  onPaymentMethodChange(method: string) {
    this.selectedPaymentMethod = method

    if (this.selectedPaymentMethod == 'card'){
      setTimeout(() => {
      if (this.paymentForm) {
        this.paymentForm.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 1000);
    } else {
      console.log(this.selectedPaymentMethod)
      this.dialog.open(PaymentModalComponent, {
      width: '350px'
    });
    }
  }

  getPaymentMethod(cardId: number): string {
    switch (cardId) {
      case 1:
        return "card"
      case 2:
        return "transfer"
      case 3:
        return "check"
      default:
        return "card"
    }
  }

  pricecards: pricecards[] = [
    {
      id: 1,
      plan: "Card",
      btnText: "Choose Card Payment",
    },
    {
      id: 2,
      plan: "Transfer",
      btnText: "Choose Transfer Payment",
      popular: true,
    },
    {
      id: 3,
      plan: "Check",
      btnText: "Choose Check Payment",
    },
  ]

  constructor(
    private settings: CoreService,
    private scroller: ViewportScroller,
    private route: ActivatedRoute,
    private dialog: MatDialog
  ) {
    this.route.queryParams.subscribe(params => {
      if (params['invoiceId']) {
        this.selectedInvoiceId = params['invoiceId'];
      }
    });
  }

  gotoDemos() {
    this.scroller.scrollToAnchor('demos');
  }

  apps: any[] = [
    {
      id: 1,
      img: '/assets/images/svgs/icon-dd-chat.svg',
      title: 'Chat Application',
      subtitle: 'Messages & Emails',
      link: '/apps/chat',
    },
    {
      id: 2,
      img: '/assets/images/svgs/icon-dd-cart.svg',
      title: 'Todo App',
      subtitle: 'New task',
      link: '/apps/todo',
    },
    {
      id: 3,
      img: '/assets/images/svgs/icon-dd-invoice.svg',
      title: 'Invoice App',
      subtitle: 'Get latest invoice',
      link: '/apps/invoice',
    },
    {
      id: 4,
      img: '/assets/images/svgs/icon-dd-date.svg',
      title: 'Calendar App',
      subtitle: 'Get Dates',
      link: '/apps/calendar',
    },
    {
      id: 5,
      img: '/assets/images/svgs/icon-dd-mobile.svg',
      title: 'Contact Application',
      subtitle: '2 Unsaved Contacts',
      link: '/apps/contacts',
    },
    {
      id: 6,
      img: '/assets/images/svgs/icon-dd-lifebuoy.svg',
      title: 'Tickets App',
      subtitle: 'Create new ticket',
      link: '/apps/tickets',
    },
    {
      id: 7,
      img: '/assets/images/svgs/icon-dd-message-box.svg',
      title: 'Email App',
      subtitle: 'Get new emails',
      link: '/apps/email/inbox',
    },
    {
      id: 8,
      img: '/assets/images/svgs/icon-dd-application.svg',
      title: 'Courses',
      subtitle: 'Create new course',
      link: '/apps/courses',
    },
  ];

  testimonials: any[] = [
    {
      id: 1,
      imgSrc: '/assets/images/profile/user-1.jpg',
      name: 'Jenny Wilson',
      subtext: 'Features avaibility',
    },
    {
      id: 2,
      imgSrc: '/assets/images/profile/user-2.jpg',
      name: 'Minshan Cui',
      subtext: 'Features avaibility',
    },
    {
      id: 3,
      imgSrc: '/assets/images/profile/user-3.jpg',
      name: 'Eminson Mendoza',
      subtext: 'Features avaibility',
    },
  ];

  features: any[] = [
    {
      id: 1,
      icon: 'wand',
      title: 'Expert recruitment services',
      color: 'primary',
      subtext:
        'Our team of HR professionals recruit the best talent worldwide while also making sure they are the perfect fit for your business.',
    },
    {
      id: 2,
      icon: 'shield-lock',
      title: 'HR integration and management',
      color: 'primary',
      subtext:
        'Once recruited, new team members are smoothly integrated into your remote team through our specialized management tools, focusing on performance, engagement, and collaboration. ',
    },
    {
      id: 3,
      icon: 'archive',
      title: 'Dedicated performance and IT support',
      color: 'primary',
      subtext: 'Our platform offers ongoing HR management and performance assistance, making sure your team stays productive and performs to the highest level.',
    },
    {
      id: 4,
      icon: 'chart-pie',
      title: 'Integrate tools for remote work',
      color: 'primary',
      subtext: 'At inimble we have custom-made all-in-one management tools specifically made for remote team management, including communication, project tracking, and culture building.',
    },
    // {
    //   id: 5,
    //   icon: 'tag',
    //   title: 'Material ',
    //   color: 'success',
    //   subtext: 'Its been made with Material and full responsive layout.',
    // },
    // {
    //   id: 9,
    //   icon: 'adjustments',
    //   title: 'Lots of Chart Options',
    //   color: 'error',
    //   subtext: 'You name it and we have it, Yes lots of variations for Charts.',
    // },
    // {
    //   id: 7,
    //   icon: 'language-katakana',
    //   title: 'i18 Angular',
    //   color: 'secondary',
    //   subtext: 'i18 is a powerful internationalization framework.',
    // },
    // {
    //   id: 13,
    //   icon: 'calendar',
    //   title: 'Calendar Design',
    //   color: 'warning',
    //   subtext: 'Calendar is available with our package & in nice design.',
    // },

    // {
    //   id: 6,
    //   icon: 'diamond',
    //   title: '3400+ Font Icons',
    //   color: 'primary',
    //   subtext: 'Lots of Icon Fonts are included here in the package of Admin.',
    // },
    // {
    //   id: 11,
    //   icon: 'refresh',
    //   title: 'Regular Updates',
    //   color: 'primary',
    //   subtext: 'We are constantly updating our pack with new features..',
    // },
    // {
    //   id: 8,
    //   icon: 'arrows-shuffle',
    //   title: 'Easy to Customize',
    //   color: 'secondary',
    //   subtext: 'Customization will be easy as we understand your pain.',
    // },
    // {
    //   id: 10,
    //   icon: 'layers-intersect',
    //   title: 'Lots of Table Examples',
    //   color: 'success',
    //   subtext: 'Tables are initial requirement and we added them.',
    // },
    // {
    //   id: 14,
    //   icon: 'messages',
    //   title: 'Dedicated Support',
    //   color: 'error',
    //   subtext: 'We believe in supreme support is key and we offer that.',
    // },
    // {
    //   id: 12,
    //   icon: 'book',
    //   title: 'Detailed Documentation',
    //   color: 'warning',
    //   subtext: 'Our Detailed Documentation Ensures Ease of Use',
    // },
  ];

  quicklinks: any[] = [
    {
      id: 1,
      title: 'Pricing Page',
      link: '/theme-pages/pricing',
    },
    {
      id: 2,
      title: 'Authentication Design',
      link: '/authentication/side-login',
    },
    {
      id: 3,
      title: 'Register Now',
      link: '/authentication/side-register',
    },
    {
      id: 4,
      title: '404 Error Page',
      link: '/authentication/error',
    },
    {
      id: 5,
      title: 'Notes App',
      link: '/apps/notes',
    },
    {
      id: 6,
      title: 'Employee App',
      link: '/apps/employee',
    },
    {
      id: 7,
      title: 'Todo Application',
      link: '/apps/todo',
    },
    {
      id: 8,
      title: 'Treeview',
      link: '/theme-pages/treeview',
    },
  ];
}
