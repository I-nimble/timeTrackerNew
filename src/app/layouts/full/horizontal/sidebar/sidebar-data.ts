import { NavItem } from '../../vertical/sidebar/nav-item/nav-item';

function getNavItems(): NavItem[] {
  const isOrphan = localStorage.getItem('isOrphan') == 'true';
  return [
    {
      navCap: 'Home',
    },
    {
      displayName: 'Dashboards',
      iconName: 'home',
      route: 'dashboards',
      bgcolor: 'primary',
      children: [
        {
          displayName: 'Dashboard 1',
          iconName: 'point',
          route: 'dashboards/dashboard1',
        },
        {
          displayName: 'Dashboard 2',
          iconName: 'point',
          route: 'dashboards/dashboard2',
        },
      ],
    },
    ...(!isOrphan ? [
      {
        displayName: 'Apps',
        iconName: 'apps',
        route: 'apps',
        bgcolor: 'secondary',
        ddType: '',
        children: [
          {
            displayName: 'Chat',
            iconName: 'point',
            route: 'apps/chat',
          },
          {
            displayName: 'Calendar',
            iconName: 'point',
            route: 'apps/calendar',
          },
        ],
      },
    ] : []),
  ];
}

export const navItems: NavItem[] = getNavItems();
