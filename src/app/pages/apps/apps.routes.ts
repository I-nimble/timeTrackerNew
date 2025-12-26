import { Routes } from '@angular/router';

import { AppChatComponent } from './chat/chat.component';
import { AppEmployeeComponent } from './employee/employee.component';
import { AppNotesComponent } from './notes/notes.component';
import { AppTodoComponent } from './todo/todo.component';
import { AppPermissionComponent } from './permission/permission.component';
import { AppKanbanComponent } from './kanban/kanban.component';
import { AppFullcalendarComponent } from './fullcalendar/fullcalendar.component';
import { AppInvoiceListComponent } from './invoice/invoice-list/invoice-list.component';
import { AppAddInvoiceComponent } from './invoice/add-invoice/add-invoice.component';
import { AppInvoiceViewComponent } from './invoice/invoice-view/invoice-view.component';
import { AppEditInvoiceComponent } from './invoice/edit-invoice/edit-invoice.component';
import { EmployeeDetailsComponent } from './employee/employee-details/employee-details.component';
import { AppAccountSettingComponent } from './account-setting/account-setting.component';
import { AppTalentMatchComponent } from '../talent-match/talent-match.component';
import { HrOperationsComponent } from './chat/hr-operations/hr-operations.component';
import { NotificationsComponent } from '../dashboards/notifications/notifications.component';
import { AppTalentMatchAdminComponent } from '../talent-match-admin/talent-match-admin.component';
import { TeamComponent } from './team/team.component';
import { AppHistoryComponent } from './history/history.component';
import { AppPricingStripeComponent } from './invoice/pricing/pricing.component';
import { AppExpertComponent } from './expert/expert.component';
import { ClientDetailsComponent } from './expert/client-detail/client-details.component';
import { PaymentsReportsComponent } from './invoice/payments-reports/payments-reports.component';
import { ScrapperComponent } from './scrapper/scrapper.component';
import { CandidatesComponent } from '../candidates/candidates.component';
import { AppBoardsComponent } from './kanban/boards/boards.component';
import { CandidateDetailsComponent } from '../candidates/candidate-details/candidate-details.component';
import { CustomSearchComponent } from '../custom-search/custom-search.component';
import { R3Component } from './r3/r3.component';
import { R3ActionComponent } from './r3/action/r3.action.component';
import { R3TractionComponent } from './r3/traction/r3.traction.component';
import { R3VisionComponent } from './r3/vision/r3.vision.component';
import { AppEventsComponent } from './events/events.component';

