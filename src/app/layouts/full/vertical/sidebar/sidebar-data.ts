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
    ...((Number(role) === 2 && allowedReportEmails.includes(email || ''))
      ? [{
          displayName: 'Reports',
          iconName: 'chart-bar',
          bgcolor: 'primary',
          route: '/dashboards/reports',
        }]
      : (Number(role) !== 2
        ? [{
            displayName: 'Reports',
            iconName: 'chart-bar',
            bgcolor: 'primary',
            route: '/dashboards/reports',
          }]
        : [])),
        ...(Number(role) !== 2 && Number(role) !== 4 ? [
        {
          displayName: 'Productivity',
          iconName: 'chart-bar',
          bgcolor: 'primary',
          route: '/dashboards/productivity',
        }] : []),
    ...(!isOrphan ? [
      {
        navCap: 'Apps',
      },
      {
        displayName: 'Chat',
        iconName: 'message-2',
        bgcolor: 'primary',
        route: '/apps/chat',
      },
      {
        displayName: 'Calendar',
        iconName: 'calendar-event',
        bgcolor: 'primary',
        route: '/apps/calendar',
      },
      {
        displayName: 'Kanban',
        iconName: 'checklist',
        bgcolor: 'primary',
        route: '/apps/kanban',
      },
      {
        displayName: 'Time tracker',
        iconName: 'brand-ctemplar',
        bgcolor: 'primary',
        route: 'apps/time-tracker',
      },
      {
        displayName: 'Notes',
        iconName: 'note',
        bgcolor: 'primary',
        route: '/apps/notes',
      },
      {
        displayName: 'To Do',
        iconName: 'edit',
        bgcolor: 'primary',
        route: '/apps/todo',
      },
      ...(Number(role) == 3 ? [{
        displayName: 'History',
        iconName: 'packages',
        bgcolor: 'primary',
        route: 'apps/history',
      }] : []),
    ] : []),
  ];
}

export const navItems: NavItem[] = getNavItems(Number(localStorage.getItem('role')));