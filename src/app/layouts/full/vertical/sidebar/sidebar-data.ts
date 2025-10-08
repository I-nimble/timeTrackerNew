import { NavItem } from './nav-item/nav-item';
import { environment } from 'src/environments/environment';

export function getNavItems(role: number): NavItem[] {
  const isOrphan = localStorage.getItem('isOrphan') == 'true';
  const email = localStorage.getItem('email');
  const allowedReportEmails = environment.allowedReportEmails;
  return [
    {
      navCap: 'Home',
    },
    {
      displayName: 'Dashboard',
      iconName: 'layout-dashboard',
      bgcolor: 'primary',
      route:
        Number(role) === 1
          ? '/dashboards/admin'
          : Number(role) === 2
            ? '/dashboards/tm'
            : '/dashboards/dashboard2'
    },
    ...(!isOrphan || isOrphan ? [
      {
        navCap: 'Apps',
      },
      ...(!isOrphan ? [
      {
        displayName: 'Chat',
        iconName: 'message-2',
        bgcolor: 'primary',
        route: '/apps/chat',
      },
      ...(Number(role) == 3 ? [{
        displayName: 'History',
        iconName: 'packages',
        bgcolor: 'primary',
        route: 'apps/history',
      }] : []),
    ] : []),
      {
        displayName: 'Calendar',
        iconName: 'calendar-event',
        bgcolor: 'primary',
        route: '/apps/calendar',
      }
    ] : []),
  ];
}

export const navItems: NavItem[] = getNavItems(Number(localStorage.getItem('role')));