export const AppsRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'team',
        component: TeamComponent,
        data: {
          title: 'Team',
          urls: [
            { title: 'Dashboard', url: '/dashboards/dashboard2' },
            { title: 'Team' },
          ],
        },
      },
      {
        path: 'chat',
        component: AppChatComponent,
        data: {
          title: 'Chat',
          urls: [
            { title: 'Dashboard', url: '/dashboards/dashboard2' },
            { title: 'Chat' },
          ],
        },
      },
      {
        path: 'chat/support',
        component: HrOperationsComponent,
        data: {
          title: 'Chat',
          urls: [
            { title: 'Dashboard', url: '/dashboards/dashboard1' },
            { title: 'Support chat' },
          ],
        },
      },
      {
        path: 'notifications',
        component: NotificationsComponent,
        data: {
          title: 'Notifications',
          urls: [
            { title: 'Dashboard', url: '/dashboards/dashboard1' },
            { title: 'Notifications' },
          ],
        },
      },
      {
        path: 'calendar',
        component: AppFullcalendarComponent,
        data: {
          title: 'Calendar',
          urls: [
            { title: 'Dashboard', url: '/dashboards/dashboard2' },
            { title: 'Calendar' },
          ],
        },
      },
      {
        path: 'notes',
        component: AppNotesComponent,
        data: {
          title: 'Notes',
          urls: [
            { title: 'Dashboard', url: '/dashboards/dashboard2' },
            { title: 'Notes' },
          ],
        },
      },
      { path: 'email', redirectTo: 'email/inbox', pathMatch: 'full' },
      {
        path: 'permission',
        component: AppPermissionComponent,
        data: {
          title: 'Roll Base Access',
          urls: [
            { title: 'Dashboard', url: '/dashboards/dashboard2' },
            { title: 'Roll Base Access' },
          ],
        },
      },
      {
        path: 'todo',
        component: AppTodoComponent,
        data: {
          title: 'Todo App',
          urls: [
            { title: 'Dashboard', url: '/dashboards/dashboard2' },
            { title: 'Todo App' },
          ],
        },
      },
      {
        path: 'history',
        component: AppHistoryComponent,
        data: {
          title: 'History',
          urls: [
            { title: 'Dashboard', url: '/dashboards/dashboard1' },
            { title: 'History' },
          ],
        },
      },
      {
        path: 'candidates',
        children: [
          {
            path: '',
            component: CandidatesComponent,
            data: {
              title: 'Candidates',
              urls: [
                { title: 'Dashboard', url: '/dashboards/dashboard1' },
                { title: 'Candidates' },
              ],
            },
          },
          {
            path: ':id',
            component: CandidateDetailsComponent,
            data: {
              title: 'Candidate Details',
              showGoBack: true,
              urls: [
                { title: 'Dashboard', url: '/dashboards/dashboard1' },
                { title: 'Candidates', url: '/candidates' },
                { title: 'Details' },
              ],
            },
          },
        ],
      },
      {
        path: 'talent-match',
        children: [
          {
            path: '',
            component: AppTalentMatchComponent,
            data: {
              title: 'Talent match',
              urls: [
                { title: 'Dashboard', url: '/dashboards/dashboard1' },
                { title: 'Talent match' },
              ],
            },
          },
          {
            path: 'custom-search',
            component: CustomSearchComponent,
            data: {
              title: 'Custom Search',
              showGoBack: true,
              urls: [
                { title: 'Dashboard', url: '/dashboards/dashboard1' },
                { title: 'Talent match', url: '/talent-match' },
              ],
            },
          },
          {
            path: ':id',
            component: CandidateDetailsComponent,
            data: {
              title: 'Candidate Details',
              showGoBack: true,
              urls: [
                { title: 'Dashboard', url: '/dashboards/dashboard1' },
                { title: 'Talent match', url: '/talent-match' },
                { title: 'Details' },
              ],
            },
          },
        ],
      },
      {
        path: 'expert',
        children: [
          {
            path: '',
            component: AppExpertComponent,
            data: {
              title: 'Expert',
              urls: [
                { title: 'Dashboard', url: '/dashboards/dashboard1' },
                { title: 'Expert' },
              ],
            },
          },
          {
            path: ':id',
            component: ClientDetailsComponent,
            data: {
              title: 'Client Details',
              showGoBack: true,
              urls: [
                { title: 'Dashboard', url: '/dashboards/dashboard1' },
                { title: 'Client Details' },
              ],
            },
          },
        ],
      },
      {
        path: 'kanban',
        children: [
          {
            path: '',
            component: AppBoardsComponent,
            data: {
              title: 'Boards',
              urls: [
                { title: 'Dashboard', url: '/dashboards/dashboard1' },
                { title: 'Boards' },
              ],
            },
          },
          {
            path: ':id',
            component: AppKanbanComponent,
            data: {
              title: 'Kanban',
              showGoBack: true,
              urls: [
                { title: 'Dashboard', url: '/dashboards/dashboard1' },
                { title: 'Kanban' },
              ],
            },
          },
        ],
      },
      {
        path: 'time-tracker',
        component: AppEmployeeComponent,
        data: {
          title: 'Time tracker',
          urls: [
            { title: 'Dashboard', url: '/dashboards/dashboard2' },
            { title: 'Employee' },
          ],
        },
      },
      {
        path: 'employee',
        component: EmployeeDetailsComponent,
        data: { 
          title: 'Employee Details',
          showGoBack: true,
          urls: [
            { title: 'Dashboard', url: '/dashboards/dashboard2' },
            { title: 'Employee Details' },
          ] 
        },
      },
      {
        path: 'events',
        component: AppEventsComponent,
        data: {
          title: 'Events',
          urls: [
            { title: 'Dashboard', url: '/dashboards/dashboard1' },
            { title: 'Events' },
          ],
        },
      },
      {
        path: 'invoice',
        component: AppInvoiceListComponent,
        data: {
          title: 'Invoice',
          urls: [
            { title: 'Dashboard', url: '/dashboards/dashboard2' },
            { title: 'Invoice' },
          ],
        },
      },
      {
        path: 'payments-reports',
        component: PaymentsReportsComponent,
        data: {
          title: 'Reports',
          showGoBack: true,
          urls: [
            { title: 'Dashboard', url: '/dashboards/dashboard2' },
            { title:  'Reports' },
          ],
        },
      },
      {
        path: 'addInvoice',
        component: AppAddInvoiceComponent,
        data: {
          title: 'Add Invoice',
          showGoBack: true,
          urls: [
            { title: 'Dashboard', url: '/dashboards/dashboard2' },
            { title: 'Add Invoice' },
          ],
        },
      },
      {
        path: 'viewInvoice/:id',
        component: AppInvoiceViewComponent,
        data: {
          title: 'View Invoice',
          showGoBack: true,
          urls: [
            { title: 'Dashboard', url: '/dashboards/dashboard2' },
            { title: 'View Invoice' },
          ],
        },
      },
      {
        path: 'editinvoice/:id',
        component: AppEditInvoiceComponent,
        data: {
          title: 'Edit Invoice',
          showGoBack: true,
          urls: [
            { title: 'Dashboard', url: '/dashboards/dashboard2' },
            { title: 'Edit Invoice' },
          ],
        },
      },
      {
        path: 'account-settings',
        component: AppAccountSettingComponent,
        data: {
          title: 'Account Settings',
          urls: [
            { title: 'Dashboard', url: '/dashboards/dashboard1' },
            { title: 'Account Settings' },
          ],
        },
      },
      {
        path: 'permission',
        component: AppPermissionComponent,
        data: {
          title: 'Permission',
          urls: [
            { title: 'Dashboard', url: '/dashboards/dashboard1' },
            { title: 'Permission' },
          ],
        },
      },
      {
        path: 'pricing',
        component: AppPricingStripeComponent,
        data: {
          title: 'Pricing',
          showGoBack: true,
          urls: [
            { title: 'Dashboard', url: '/dashboards/dashboard1' },
            { title: 'Pricing' },
          ],
        },
      },
      {
        path: 'r3',
        component: R3Component,
        data: {
          title: 'R3',
          urls: [
            { title: 'Dashboard', url: '/dashboards/dashboard1' },
            { title: 'R3' },
          ],
        }
      },
      {
        path: 'r3/vision',
        component: R3VisionComponent,
        data: {
          title: 'Vision',
          showGoBack: true,
          urls: [
            { title: 'Dashboard', url: '/dashboards/dashboard1' },
            { title: 'R3', url: '/apps/r3' },
            { title: 'Vision' }
          ]
        }
      },
      {
        path: 'r3/traction',
        component: R3TractionComponent,
        data: {
          title: 'Traction',
          showGoBack: true,
          urls: [
            { title: 'Dashboard', url: '/dashboards/dashboard1' },
            { title: 'R3', url: '/apps/r3' },
            { title: 'Traction' }
          ]
        }
      },
      {
        path: 'r3/action',
        component: R3ActionComponent,
        data: {
          title: 'Action',
          showGoBack: true,
          urls: [
            { title: 'Dashboard', url: '/dashboards/dashboard1' },
            { title: 'R3', url: '/apps/r3' },
            { title: 'Action' }
          ]
        }
      },
      {
        path: 'scrapper',
        component: ScrapperComponent,
        data: {
          title: 'Scrapper',
          urls: [
            { title: 'Dashboard', url: '/dashboards/dashboard1' },
            { title: 'scrapper' },
          ],
        },
      },
    ],
  },
];
