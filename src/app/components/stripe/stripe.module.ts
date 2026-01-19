import { NgModule } from '@angular/core';
import { StripeFactoryService } from './stripe-factory.service';

@NgModule({
  providers: [StripeFactoryService]
})
export class StripeModule {}