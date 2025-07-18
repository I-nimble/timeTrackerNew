import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { BrandingComponent } from './branding.component';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MaterialModule } from 'src/app/material.module';
import { NavItem } from './nav-item/nav-item';
import { getNavItems } from './sidebar-data';

@Component({
  standalone: true,
  selector: 'app-sidebar',
  imports: [BrandingComponent, TablerIconsModule, MaterialModule],
  templateUrl: './sidebar.component.html'
})
export class SidebarComponent implements OnInit {
  constructor() { }
  @Input() showToggle = true;
  @Input() collapsed = false;
  @Output() toggleMobileNav = new EventEmitter<void>();
  @Output() toggleCollapsed = new EventEmitter<void>();
  navItems: NavItem[] = [];
  
  ngOnInit(): void {
    const role = Number(localStorage.getItem('role'));
    this.navItems = getNavItems(role);
  }
}