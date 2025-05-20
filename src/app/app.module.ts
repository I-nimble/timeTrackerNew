import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { JwtInterceptor } from './services/jwt.interceptor';
import { JwtHelperService, JwtModule, JWT_OPTIONS } from '@auth0/angular-jwt';
import { ReportsService } from './services/reports.service';
// import { MatDatepicker } from "@angular/material/datepicker";

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
// import { CustomDatePipe } from "./services/custom-date.pipe";
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
//import { PagesComponent } from './pages/pages.component';
import { WebSocketService } from './services/socket/web-socket.service';
import { SocketIoModule } from 'ngx-socket-io';

import { SharedModule } from './components/shared.module';
// import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
// import { getAuth, provideAuth } from '@angular/fire/auth';

export function jwtOptionsFactory() {
  return {
    tokenGetter: () => localStorage.getItem('jwt'),
    allowedDomains: ['localhost:3000', 'home.inimbleapp.com'],
    disallowedRoutes: ['/auth/signin', '/auth/signup'],
  };
}

@NgModule({
  declarations: [AppComponent],
  exports: [
    // CustomDatePipe,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    SharedModule,
    FormsModule,
    JwtModule.forRoot({
      jwtOptionsProvider: {
        provide: JWT_OPTIONS,
        useFactory: jwtOptionsFactory
      }
    }),
    SocketIoModule,
    // CustomDatePipe,
    BrowserAnimationsModule,
    // ClientDashboardComponent,
    // NgbModule
  ],
  providers: [
    // CustomDatePipe,
    // EntriesService,
    // { provide: JWT_OPTIONS, useFactory: jwtOptionsFactory },
    JwtHelperService,
    WebSocketService,
    ReportsService,
    provideHttpClient(
      withInterceptors([JwtInterceptor])
    ),
    // provideFirebaseApp(() => initializeApp({"projectId":"inimbleapp","appId":"1:562152489018:web:10df1fd86381626629f503","storageBucket":"inimbleapp.firebasestorage.app","apiKey":"AIzaSyDi2g2jOi9coqrHgjF8Ojg_5mPKC1FNs1k","authDomain":"inimbleapp.firebaseapp.com","messagingSenderId":"562152489018"})),
    // provideAuth(() => getAuth()),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
