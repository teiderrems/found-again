import { Component, inject, signal, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { UserProfileService } from '@/services/user-profile.service';
import { AuthService } from '@/services/auth.service';
import { ThemeService } from '@/services/theme.service';
import { ConfirmationDialogComponent } from '@/components/confirmation-dialog.component';
import { Router } from '@angular/router';
import { UserProfile } from '@/types/user';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './settings.component.html',
  styles: []
})
export class SettingsComponent implements OnInit {
  private userProfileService = inject(UserProfileService);
  private authService = inject(AuthService);
  private themeService = inject(ThemeService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private router = inject(Router);

  userProfile = signal<UserProfile | null>(null);
  loading = signal(true);
  isSaving = signal(false);
  isDeleting = signal(false);

  constructor() {
    // Effect to sync theme with user profile
    effect(() => {
      const profile = this.userProfile();
      if (profile?.preferences?.theme) {
        this.themeService.setTheme(profile.preferences.theme);
      }
    });
  }

  ngOnInit() {
    this.loadUserProfile();
  }

  private loadUserProfile() {
    this.loading.set(true);
    this.authService.currentUser$.subscribe({
      next: (user) => {
        if (user) {
          this.userProfileService.getUserProfile(user.uid).subscribe({
            next: (profile) => {
              this.userProfile.set(profile);
              this.loading.set(false);
            },
            error: (error) => {
              console.error('Error loading profile:', error);
              this.loading.set(false);
            }
          });
        } else {
          this.loading.set(false);
          this.router.navigate(['/connexion']);
        }
      }
    });
  }

  async toggleTheme(event: any) {
    const isDark = event.checked;
    const theme = isDark ? 'dark' : 'light';
    this.themeService.setTheme(theme);
    await this.updatePreference('theme', theme);
  }

  async toggleNotifications(event: any) {
    await this.updatePreference('notifications', event.checked);
  }

  async toggleEmailNotifications(event: any) {
    await this.updatePreference('emailNotifications', event.checked);
  }

  async toggleDeclarationUpdates(event: any) {
    await this.updatePreference('declarationUpdates', event.checked);
  }

  async toggleMatchAlerts(event: any) {
    await this.updatePreference('matchAlerts', event.checked);
  }

  async togglePublicProfile(event: any) {
    await this.updatePreference('publicProfile', event.checked);
  }

  async toggleShowDeclarations(event: any) {
    await this.updatePreference('showDeclarations', event.checked);
  }

  private async updatePreference(key: string, value: any) {
    const profile = this.userProfile();
    if (!profile) return;

    this.isSaving.set(true);
    try {
      await this.userProfileService.updatePreferences(profile.uid, { [key]: value });
      this.snackBar.open('Préférences mises à jour', 'Fermer', { duration: 3000 });
      
      // Update local signal
      this.userProfile.update(p => {
        if (!p) return null;
        return {
          ...p,
          preferences: {
            ...p.preferences,
            [key]: value
          }
        };
      });
    } catch (error) {
      console.error('Error updating preference:', error);
      this.snackBar.open('Erreur lors de la mise à jour', 'Fermer', { duration: 3000 });
      // Reload profile to revert changes
      this.loadUserProfile();
    } finally {
      this.isSaving.set(false);
    }
  }

  deleteAccount() {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Supprimer mon compte',
        message: 'Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible et toutes vos données seront perdues.',
        confirmText: 'Supprimer définitivement',
        cancelText: 'Annuler',
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe(async (confirmed) => {
      if (confirmed) {
        this.isDeleting.set(true);
        try {
          const profile = this.userProfile();
          if (profile) {
             await this.userProfileService.deleteUserAccount(profile.uid);
             this.snackBar.open('Compte supprimé avec succès', 'Fermer', { duration: 3000 });
             this.router.navigate(['/connexion']);
          }
        } catch (error) {
          console.error('Error deleting account:', error);
          this.snackBar.open('Erreur lors de la suppression du compte', 'Fermer', { duration: 3000 });
        } finally {
          this.isDeleting.set(false);
        }
      }
    });
  }
}
