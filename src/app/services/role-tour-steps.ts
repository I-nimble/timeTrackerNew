import { IStepOption } from 'ngx-ui-tour-md-menu';

export type RoleTourStep = IStepOption & { anchorId: string; route?: string };

export interface SectionConfig {
  key: string;
  routes: string[];
  steps: RoleTourStep[];
}

const isMobile = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.innerWidth < 768;
};

export const buildClientSections = (baseStep: Partial<RoleTourStep>): SectionConfig[] => {
  const withBase = (step: RoleTourStep): RoleTourStep => ({
    ...baseStep,
    ...step,
  });

  let talentMatchSteps = [
    withBase({
      anchorId: 'tm-custom-search',
      title: 'Find talent fast',
      content: 'Start with a guided or custom search for your first role.',
      route: '/apps/talent-match',
    }),
    withBase({
      anchorId: 'tm-main-filters',
      title: 'Filter candidates',
      content: 'Select the role and practice area to refine matches.',
      route: '/apps/talent-match',
    }),
    withBase({
      anchorId: 'tm-budget',
      title: 'Adjust the budget',
      content: 'Set the rate range and type for candidates.',
      route: '/apps/talent-match',
    }),
    withBase({
      anchorId: 'tm-advanced',
      title: 'Advanced filters',
      content: 'Filter by skills, tools, background, and trainings.',
      route: '/apps/talent-match',
    }),
    withBase({
      anchorId: 'tm-ai-box',
      title: 'AI-powered search',
      content: 'Describe the role and let AI rank the best candidates.',
      route: '/apps/talent-match',
    }),
    withBase({
      anchorId: 'tm-results',
      title: 'Results and selection',
      content: 'Review the table, select candidates, and compare profiles.',
      route: '/apps/talent-match',
      placement: {
        horizontal: false,
        xPosition: 'before',
        yPosition: 'above'
      } as const,
    }),
  ];

  if (!isMobile()) talentMatchSteps.push(
    withBase({
      anchorId: 'tm-actions',
      title: 'Quick actions',
      content: 'Schedule interviews, download resumes, or mark not interested.',
      route: '/apps/talent-match',
    }),
  );

  let dashboardSteps = [
    withBase({
      anchorId: 'dash-welcome',
      title: 'Updates',
      content: 'See upcoming events and key team notifications here.',
      route: '/dashboards/dashboard2',
      placement: {
        yPosition: 'above',
        xPosition: 'after',
        horizontal: isMobile() ? false : true,
      } as const,
    }),
    withBase({
      anchorId: 'dash-kpis',
      title: 'Daily KPIs',
      content: 'Tasks, hours, and performance at a glance.',
      route: '/dashboards/dashboard2',
      placement: {
        yPosition: 'above',
        xPosition: 'before',
        horizontal: isMobile() ? false : true,
      } as const,
    }),
    withBase({
      anchorId: 'dash-activity',
      title: 'Activity and hours',
      content: 'Distribution of today worked vs remaining hours.',
      route: '/dashboards/dashboard2',
      placement: {
        yPosition: 'above',
        xPosition: 'after',
        horizontal: isMobile() ? false : true,
      } as const,
    }),
    withBase({
      anchorId: 'dash-team',
      title: 'My team',
      content: 'Track your team status and time trackers.',
      route: '/dashboards/dashboard2',
      placement: {
        yPosition: 'above',
        xPosition: 'before',
        horizontal: isMobile() ? false : true,
      } as const,
    }),
    withBase({
      anchorId: 'dash-productivity',
      title: 'Productivity',
      content: 'Progress by status and quick access to Kanban.',
      route: '/dashboards/dashboard2',
      placement: {
        yPosition: 'above',
        xPosition: 'after',
        horizontal: isMobile() ? false : true,
      } as const,
    }),
    withBase({
      anchorId: 'dash-geofencing',
      title: 'Geofencing',
      content: 'Find your team locations over the world.',
      route: '/dashboards/dashboard2',
      placement: {
        yPosition: 'above',
        xPosition: 'before',
        horizontal: isMobile() ? false : true,
      } as const,
    }),
    withBase({
      anchorId: 'dash-schedule',
      title: 'Week overview',
      content: 'View weekly worked hours.',
      route: '/dashboards/dashboard2',
      placement: {
        yPosition: 'above',
        xPosition: 'after',
        horizontal: isMobile() ? false : true,
      } as const,
    }),
  ];

  let reportsSteps : RoleTourStep[] = [];
  if (!isMobile()) {
    reportsSteps = [
      withBase({
        anchorId: 'side-reports',
        title: 'Reports',
        content: 'Open activity and team reports from the sidebar.',
        route: '/dashboards/reports',
        placement: {
          yPosition: 'below',
          xPosition: 'after',
          horizontal: true,
        } as const,
      }),
    ];
  }
  reportsSteps.push(...[
    withBase({
      anchorId: 'reports-chart',
      title: 'Team productivity',
      content: 'Compare worked and pending hours over time here.',
      route: '/dashboards/reports',
      placement: {
        yPosition: 'below',
        xPosition: 'after',
        horizontal: true,
      } as const,
    }),
    withBase({
      anchorId: 'reports-tm-selector',
      title: 'Select team members',
      content: 'Select a team member to view their productivity.',
      route: '/dashboards/reports',
    }),
    withBase({
      anchorId: 'reports-date-range',
      title: 'Select date range',
      content: 'Select a date range to view employee productivity.',
      route: '/dashboards/reports',
    }),
    withBase({
      anchorId: 'reports-download',
      title: 'Download reports',
      content: 'Download reports for selected team members as pdf or excel.',
      route: '/dashboards/reports',
      placement: {
        yPosition: 'below',
        horizontal: isMobile() ? false : true,
      } as const,
    }),
    withBase({
      anchorId: 'reports-employees',
      title: 'Team productivity',
      content: 'Check employee status and completed tasks here.',
      route: '/dashboards/reports',
      placement: {
        yPosition: 'above',
        horizontal: isMobile() ? false : true,
      } as const,
    }),
  ]);

  const productivitySteps = [
    withBase({
      anchorId: 'side-productivity',
      title: 'Productivity',
      content: 'Use this section to track team productivity.',
      route: '/dashboards/productivity',
      placement: {
        yPosition: 'below',
        xPosition: 'after',
        horizontal: true,
      } as const,
    }),
    withBase({
      anchorId: 'productivity-chart',
      title: 'Productivity chart',
      content: 'See team performance summary.',
      route: '/dashboards/productivity',
      placement: {
        yPosition: 'below',
        xPosition: 'after',
        horizontal: true,
      } as const,
    }),
    withBase({
      anchorId: 'productivity-employees',
      title: 'Team productivity',
      content: 'Check employee completed tasks here.',
      route: '/dashboards/productivity',
      placement: {
        yPosition: 'below',
        xPosition: 'before',
        horizontal: true,
      } as const,
    }),
  ];

  const chatSteps = [
    withBase({
      anchorId: 'side-chat',
      title: 'Chat',
      content: 'Open team conversations from the sidebar.',
      route: '/apps/chat',
      placement: {
        yPosition: 'below',
        xPosition: 'after',
        horizontal: true,
      } as const,
    }),
    withBase({
      anchorId: 'chat-start-conversation',
      title: 'Start a conversation',
      content: 'Start a new conversation with your team members or Inimble support.',
      route: '/apps/chat',
    }),
    withBase({
      anchorId: 'chat-search',
      title: 'Search conversations',
      content: 'Search for team members or conversations here.',
      route: '/apps/chat',
    }),
    withBase({
      anchorId: 'chat-contacts',
      title: 'Conversations',
      content: 'View and manage your existing conversations here.',
      route: '/apps/chat',
      placement: {
        yPosition: 'below',
        xPosition: 'after',
        horizontal: true,
      } as const,
    }),
  ];

  const kanbanSteps = [
    withBase({
      anchorId: 'side-kanban',
      title: 'Kanban',
      content: 'Open your Kanban boards from the sidebar.',
      route: '/apps/kanban',
      placement: {
        yPosition: 'below',
        xPosition: 'after',
        horizontal: true,
      } as const,
    }),
    withBase({
      anchorId: 'kanban-boards',
      title: 'Boards',
      content: 'Manage your boards and tasks from this view.',
      route: '/apps/kanban',
      placement: {
        yPosition: 'below',
        xPosition: 'before',
        horizontal: true,
      } as const,
    }),
    withBase({
      anchorId: 'kanban-new-board',
      title: 'New board',
      content: 'Create a new board and start tracking your tasks here.',
      route: '/apps/kanban',
      placement: {
        yPosition: 'below',
        xPosition: 'before',
        horizontal: true,
      } as const,
    }),
  ];

  const timeTrackerSteps = [
    withBase({
      anchorId: 'side-time-tracker',
      title: 'Time tracker',
      content: 'Track team time entries from the sidebar.',
      route: '/apps/time-tracker',
      placement: {
        yPosition: 'below',
        xPosition: 'after',
        horizontal: true,
      } as const,
    }),
    withBase({
      anchorId: 'employee-search',
      title: 'Search Team Members',
      content: 'Search your team members by name.',
      route: '/apps/time-tracker',
      placement: {
        yPosition: 'below',
        xPosition: 'after',
        horizontal: true,
      } as const,
    }),
    withBase({
      anchorId: 'employee-add',
      title: 'Add Team Member',
      content: 'Invite new team members to your team.',
      route: '/apps/time-tracker',
      placement: {
        yPosition: 'below',
        xPosition: 'before',
        horizontal: true,
      } as const,
    }),
    withBase({
      anchorId: 'employee-table',
      title: 'Team Members',
      content: 'Review team members, schedules, and reports here.',
      route: '/apps/time-tracker',
      placement: {
        yPosition: 'below',
        xPosition: 'before',
        horizontal: true,
      } as const,
    }),
  ];

  const notesSteps = [
    withBase({
      anchorId: 'side-notes',
      title: 'Notes',
      content: 'Open notes from the sidebar.',
      route: '/apps/notes',
      placement: {
        yPosition: 'below',
        xPosition: 'after',
        horizontal: true,
      } as const,
    }),
    withBase({
      anchorId: 'notes-list',
      title: 'Notes workspace',
      content: 'Capture and organize your notes here.',
      route: '/apps/notes',
      placement: {
        yPosition: 'below',
        xPosition: 'after',
        horizontal: true,
      } as const,
    }),
    withBase({
      anchorId: 'add-note',
      title: 'Add a new note',
      content: 'Add a new note to your notes list.',
      route: '/apps/notes',
      placement: {
        yPosition: 'above',
        xPosition: 'before',
        horizontal: true,
      } as const,
    }),
  ];

  const toDoSteps = [
    withBase({
      anchorId: 'side-todo',
      title: 'To Do',
      content: 'Manage tasks from the sidebar.',
      route: '/apps/todo',
      placement: {
        yPosition: 'below',
        xPosition: 'after',
        horizontal: true,
      } as const,
    }),
    withBase({
      anchorId: 'todo-filter',
      title: 'Filter tasks',
      content: 'Filter tasks by team member or date.',
      route: '/apps/todo',
    }),
    withBase({
      anchorId: 'todo-categories',
      title: 'Task categories',
      content: 'View tasks by category: All, To do, or Completed.',
      route: '/apps/todo',
      placement: {
        yPosition: 'below',
        xPosition: 'after',
        horizontal: true,
      } as const,
    }),
    withBase({
      anchorId: 'todo-create-edit-task',
      title: 'Create/Edit Task',
      content: 'Create a new task or edit an existing one here.',
      route: '/apps/todo',
      placement: {
        yPosition: 'below',
        xPosition: 'after',
        horizontal: true,
      } as const,
    }),
    withBase({
      anchorId: 'todo-list',
      title: 'Task list',
      content: 'Review and update tasks for your team here.',
      route: '/apps/todo',
      placement: {
        yPosition: 'below',
        xPosition: 'before',
        horizontal: true,
      } as const,
    }),
  ];

  const historySteps = [
    withBase({
      anchorId: 'side-history',
      title: 'History',
      content: 'Open your history view from the sidebar.',
      route: '/apps/history',
      placement: {
        yPosition: 'below',
        xPosition: 'after',
        horizontal: true,
      } as const,
    }),
    withBase({
      anchorId: 'history-filter',
      title: 'Filter history',
      content: 'Filter historic data by team member or date.',
      route: '/apps/history',
    }),
    withBase({
      anchorId: 'history-list',
      title: 'History list',
      content: 'Review notifications and team updates here.',
      route: '/apps/history',
    }),
  ];

  const calendarSteps = [
    withBase({
      anchorId: 'side-calendar',
      title: 'Calendar',
      content: 'Open your calendar from the sidebar.',
      route: '/apps/calendar',
      placement: {
        yPosition: 'below',
        xPosition: 'after',
        horizontal: true,
      } as const,
    }),
    withBase({
      anchorId: 'calendar-filter',
      title: 'Filter calendar',
      content: 'Select a team member or priority to filter tasks.',
      route: '/apps/calendar',
    }),
    withBase({
      anchorId: 'calendar-overview',
      title: 'Calendar overview',
      content: 'Switch between month, week, and day views here.',
      route: '/apps/calendar',
      placement: {
        yPosition: 'below',
        xPosition: 'before',
        horizontal: true,
      } as const,
    }),
  ];

  const profileMenuSteps = [
    withBase({
      anchorId: 'profile-menu-trigger',
      title: 'Profile menu',
      content: 'Open your user menu to access account tools.',
      route: '/dashboards/dashboard2',
      delayBeforeStepShow: 200,
      placement: {
        yPosition: 'below',
        xPosition: 'after',
        horizontal: false,
      } as const,
      showArrow: isMobile() ? false : true,
    }),
    withBase({
      anchorId: 'profile-my-profile',
      title: 'My Profile',
      content: 'Review and update your account settings here.',
      route: '/dashboards/dashboard2',
      placement: {
        yPosition: 'below',
        xPosition: 'before',
        horizontal: true,
      } as const,
    }),
    withBase({
      anchorId: 'profile-my-inbox',
      title: 'My Inbox',
      content: 'Check your notifications and messages here.',
      route: '/dashboards/dashboard2',
      placement: {
        yPosition: 'below',
        xPosition: 'before',
        horizontal: true,
      } as const,
    }),
    withBase({
      anchorId: 'profile-my-team',
      title: 'My Team',
      content: 'Manage team members and access here.',
      route: '/dashboards/dashboard2',
      placement: {
        yPosition: 'below',
        xPosition: 'before',
        horizontal: true,
      } as const,
    }),
    withBase({
      anchorId: 'profile-payments',
      title: 'Payments',
      content: 'Review billing and payment details here.',
      route: '/dashboards/dashboard2',
      placement: {
        yPosition: 'above',
        xPosition: 'before',
        horizontal: true,
      } as const,
    }),
    withBase({
      anchorId: 'profile-r3',
      title: 'R3',
      content: 'Document and track your strategic plans here.',
      route: '/dashboards/dashboard2',
      placement: {
        yPosition: 'above',
        xPosition: 'before',
        horizontal: true,
      } as const,
    }),
  ];

  const dashboardSectionSteps = [...dashboardSteps, ...profileMenuSteps];

  return [
    {
      key: 'dashboard',
      routes: ['/dashboards/dashboard2'],
      steps: dashboardSectionSteps,
    },
    {
      key: 'talent-match',
      routes: ['/apps/talent-match'],
      steps: talentMatchSteps,
    },
    {
      key: 'reports',
      routes: ['/dashboards/reports'],
      steps: reportsSteps,
    },
    {
      key: 'productivity',
      routes: ['/dashboards/productivity'],
      steps: productivitySteps,
    },
    {
      key: 'chat',
      routes: ['/apps/chat'],
      steps: chatSteps,
    },
    {
      key: 'kanban',
      routes: ['/apps/kanban'],
      steps: kanbanSteps,
    },
    {
      key: 'time-tracker',
      routes: ['/apps/time-tracker'],
      steps: timeTrackerSteps,
    },
    {
      key: 'notes',
      routes: ['/apps/notes'],
      steps: notesSteps,
    },
    {
      key: 'todo',
      routes: ['/apps/todo'],
      steps: toDoSteps,
    },
    {
      key: 'history',
      routes: ['/apps/history'],
      steps: historySteps,
    },
    {
      key: 'calendar',
      routes: ['/apps/calendar'],
      steps: calendarSteps,
    },
  ];
};
