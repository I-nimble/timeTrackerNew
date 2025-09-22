import { bootstrapApplication } from '@angular/platform-browser';
import { importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { defineCustomElements } from '@ionic/core/loader';
import { IonicModule } from '@ionic/angular';

import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

defineCustomElements(window);

const ionicAppConfig = {
  ...appConfig,
  providers: [
    ...(appConfig.providers || []),
    importProvidersFrom(IonicModule.forRoot({})),
    provideRouter([]) 
  ]
};

bootstrapApplication(AppComponent, ionicAppConfig).catch((err) =>
  console.error(err)
);