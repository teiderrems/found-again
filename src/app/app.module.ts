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
import { AuthModule } from './auth/auth.module';
import { RouterModule } from '@angular/router';
import { NotFoundComponent } from './not-found/not-found.component';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { LostObjectComponent } from './lost-object/lost-object.component';
import { MatMenuContent } from "@angular/material/menu";
import { ServiceComponent } from './service/service.component';
import { AboutComponent } from './about/about.component';
import { ContactComponent } from './contact/contact.component';

registerLocaleData(fr);

@NgModule({
   declarations: [AppComponent, NotFoundComponent, LostObjectComponent, ServiceComponent, AboutComponent, ContactComponent],
   imports: [
    BrowserModule,
    AppRoutingModule,
    FooterComponent,
    AuthModule,
    ReactiveFormsModule,
    provideFirebaseApp(() => initializeApp({
        apiKey: 'AIzaSyCd84UfFYutkiLklTTS_igwyN9orgWYGro',
        authDomain: 'found-again.firebaseapp.com',
        projectId: 'found-again',
        storageBucket: 'found-again.firebasestorage.app',
        messagingSenderId: '372344879955',
        appId: '1:372344879955:web:86d8a73086486f717dffa6',
    })),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    FormsModule,
    RouterModule,
    HeaderComponent,
    MatMenuContent
],
   providers: [
      provideAnimationsAsync(),
      {
         provide: 'sncfApiKey',
         useValue: '55e88c66-cf4c-49cc-a79c-566a72cbc539',
      },
      {
         provide: 'sncfBaseUrl',
         useValue: 'https://api.sncf.com/v1',
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
