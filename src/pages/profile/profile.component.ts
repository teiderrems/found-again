// user-profile.component.ts
import { Component, OnInit, signal, computed, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder } from '@angular/forms';
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
import { UserProfile } from '../../types/user';
import { UserProfileService } from '../../services/user-profile.service';
import { ThemeService } from '../../services/theme.service';
import { EditProfileDialogComponent } from '../../components/edit-profile.component';
import { ConfirmationDialogComponent } from '../../components/confirmation-dialog.component';
import { AuthService } from '@/services/auth.service';
import { FirebaseDatePipe } from '../../pipes/firebase-date.pipe';
import { FirebaseMessagingService } from '../../services/firebase-messaging.service';
import { MatchingService } from '@/services/matching.service';
import { DeclarationMatch } from '@/types/declaration';

interface UserPreferences {
  // Notifications
  emailNotifications: boolean;
  declarationUpdates: boolean;
  matchAlerts: boolean;
  // Confidentialité
  publicProfile: boolean;
  showDeclarations: boolean;
}

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
  private readonly router = inject(Router);
  private readonly userProfileService = inject(UserProfileService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly themeService = inject(ThemeService);
  private readonly fb = inject(FormBuilder);
  private readonly firebaseMessaging = inject(FirebaseMessagingService);
  private readonly matchingService = inject(MatchingService);

  // Signals
  readonly userProfile = signal<UserProfile | null>(null);
  readonly loading = signal(true);
  readonly preferences = signal<UserPreferences>({
    emailNotifications: false,
    declarationUpdates: false,
    matchAlerts: false,
    publicProfile: false,
    showDeclarations: true
  });
  readonly isSavingPreferences = signal(false);
  readonly isDeleting = signal(false);

  // Computed signals
  readonly initials = computed(() => this.getInitials());
  readonly isAdmin = computed(() => this.userProfile()?.role === 'admin');
  
  // Matching signals
  userMatches = signal<DeclarationMatch[]>([]);
  readonly hasMatches = computed(() => (this.userMatches() || []).length > 0);

  constructor() {
    // Effect pour appliquer le thème et synchroniser les préférences
    effect(() => {
      const profile = this.userProfile();
      if (profile?.preferences) {
        this.themeService.setTheme(profile.preferences.theme);
        
        // Synchroniser le signal local preferences avec les données du profil
        this.preferences.set({
          emailNotifications: profile.preferences.emailNotifications ?? true,
          declarationUpdates: profile.preferences.declarationUpdates ?? true,
          matchAlerts: profile.preferences.matchAlerts ?? true,
          publicProfile: profile.preferences.publicProfile ?? false,
          showDeclarations: profile.preferences.showDeclarations ?? true
        });
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit() {
    // Initialiser le chargement du profil
    this.loadUserProfile();
  }

  private loadUserProfile() {
    this.loading.set(true);
    console.log('Chargement du profil utilisateur...');
    
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
                  console.error('Erreur lors du chargement du profil utilisateur:', error);
                  this.snackBar.open('Erreur lors du chargement du profil utilisateur', 'Fermer', {
                    duration: 3000
                  });
                  this.loading.set(false);
                }
              });
            } else {
              console.log('Pas d\'utilisateur authentifié');
              this.userProfile.set(null);
              this.loading.set(false);
            }
          },
          error: (error) => {
            console.error('Erreur lors du chargement du profil:', error);
            this.snackBar.open('Erreur lors du chargement du profil', 'Fermer', {
              duration: 3000
            });
            this.loading.set(false);
          }
        });
      } else {
        console.log('Pas d\'observable currentUser$');
        this.loading.set(false);
      }
    } catch (error) {
      console.error('Erreur non gérée lors du chargement du profil:', error);
      this.loading.set(false);
    }
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
    const currentUserId = this.authService.getCurrentUserId();
    if (!currentUserId) return;

    // Ouvrir le dialogue de confirmation pour la mise à jour
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      disableClose: false,
      data: {
        title: 'Mettre à jour le profil',
        message: 'Êtes-vous sûr de vouloir enregistrer ces modifications ?',
        confirmText: 'Enregistrer',
        cancelText: 'Annuler',
        type: 'info'
      }
    });

    dialogRef.afterClosed().subscribe(async (confirmed) => {
      if (!confirmed) {
        return;
      }

      try {
        const result = await this.userProfileService.updateProfile(currentUserId, updates);
        
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
    });
  }

  // ============= NOTIFICATIONS =============

  async toggleEmailNotifications(event: { checked: boolean }) {
    const uid = this.userProfile()?.uid;
    if (!uid) return;

    this.isSavingPreferences.set(true);
    try {
      const updated = {
        ...this.preferences(),
        emailNotifications: event.checked
      };
      
      await this.userProfileService.updateUserPreferences(uid, updated).toPromise();
      
      // Gérer FCM basé sur les préférences
      if (event.checked) {
        await this.enableFCMNotifications(uid);
      } else {
        await this.disableFCMNotifications(uid);
      }
      
      this.preferences.set(updated);
      
      this.snackBar.open('Notifications par email ' + (event.checked ? 'activées' : 'désactivées'), 'Fermer', {
        duration: 3000
      });
    } catch (error) {
      console.error('Error updating email notifications:', error);
      this.snackBar.open('Erreur lors de la mise à jour', 'Fermer', {
        duration: 3000
      });
      // Revert the change
      const current = this.preferences();
      this.preferences.set({ ...current, emailNotifications: !event.checked });
    } finally {
      this.isSavingPreferences.set(false);
    }
  }

  async toggleDeclarationUpdates(event: { checked: boolean }) {
    const uid = this.userProfile()?.uid;
    if (!uid) return;

    this.isSavingPreferences.set(true);
    try {
      const updated = {
        ...this.preferences(),
        declarationUpdates: event.checked
      };
      
      await this.userProfileService.updateUserPreferences(uid, updated).toPromise();
      this.preferences.set(updated);
      
      this.snackBar.open('Mises à jour de déclarations ' + (event.checked ? 'activées' : 'désactivées'), 'Fermer', {
        duration: 3000
      });
    } catch (error) {
      console.error('Error updating declaration updates:', error);
      this.snackBar.open('Erreur lors de la mise à jour', 'Fermer', {
        duration: 3000
      });
      const current = this.preferences();
      this.preferences.set({ ...current, declarationUpdates: !event.checked });
    } finally {
      this.isSavingPreferences.set(false);
    }
  }

  async toggleMatchAlerts(event: { checked: boolean }) {
    const uid = this.userProfile()?.uid;
    if (!uid) return;

    this.isSavingPreferences.set(true);
    try {
      const updated = {
        ...this.preferences(),
        matchAlerts: event.checked
      };
      
      await this.userProfileService.updateUserPreferences(uid, updated).toPromise();
      this.preferences.set(updated);
      
      this.snackBar.open('Alertes de correspondance ' + (event.checked ? 'activées' : 'désactivées'), 'Fermer', {
        duration: 3000
      });
    } catch (error) {
      console.error('Error updating match alerts:', error);
      this.snackBar.open('Erreur lors de la mise à jour', 'Fermer', {
        duration: 3000
      });
      const current = this.preferences();
      this.preferences.set({ ...current, matchAlerts: !event.checked });
    } finally {
      this.isSavingPreferences.set(false);
    }
  }

  // ============= CONFIDENTIALITÉ =============

  async togglePublicProfile(event: { checked: boolean }) {
    const uid = this.userProfile()?.uid;
    if (!uid) return;

    this.isSavingPreferences.set(true);
    try {
      const updated = {
        ...this.preferences(),
        publicProfile: event.checked
      };
      
      await this.userProfileService.updateUserPreferences(uid, updated).toPromise();
      this.preferences.set(updated);
      
      this.snackBar.open('Profil ' + (event.checked ? 'rendu public' : 'rendu privé'), 'Fermer', {
        duration: 3000
      });
    } catch (error) {
      console.error('Error updating profile visibility:', error);
      this.snackBar.open('Erreur lors de la mise à jour', 'Fermer', {
        duration: 3000
      });
      const current = this.preferences();
      this.preferences.set({ ...current, publicProfile: !event.checked });
    } finally {
      this.isSavingPreferences.set(false);
    }
  }

  async toggleShowDeclarations(event: { checked: boolean }) {
    const uid = this.userProfile()?.uid;
    if (!uid) return;

    this.isSavingPreferences.set(true);
    try {
      const updated = {
        ...this.preferences(),
        showDeclarations: event.checked
      };
      
      await this.userProfileService.updateUserPreferences(uid, updated).toPromise();
      this.preferences.set(updated);
      
      this.snackBar.open('Déclarations ' + (event.checked ? 'visibles' : 'cachées'), 'Fermer', {
        duration: 3000
      });
    } catch (error) {
      console.error('Error updating declarations visibility:', error);
      this.snackBar.open('Erreur lors de la mise à jour', 'Fermer', {
        duration: 3000
      });
      const current = this.preferences();
      this.preferences.set({ ...current, showDeclarations: !event.checked });
    } finally {
      this.isSavingPreferences.set(false);
    }
  }

  // ============= GESTION FCM =============

  private async enableFCMNotifications(uid: string): Promise<boolean> {
    if (!uid) {
      console.warn('UID indéfini, impossible d\'activer les notifications FCM');
      return false;
    }

    try {
      console.log('Début de enableFCMNotifications...');

      // Utiliser le service centralisé pour demander la permission
      const success = await this.firebaseMessaging.requestPermission();
      
      if (!success) {
        console.warn('Échec de l\'activation des notifications via le service');
        this.snackBar.open('Impossible d\'activer les notifications. Vérifiez les paramètres du navigateur.', 'Fermer', {
          duration: 5000
        });
        return false;
      }

      // 5️⃣ Obtenir le token FCM (maintenant qu'on a la permission)
      console.log('Récupération du token FCM...');
      // Note: requestPermission a déjà appelé getMessagingToken, donc le token devrait être en cache ou disponible
      // Mais on le récupère ici pour le sauvegarder
      const token = await this.firebaseMessaging.getMessagingToken();
      
      if (token) {
        console.log('Token FCM obtenu:', token.substring(0, 20) + '...');
        
        // 6️⃣ Sauvegarder le token dans Firestore
        await this.userProfileService.saveFCMToken(uid, token).toPromise();
        console.log('Token FCM sauvegardé pour l\'utilisateur:', uid);

        // 7️⃣ Afficher une notification de test
        try {
          if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.ready;
            await registration.showNotification('Notifications activées', {
              body: 'Les notifications push sont maintenant activées pour cette application',
              icon: '/images/logo/logo.png',
              badge: '/images/logo/logo.png',
              tag: 'notification-enabled',
              requireInteraction: false
            });
            console.log('Notification de confirmation envoyée');
            this.snackBar.open('Notifications activées avec succès!', 'Fermer', {
              duration: 3000
            });
          }
        } catch (notifError) {
          console.warn('Erreur lors de l\'affichage de la notification:', notifError);
          this.snackBar.open('Notifications activées (sans notification de confirmation)', 'Fermer', {
            duration: 3000
          });
        }
        return true;
      } else {
        console.warn('Impossible d\'obtenir le token FCM');
        this.snackBar.open('Erreur: Impossible d\'obtenir le token de notification', 'Fermer', {
          duration: 3000
        });
        return false;
      }

    } catch (error) {
      console.error('Erreur lors de l\'activation FCM:', error);
      this.snackBar.open('Erreur lors de l\'activation des notifications', 'Fermer', {
        duration: 3000
      });
      return false;
    }
  }

  private async disableFCMNotifications(uid: string) {
    if (!uid) {
      console.warn('UID indéfini, impossible de désactiver les notifications FCM');
      return;
    }

    try {
      console.log('Désactivation des notifications FCM...');

      // 1️⃣ Supprimer le token FCM de Firestore
      await this.userProfileService.removeFCMToken(uid).toPromise();
      console.log('Token FCM supprimé pour l\'utilisateur:', uid);

      // 2️⃣ Désenregistrer le Service Worker (optionnel)
      if ('serviceWorker' in navigator) {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const registration of registrations) {
            const unregistered = await registration.unregister();
            if (unregistered) {
              console.log('Service Worker désenregistré');
            }
          }
        } catch (swError) {
          console.warn('Erreur lors de la désenregistration du Service Worker:', swError);
        }
      }

      // 3️⃣ Fermer les notifications actives
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const registration = await navigator.serviceWorker.ready;
        const notifications = await registration.getNotifications();
        notifications.forEach(notification => {
          notification.close();
        });
        if (notifications.length > 0) {
          console.log(notifications.length, 'notification(s) fermée(s)');
        }
      }

      console.log('Notifications FCM désactivées avec succès');

    } catch (error) {
      // Ne pas afficher une erreur si la désactivation échoue (non critique)
      console.warn('Erreur lors de la désactivation FCM (non critique):', error);
    }
  }

  // ============= ZONE DE DANGER =============

  async deleteAccount() {
    const profile = this.userProfile();
    if (!profile) return;

    // Ouvrir le dialogue de confirmation
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      disableClose: false,
      data: {
        title: 'Supprimer le compte',
        message: 'Êtes-vous sûr de vouloir supprimer définitivement votre compte ? Cette action est irréversible et toutes vos données seront supprimées.',
        confirmText: 'Supprimer',
        cancelText: 'Annuler',
        type: 'danger',
        confirmAction: 'SUPPRIMER'
      }
    });

    dialogRef.afterClosed().subscribe(async (confirmed) => {
      if (!confirmed) {
        this.snackBar.open('Suppression annulée', 'Fermer', {
          duration: 3000
        });
        return;
      }

      this.isDeleting.set(true);
      try {
        await this.userProfileService.deleteUserAccount(profile.uid);
        
        this.snackBar.open('Votre compte a été supprimé avec succès', 'Fermer', {
          duration: 5000
        });

        // Rediriger vers la page d'inscription après la suppression
        setTimeout(() => {
          this.router.navigate(['/inscription']);
        }, 2000);
      } catch (error) {
        console.error('Error deleting account:', error);
        this.snackBar.open('Erreur lors de la suppression du compte', 'Fermer', {
          duration: 3000
        });
      } finally {
        this.isDeleting.set(false);
      }
    });
  }

  async toggleTheme(event: { checked: boolean }) {
    // Vérifier si le profil est chargé
    if (this.loading()) {
      console.warn('Profil en cours de chargement, veuillez attendre...');
      this.snackBar.open('Chargement du profil en cours, veuillez attendre...', 'Fermer', {
        duration: 3000
      });
      // Revenir le toggle à son état précédent
      event.checked = !event.checked;
      return;
    }

    // Obtenir l'UID depuis authService (source de vérité)
    const uid = this.authService.getCurrentUserId();
    if (!uid) {
      console.warn('UID utilisateur non disponible');
      this.snackBar.open('Erreur: UID utilisateur indisponible', 'Fermer', {
        duration: 3000
      });
      // Revenir le toggle à son état précédent
      event.checked = !event.checked;
      return;
    }
    
    const theme = event.checked ? 'dark' : 'light';
    
    this.isSavingPreferences.set(true);
    try {
      await this.userProfileService.updatePreferences(uid, { theme });
      this.themeService.setTheme(theme);
      this.snackBar.open('Thème mis à jour', 'Fermer', {
        duration: 3000
      });
      console.log('Thème mis à jour:', theme);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du thème:', error);
      this.snackBar.open('Erreur lors de la mise à jour du thème', 'Fermer', {
        duration: 3000
      });
      // Revenir le toggle à son état précédent en cas d'erreur
      event.checked = !event.checked;
    } finally {
      this.isSavingPreferences.set(false);
    }
  }

  async toggleNotifications(event: { checked: boolean }) {
    // Vérifier si le profil est chargé
    if (this.loading()) {
      console.warn('Profil en cours de chargement, veuillez attendre...');
      this.snackBar.open('Chargement du profil en cours, veuillez attendre...', 'Fermer', {
        duration: 3000
      });
      // Revenir le toggle à son état précédent
      event.checked = !event.checked;
      return;
    }

    // Obtenir l'UID depuis authService (source de vérité)
    const uid = this.authService.getCurrentUserId();
    if (!uid) {
      console.warn('UID utilisateur non disponible');
      this.snackBar.open('Erreur: UID utilisateur indisponible', 'Fermer', {
        duration: 3000
      });
      // Revenir le toggle à son état précédent
      event.checked = !event.checked;
      return;
    }
    
    const notifications = event.checked;
    
    this.isSavingPreferences.set(true);
    try {
      if (notifications) {
        // Tenter d'activer les notifications FCM d'abord (demande permission si nécessaire)
        const success = await this.enableFCMNotifications(uid);
        
        if (success) {
          // Si succès (permission accordée + token), sauvegarder la préférence
          await this.userProfileService.updatePreferences(uid, { notifications: true });
          this.snackBar.open('Notifications activées', 'Fermer', {
            duration: 3000
          });
        } else {
          // Si échec (refus permission ou erreur), revenir en arrière
          event.checked = false;
          // On force la mise à jour du signal local pour refléter l'état réel (false)
          // car le toggle a changé visuellement mais on n'a pas persisté le changement
          this.preferences.update(p => ({ ...p })); 
        }
      } else {
        // Désactivation : on met à jour Firestore d'abord
        await this.userProfileService.updatePreferences(uid, { notifications: false });
        await this.disableFCMNotifications(uid);
        this.snackBar.open('Notifications désactivées', 'Fermer', {
          duration: 3000
        });
      }
      
      console.log('Paramètres de notification mis à jour');
    } catch (error) {
      console.error('Erreur lors de la mise à jour des notifications:', error);
      this.snackBar.open('Erreur lors de la mise à jour des notifications', 'Fermer', {
        duration: 3000
      });
      // Revenir le toggle à son état précédent en cas d'erreur
      event.checked = !event.checked;
    } finally {
      this.isSavingPreferences.set(false);
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

  onAvatarError(event: Event) {
    const profile = this.userProfile();
    if (!profile) return;
    
    const newAvatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.email}`;
    (event.target as HTMLImageElement).src = newAvatarUrl;
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


  // ============= ACTIONS DE MATCHING =============

  /**
   * Affiche la déclaration correspondante
   */
  viewMatchingDeclaration(declarationId: string, matchingDeclarationId?: string) {
    // Navigation vers la page de détail de la déclaration avec l'ID de la déclaration correspondante
    this.router.navigate(['/verifier-identite', declarationId], {
      queryParams: { matchingDeclarationId }
    });
  }

  /**
   * Filtre les matchings pour les déclarations LOSS
   */
  getLossMatches(): DeclarationMatch[] {
    return (this.userMatches() || []).filter(m => m.declaration.type === 'loss');
  }

  /**
   * Filtre les matchings pour les déclarations FOUND
   */
  getFoundMatches(): DeclarationMatch[] {
    return (this.userMatches() || []).filter(m => m.declaration.type === 'found');
  }

  /**
   * Confirme qu'une correspondance est correcte
   */
  async confirmMatch(matchId: string) {
    try {
      await this.matchingService.updateMatchStatus(matchId, 'confirmed');
      this.snackBar.open('Correspondance confirmée !', 'Fermer', {
        duration: 3000
      });
    } catch (error) {
      console.error('Erreur lors de la confirmation:', error);
      this.snackBar.open('Erreur lors de la confirmation', 'Fermer', {
        duration: 3000
      });
    }
  }

  /**
   * Rejette une correspondance
   */
  async rejectMatch(matchId: string) {
    try {
      await this.matchingService.updateMatchStatus(matchId, 'rejected');
      this.snackBar.open('Correspondance rejetée', 'Fermer', {
        duration: 3000
      });
    } catch (error) {
      console.error('Erreur lors du rejet:', error);
      this.snackBar.open('Erreur lors du rejet', 'Fermer', {
        duration: 3000
      });
    }
  }
}
