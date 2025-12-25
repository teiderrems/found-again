import { ApplicationConfig, provideZoneChangeDetection } from "@angular/core";
import { provideRouter } from "@angular/router";

import { routes } from "./app.routes";
import { initializeApp, provideFirebaseApp } from "@angular/fire/app";
import { getAuth, provideAuth } from "@angular/fire/auth";
import {
    getAnalytics,
    provideAnalytics,
    ScreenTrackingService,
    UserTrackingService,
} from "@angular/fire/analytics";
import { getDatabase, provideDatabase } from "@angular/fire/database";

import { LOCALE_ID, NgModule } from '@angular/core';
  import { AppComponent } from './app.component';
 import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { requestInterceptor } from "./auth.interceptor";
import { DATE_PIPE_DEFAULT_OPTIONS, registerLocaleData } from '@angular/common';
import fr from '@angular/common/locales/fr';
import { getMessaging, provideMessaging } from "@angular/fire/messaging";

registerLocaleData(fr);

export const appConfig: ApplicationConfig = {
    providers: [

      provideAnimationsAsync(),
      {
         provide: 'sncfApiKey',
         useValue: '55e88c66-cf4c-49cc-a79c-566a72cbc539',
      },
      {
         provide: 'openStreetMapUrl',
         useValue: 'https://nominatim.openstreetmap.org',
      },
      {
         provide: 'API_URL',
         useValue: 'https://api.navitia.io/v1/coverage/sncf',
      },
      provideHttpClient(withInterceptors([requestInterceptor])),
      { provide: DATE_PIPE_DEFAULT_OPTIONS, useValue: { timezone: 'UTC+1' } },
      { provide: LOCALE_ID, useValue: 'fr-FR' },

      
        provideZoneChangeDetection({ eventCoalescing: true }),
        provideRouter(routes),
        provideFirebaseApp(() =>
            initializeApp({
                projectId: "found-again-4a0e0",
                appId: "1:1019330466468:web:9eb199fc069d945827cc31",
                databaseURL:
                    "https://found-again-4a0e0-default-rtdb.firebaseio.com",
                storageBucket: "found-again-4a0e0.firebasestorage.app",
                apiKey: "AIzaSyB8pX5HHUmYMCaUt3YmzD0FyWcqS7_iuEY",
                authDomain: "found-again-4a0e0.firebaseapp.com",
                messagingSenderId: "1019330466468",
                //projectNumber: "1019330466468",
                //version: "2",
            })
        ),
        provideFirestore(() => getFirestore()),
        
        provideAuth(() => getAuth()),
        provideAnalytics(() => getAnalytics()),
        ScreenTrackingService,
        UserTrackingService,
        provideDatabase(() => getDatabase()),
        provideMessaging(() => getMessaging()),
        
    ],
};
