import { Component } from "@angular/core"
import { FormsModule } from "@angular/forms"
import { MatButtonModule } from "@angular/material/button"
import { MatCardModule } from "@angular/material/card"
import { MatRadioModule } from "@angular/material/radio"
import { TablerIconsModule } from "angular-tabler-icons"
import { MaterialModule } from "src/app/material.module"

interface pricecards {
  id: number
  plan: string
  btnText: string
  popular?: boolean
}

@Component({
  selector: "app-pricing",
  imports: [TablerIconsModule, MatCardModule, MatButtonModule, MatRadioModule, MaterialModule, FormsModule],
  templateUrl: "./pricing.component.html",
  styleUrl: './pricing.component.scss'
})
export class AppPricingComponent {
  public selectedPaymentMethod = "card"

  onPaymentMethodChange(method: string) {
    this.selectedPaymentMethod = method
    console.log("Selected payment method:", method)
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

  constructor() {}
}
