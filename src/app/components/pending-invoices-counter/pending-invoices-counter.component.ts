import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { SharedModule } from '../shared.module';

@Component({
  selector: 'app-pending-invoices-counter',
  standalone: true,
  imports: [ SharedModule ],
  templateUrl: './pending-invoices-counter.component.html',
  styleUrl: './pending-invoices-counter.component.scss'
})
export class PendingInvoicesCounter implements OnInit {
  @Input() pending?: any = [];
  pendingCount: number = 0

  constructor() { }
  
  ngOnInit(): void {
    this.updateCount()
  }
  
  ngOnChanges(changes: SimpleChanges) {
    if (changes['pending']) {
      this.updateCount()
    }
  }
  updateCount() {
    if (this.pending) {
      this.pendingCount = this.pending.length;
    }
  }
}