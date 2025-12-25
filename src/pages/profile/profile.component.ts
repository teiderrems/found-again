// user-profile.component.ts
import { Component, OnInit, signal, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserProfile, UserStats } from '../../types/user';
import { UserProfileService } from '../../services/user-profile.service';
import { ThemeService } from '../../services/theme.service';
import { EditProfileDialogComponent } from '../../components/edit-profile.component';
import { AuthService } from '@/services/auth.service';
import { FirebaseDatePipe } from '../../pipes/firebase-date.pipe';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDialogModule,
    FirebaseDatePipe
  ],
  templateUrl:'./profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class UserProfileComponent implements OnInit {
  // Injectés
  private readonly authService = inject(AuthService);
  private readonly userProfileService = inject(UserProfileService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly themeService = inject(ThemeService);
  private readonly fb = inject(FormBuilder);

  // Signals
  readonly userProfile = signal<UserProfile | null>(null);
  readonly userStats = signal<UserStats | null>(null);
  readonly loading = signal(true);

  // Computed signals
  readonly initials = computed(() => this.getInitials());
  readonly isAdmin = computed(() => this.userProfile()?.role === 'admin');
  readonly hasDeclarations = computed(() => (this.userProfile()?.declarations || []).length > 0);

  constructor() {
    // Effect pour charger le profil au démarrage
    effect(() => {
      this.loadUserProfile();
    });

    // Effect pour mettre à jour les stats quand le profil change
    effect(() => {
      const profile = this.userProfile();
      if (profile?.uid) {
        this.loadUserStats(profile.uid);
      }
    });

    // Effect pour appliquer le thème
    effect(() => {
      const profile = this.userProfile();
      if (profile?.preferences?.theme) {
        this.themeService.setTheme(profile.preferences.theme);
      }
    });
  }

  ngOnInit() {
    // Initialisation du composant
    // Les effects prennent en charge le chargement des données
  }

  private loadUserProfile() {
    this.loading.set(true);
    
    try {
      const profileObservable = this.authService.currentUser$;
      if (profileObservable) {
        profileObservable.subscribe({
          next: (profile) => {
            if (profile) {
              this.authService.getUserProfile(profile.uid).subscribe({
                next: (userProfile) => {
                  this.userProfile.set(userProfile || null);
                  this.loading.set(false);
                },
                error: (error) => {
                  console.error('Error loading user profile:', error);
                  this.snackBar.open('Erreur lors du chargement du profil utilisateur', 'Fermer', {
                    duration: 3000
                  });
                  this.loading.set(false);
                }
              });
            } else {
              this.userProfile.set(null);
            }
            this.loading.set(false);
          },
          error: (error) => {
            console.error('Error loading profile:', error);
            this.snackBar.open('Erreur lors du chargement du profil', 'Fermer', {
              duration: 3000
            });
            this.loading.set(false);
          }
        });
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      this.loading.set(false);
    }
  }

  private loadUserStats(uid: string) {
    this.userProfileService.getUserStats(uid).subscribe({
      next: (stats) => {
        this.userStats.set(stats);
      },
      error: (error) => {
        console.error('Error loading stats:', error);
      }
    });
  }

  openEditDialog() {
    const profile = this.userProfile();
    if (!profile) return;
    
    console.log('Opening dialog with profile:', profile);
    
    const dialogRef = this.dialog.open(EditProfileDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      data: { profile }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      console.log('Dialog closed with result:', result);
      if (result) {
        this.updateProfile(result);
      }
    });
  }

  async updateProfile(updates: Partial<UserProfile>) {
    const profile = this.authService.getCurrentUserId();
    if (!profile) return;
    try {
      const result = await this.userProfileService.updateProfile(profile, updates);
      
      if (result.success) {
        this.snackBar.open('Profil mis à jour avec succès', 'Fermer', {
          duration: 3000
        });
        // Recharger le profil
        this.loadUserProfile();
      } else {
        throw result.error;
      }
    } catch (error) {
      this.snackBar.open('Erreur lors de la mise à jour', 'Fermer', {
        duration: 3000
      });
    }
  }

  async toggleTheme(event: any) {
    const profile = this.userProfile();
    if (!profile) return;
    
    const theme = event.checked ? 'dark' : 'light';
    
    try {
      await this.userProfileService.updatePreferences(profile.uid, { theme });
      this.themeService.setTheme(theme);
    } catch (error) {
      console.error('Error updating theme:', error);
    }
  }

  async toggleNotifications(event: any) {
    const profile = this.userProfile();
    if (!profile) return;
    
    const notifications = event.checked;
    
    try {
      await this.userProfileService.updatePreferences(profile.uid, { notifications });
    } catch (error) {
      console.error('Error updating notifications:', error);
    }
  }

  exportData() {
    const profile = this.userProfile();
    if (!profile) return;
    
    const dataStr = JSON.stringify(profile, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `profil_${profile.email}_${new Date().getTime()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    this.snackBar.open('Données exportées avec succès', 'Fermer', {
      duration: 3000
    });
  }

  openPrivacySettings() {
    this.snackBar.open('Page de confidentialité bientôt disponible', 'Fermer', {
      duration: 3000
    });
  }

  logout() {
    this.snackBar.open('Déconnexion', 'Fermer', {
      duration: 3000
    });
  }

  onAvatarError(event: any) {
    const profile = this.userProfile();
    if (!profile) return;
    
    const newAvatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.email}`;
    event.target.src = newAvatarUrl;
  }

  private getInitials(): string {
    const profile = this.userProfile();
    if (!profile) return 'U';
    
    if (profile.firstname && profile.lastname) {
      return (profile.firstname[0] + profile.lastname[0]).toUpperCase();
    } else if (profile.firstname) {
      return profile.firstname.substring(0, 2).toUpperCase();
    } else if (profile.email) {
      return profile.email.substring(0, 2).toUpperCase();
    }
    
    return 'U';
  }
}