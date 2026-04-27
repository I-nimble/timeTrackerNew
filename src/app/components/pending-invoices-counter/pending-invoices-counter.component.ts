import {
  Component,
  Input,
  OnInit,
  SimpleChanges,
  OnChanges,
} from '@angular/core';

import { SharedModule } from '../legacy/shared.module';

@Component({
  selector: 'app-pending-invoices-counter',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './pending-invoices-counter.component.html',
  styleUrl: './pending-invoices-counter.component.scss',
})
export class PendingInvoicesCounter implements OnInit, OnChanges {
  @Input() pending?: any = [];
  pendingCount = 0;

  constructor() {}

  ngOnInit(): void {
    this.updateCount();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['pending']) {
      this.updateCount();
    }
  }
  updateCount() {
    if (this.pending) {
      this.pendingCount = this.pending.length;
    }
  }
}
