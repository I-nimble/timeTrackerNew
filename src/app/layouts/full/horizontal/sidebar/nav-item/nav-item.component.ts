import { Component, OnInit, Input } from '@angular/core';
import { Router } from '@angular/router';
import { NavService } from '../../../../../services/nav.service';
import { TablerIconsModule } from 'angular-tabler-icons';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TourMatMenuModule } from 'ngx-ui-tour-md-menu';

@Component({
  selector: 'app-horizontal-nav-item',
  imports: [TablerIconsModule, CommonModule, MatIconModule, TourMatMenuModule],
  templateUrl: './nav-item.component.html',
})
export class AppHorizontalNavItemComponent implements OnInit {
  @Input() depth: any;
  @Input() item: any;

  constructor(public navService: NavService, public router: Router) {
    if (this.depth === undefined) {
      this.depth = 0;
    }
  }

  ngOnInit() {}

  getTourAnchor(item: any): string | null {
    if (!item || item.navCap || !item.route) return null;
    const rawRoute = String(item.route);
    const normalizedRoute = rawRoute.startsWith('/') ? rawRoute : `/${rawRoute}`;

    switch (normalizedRoute) {
      case '/dashboards/reports':
        return 'side-reports';
      case '/dashboards/productivity':
        return 'side-productivity';
      case '/apps/chat':
        return 'side-chat';
      case '/apps/kanban':
        return 'side-kanban';
      case '/apps/time-tracker':
        return 'side-time-tracker';
      case '/apps/notes':
        return 'side-notes';
      case '/apps/todo':
        return 'side-todo';
      case '/apps/history':
        return 'side-history';
      case '/apps/calendar':
        return 'side-calendar';
      default:
        return null;
    }
  }
  onItemSelected(item: any) {
    if (!item.children || !item.children.length) {
      this.router.navigate([item.route]);
    }
  }
}
