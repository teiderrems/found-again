import { Component, inject, OnInit } from '@angular/core';
import { AdBannerComponent } from '@/components/ad-banner/ad-banner.component';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { UserProfileService } from '../services/user-profile.service';
import { ThemeService } from '../services/theme.service';
import { FirebaseMessagingService } from '../services/firebase-messaging.service';
import { switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    // Global ad banner
    AdBannerComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  title = 'Found';

  private authService = inject(AuthService);
  private userProfileService = inject(UserProfileService);
  private themeService = inject(ThemeService);
  private firebaseMessaging = inject(FirebaseMessagingService);

  ngOnInit() {
    // Synchroniser les préférences utilisateur (comme le thème) avec l'application
    this.authService.currentUser$.pipe(
      switchMap(user => {
        if (user) {
          return this.userProfileService.getUserProfile(user.uid);
        }
        return of(null);
      })
    ).subscribe(profile => {
      if (profile && profile.preferences) {
        // Appliquer le thème enregistré
        if (profile.preferences.theme) {
          this.themeService.setTheme(profile.preferences.theme);
        }

        // Appliquer les préférences de notification
        if (profile.preferences.notifications) {
          this.firebaseMessaging.requestPermission();
        }
      }
    });
  }
}
