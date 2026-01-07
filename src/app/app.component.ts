import { Component, inject, OnInit, signal } from '@angular/core';
import { AdBannerComponent } from '@/components/ad-banner/ad-banner.component';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '@/services/auth.service';
import { UserProfileService } from '@/services/user-profile.service';
import { ThemeService } from '@/services/theme.service';
import { FirebaseMessagingService } from '@/services/firebase-messaging.service';
import { SubscriptionService } from '@/services/subscription.service';
import { switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
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
  private subscriptionService = inject(SubscriptionService);

  userRole = signal<string | null>(null);
  isPremium = this.subscriptionService.isPremium;

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
      if (profile) {
        this.userRole.set(profile.role || 'standard');
        console.log('userRole:', this.userRole(), 'isPremium:', this.isPremium());
        // Appliquer le thème enregistré
        if (profile.preferences) {
          if (profile.preferences.theme) {
            this.themeService.setTheme(profile.preferences.theme);
          }

          // Appliquer les préférences de notification
          if (profile.preferences.notifications) {
            this.firebaseMessaging.requestPermission();
          }
        }
      } else {
        console.log('No profile, userRole:', this.userRole(), 'isPremium:', this.isPremium());
      }
    });
  }
}
