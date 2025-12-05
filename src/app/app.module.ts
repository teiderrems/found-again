import { LOCALE_ID, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { requestInterceptor } from './auth.interceptor';
import { DATE_PIPE_DEFAULT_OPTIONS, registerLocaleData } from '@angular/common';
import fr from '@angular/common/locales/fr';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import * as env from '@/environments/environment';

registerLocaleData(fr);

@NgModule({
   declarations: [AppComponent],
   imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    provideFirebaseApp(() => initializeApp(
     {...env.environment.firebaseConfig}
   )),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    FormsModule,
    RouterModule
],
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
      provideHttpClient(),
      { provide: DATE_PIPE_DEFAULT_OPTIONS, useValue: { timezone: 'UTC+1' } },
      { provide: LOCALE_ID, useValue: 'fr-FR' },
   ],
   bootstrap: [AppComponent],
})
export class AppModule {}
