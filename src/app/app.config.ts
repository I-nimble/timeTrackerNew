import {
  ApplicationConfig,
  provideZoneChangeDetection,
  importProvidersFrom,
} from '@angular/core';
import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { routes } from './app.routes';
import {
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
} from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideClientHydration } from '@angular/platform-browser';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { JwtHelperService, JwtModule, JWT_OPTIONS } from '@auth0/angular-jwt';
import { ReportsService } from './services/reports.service';
import { WebSocketService } from './services/socket/web-socket.service';
import { JwtInterceptor } from './services/jwt.interceptor';

import { ToastrModule } from 'ngx-toastr';
import { provideToastr } from 'ngx-toastr';

// icons
import { TablerIconsModule } from 'angular-tabler-icons';
import * as TablerIcons from 'angular-tabler-icons/icons';
import { FeatherModule } from 'angular-feather';
import { allIcons } from 'angular-feather/icons';

// perfect scrollbar
import { NgScrollbarModule } from 'ngx-scrollbar';
import { NgxPermissionsModule } from 'ngx-permissions';
//Import all material modules
import { MaterialModule } from './material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CalendarModule, DateAdapter } from 'angular-calendar';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';
import { dialogProviders } from './dialog.config';
import { provideNativeDateAdapter } from '@angular/material/core';

// code view
import { provideHighlightOptions } from 'ngx-highlightjs';
import 'highlight.js/styles/atom-one-dark.min.css';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { environment } from '../environments/environment';

export function HttpLoaderFactory(http: HttpClient): any {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

export function jwtOptionsFactory() {
  return {
    tokenGetter: () => localStorage.getItem('jwt'),
    allowedDomains: ['localhost:3000', 'home.inimbleapp.com'],
    disallowedRoutes: ['/auth/signin', '/auth/signup'],
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideNativeDateAdapter(),
    JwtHelperService,
    WebSocketService,
    ReportsService,
    provideAnimationsAsync(), // required animations providers
    provideToastr(), // Toastr providers
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHighlightOptions({
      coreLibraryLoader: () => import('highlight.js/lib/core'),
      lineNumbersLoader: () => import('ngx-highlightjs/line-numbers'), // Optional, add line numbers if needed
      languages: {
        typescript: () => import('highlight.js/lib/languages/typescript'),
        css: () => import('highlight.js/lib/languages/css'),
        xml: () => import('highlight.js/lib/languages/xml'),
      },
    }),
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled',
        anchorScrolling: 'enabled',
      }),
      withComponentInputBinding()
    ),
    provideHttpClient(
      withInterceptors([JwtInterceptor])
    ),
    ...dialogProviders,
    provideClientHydration(),
    provideAnimationsAsync(),
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    provideAuth(() => getAuth()),
    importProvidersFrom(
      FormsModule,
      ToastrModule.forRoot(),
      ReactiveFormsModule,
      MaterialModule,
      NgxPermissionsModule.forRoot(),
      TablerIconsModule.pick(TablerIcons),
      FeatherModule.pick(allIcons),
      NgScrollbarModule,
      CalendarModule.forRoot({
        provide: DateAdapter,
        useFactory: adapterFactory,
      }),
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient],
        },
      }),
      JwtModule.forRoot({
        jwtOptionsProvider: {
          provide: JWT_OPTIONS,
          useFactory: jwtOptionsFactory,
        },
      })
    ),
  ],
};
