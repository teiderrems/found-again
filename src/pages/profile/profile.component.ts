// user-profile.component.ts
import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subscription } from 'rxjs';
import { UserProfile, UserStats } from '../../types/user';
import { UserProfileService } from '../../services/user-profile.service';
import { ThemeService } from '../../services/theme.service';
import { EditProfileDialogComponent } from '../../components/edit-profile.component';

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
    DatePipe
  ],
  templateUrl:'./profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class UserProfileComponent implements OnInit, OnDestroy {
  
  userProfile = signal<UserProfile | null>(null);
  userStats = signal<UserStats | null>(null);
  loading = signal(true);
  
  
  private subscriptions: Subscription[] = [];

  constructor(
    private userProfileService: UserProfileService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private themeService: ThemeService,
    private fb: FormBuilder
  ) {}

  ngOnInit() {
    this.loadUserProfile();
    this.loadUserStats();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadUserProfile() {
    this.loading.set(true);
    
    const sub = this.userProfileService.userProfile$?.subscribe({
      next: (profile) => {
        console.log(profile);
        this.userProfile.set(profile);
        this.loading.set(false);
        
        // Appliquer le thème si disponible
        if (profile?.preferences?.theme) {
          this.themeService.setTheme(profile.preferences.theme);
        }
      },
      error: (error) => {
        console.error('Error loading profile:', error);
        this.snackBar.open('Erreur lors du chargement du profil', 'Fermer', {
          duration: 3000
        });
        this.loading.set(false);
      }
    });
    
    if (sub) {
      this.subscriptions.push(sub);
    }
  }

  loadUserStats() {
    const profile = this.userProfile();
    if (!profile) return;
    
    const sub = this.userProfileService.getUserStats(profile.uid).subscribe({
      next: (stats) => {
        this.userStats.set(stats);
      },
      error: (error) => {
        console.error('Error loading stats:', error);
      }
    });
    
    this.subscriptions.push(sub);
  }

  openEditDialog() {
    const profile = this.userProfile();
    if (!profile) return;
    
    const dialogRef = this.dialog.open(EditProfileDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      data: { profile }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updateProfile(result);
      }
    });
  }

  async updateProfile(updates: Partial<UserProfile>) {
    const profile = this.userProfile();
    if (!profile) return;
    
    try {
      const result = await this.userProfileService.updateProfile(profile.uid, updates);
      
      if (result.success) {
        this.snackBar.open('Profil mis à jour avec succès', 'Fermer', {
          duration: 3000
        });
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
    
    // Générer un fichier JSON avec les données
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
    // TODO: Implémenter la page des paramètres de confidentialité
    this.snackBar.open('Page de confidentialité bientôt disponible', 'Fermer', {
      duration: 3000
    });
  }

  logout() {
    // TODO: Implémenter la déconnexion
    this.snackBar.open('Déconnexion', 'Fermer', {
      duration: 3000
    });
  }

  onAvatarError(event: any) {
    const profile = this.userProfile();
    if (!profile) return;
    
    // Générer une nouvelle URL d'avatar
    const newAvatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.email}`;
    event.target.src = newAvatarUrl;
  }
}