import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  private planClickSubject = new Subject<void>();

  planClick$ = this.planClickSubject.asObservable();

  emitPlanClick() {
    this.planClickSubject.next();
  }
}