import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  ApplicationConfig,
  importProvidersFrom,
  provideZoneChangeDetection,
} from '@angular/core';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { provideNativeDateAdapter } from '@angular/material/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import {
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
} from '@angular/router';

import { JwtHelperService, JwtModule, JWT_OPTIONS } from '@auth0/angular-jwt';
import { AuthInterceptor, ErrorInterceptor } from '@core/http/interceptors';
import { provideStore } from '@ngrx/store';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { CalendarModule, DateAdapter } from 'angular-calendar';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';
import { TablerIconsModule } from 'angular-tabler-icons';
import * as TablerIcons from 'angular-tabler-icons/icons';
import { provideHighlightOptions } from 'ngx-highlightjs';
import { NgxPermissionsModule } from 'ngx-permissions';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { provideToastr } from 'ngx-toastr';
import { TourMatMenuModule } from 'ngx-ui-tour-md-menu';

import { routes } from './app.routes';
import { dialogProviders } from './dialog.config';
import { MaterialModule } from './material.module';
import { environment } from '../environments/environment';
import { ReportsService } from './services/reports.service';
import { WebSocketService } from './services/socket/web-socket.service';

import 'highlight.js/styles/atom-one-dark.min.css';

export function HttpLoaderFactory(http: HttpClient): TranslateHttpLoader {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

export function jwtOptionsFactory() {
  return {
    tokenGetter: () => localStorage.getItem('jwt'),
    allowedDomains: ['localhost:3000', 'home.inimbleapp.com'],
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
      withComponentInputBinding(),
    ),
    provideStore(),
    provideHttpClient(withInterceptors([AuthInterceptor, ErrorInterceptor])),
    ...dialogProviders,
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    provideAuth(() => getAuth()),
    importProvidersFrom(
      FormsModule,
      ReactiveFormsModule,
      MaterialModule,
      TourMatMenuModule,
      NgxPermissionsModule.forRoot(),
      TablerIconsModule.pick(TablerIcons),
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
      }),
    ),
  ],
};
