import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { JwtInterceptor } from './services/jwt.interceptor';
import { JwtHelperService, JwtModule, JWT_OPTIONS } from '@auth0/angular-jwt';
import { ReportsService } from './services/reports.service';
// import { MatDatepicker } from "@angular/material/datepicker";

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
// import { CustomDatePipe } from "./services/custom-date.pipe";
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PagesComponent } from './pages/pages.component';
import { WebSocketService } from './services/socket/web-socket.service';
import { SocketIoModule } from 'ngx-socket-io';

import { SharedModule } from './components/shared.module';
// import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
// import { getAuth, provideAuth } from '@angular/fire/auth';

const jwtOptions = {
  tokenGetter: () => localStorage.getItem('access_token'),
  allowedDomains: ['i-nimble.com'],
  disallowedRoutes: ['http://example.com/api/login'],
};

@NgModule({
  declarations: [AppComponent],
  exports: [
    // CustomDatePipe,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    SharedModule,
    FormsModule,
    JwtModule,
    SocketIoModule,
    // CustomDatePipe,
    BrowserAnimationsModule,
    // ClientDashboardComponent,
    // NgbModule
  ],
  providers: [
    // CustomDatePipe,
    // EntriesService,
    JwtHelperService,
    WebSocketService,
    ReportsService,
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
    { provide: JWT_OPTIONS, useValue: jwtOptions },
    // provideFirebaseApp(() => initializeApp({"projectId":"inimbleapp","appId":"1:562152489018:web:10df1fd86381626629f503","storageBucket":"inimbleapp.firebasestorage.app","apiKey":"AIzaSyDi2g2jOi9coqrHgjF8Ojg_5mPKC1FNs1k","authDomain":"inimbleapp.firebaseapp.com","messagingSenderId":"562152489018"})),
    // provideAuth(() => getAuth()),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
