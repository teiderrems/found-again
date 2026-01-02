// user-profile.service.ts
import { Injectable, signal, computed, Injector, runInInjectionContext, inject } from '@angular/core';
import { Auth, user, deleteUser } from '@angular/fire/auth';
import { 
  Firestore, 
  doc, 
  docData, 
  updateDoc,
  setDoc,
  deleteDoc
} from '@angular/fire/firestore';
import { Observable, map, tap, switchMap } from 'rxjs';
import { UserProfile, UserStats } from '../types/user';
import { DeclarationService } from './declaration.service';

@Injectable({
  providedIn: 'root'
})
export class UserProfileService {
  // Signal pour le profil utilisateur
  private userProfile = signal<UserProfile | null>(null);
  private userStats = signal<UserStats | null>(null);
  
  // Observables Firestore
  userProfile$: Observable<UserProfile | null > |null=null;

  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private declarationService = inject(DeclarationService);
  private injector = inject(Injector);
  
  constructor() {
    // Récupérer l'utilisateur connecté
    const authUser = runInInjectionContext(this.injector, () => user(this.auth));
    
     authUser.pipe(
      map(user => {
        if (!user) return null;
        console.log(user);
        return this.getUserProfile(user.uid);
      }),
      tap(value=> {
        this.userProfile$=value;
        console.log(value);
      })
    );
  }

  // Récupérer le profil depuis Firestore
  getUserProfile(uid: string): Observable<UserProfile | null> {
    const userDoc = doc(this.firestore, `users/${uid}`);
    return runInInjectionContext(this.injector, () => docData(userDoc)).pipe(
      map((data: any) => {
        if (!data) return null;
        
        // Convertir le Timestamp Firestore en Date
        const createdAt = data.createdAt?.toDate?.() || new Date();
        
        return {
          uid,
          email: data.email || '',
          firstname: data.firstname || '',
          lastname: data.lastname || '',
          createdAt,
          role: data.role || 'standard',
          preferences: {
            theme: data.preferences?.theme || 'light',
            notifications: data.preferences?.notifications ?? true,
            emailNotifications: data.preferences?.emailNotifications ?? true,
            declarationUpdates: data.preferences?.declarationUpdates ?? true,
            matchAlerts: data.preferences?.matchAlerts ?? true,
            publicProfile: data.preferences?.publicProfile ?? false,
            showDeclarations: data.preferences?.showDeclarations ?? true
          },
          phone: data.phone || '',
          avatarUrl: data.avatarUrl || this.generateAvatar(data.email || ''),
          location: data.location || '',
          bio: data.bio || ''
        };
      })
    );
  }

  // Mettre à jour le profil (ou le créer s'il n'existe pas)
  async updateProfile(uid: string, updates: Partial<UserProfile>) {
    try {
      const userDoc = doc(this.firestore, `users/${uid}`);
      
      // Préparer les données à mettre à jour ou créer
      const updateData: any = {
        uid, // Toujours inclure l'uid pour la création
      };
      
      if (updates.email !== undefined) updateData.email = updates.email;
      if (updates.firstname !== undefined) updateData.firstname = updates.firstname;
      if (updates.lastname !== undefined) updateData.lastname = updates.lastname;
      if (updates.phone !== undefined) updateData.phone = updates.phone;
      if (updates.location !== undefined) updateData.location = updates.location;
      if (updates.bio !== undefined) updateData.bio = updates.bio;
      if (updates.avatarUrl !== undefined) updateData.avatarUrl = updates.avatarUrl;
      
      if (updates.preferences) {
        updateData.preferences = {
          theme: updates.preferences.theme || 'light',
          notifications: updates.preferences.notifications ?? true,
          emailNotifications: updates.preferences.emailNotifications ?? true,
          declarationUpdates: updates.preferences.declarationUpdates ?? true,
          matchAlerts: updates.preferences.matchAlerts ?? true,
          publicProfile: updates.preferences.publicProfile ?? false,
          showDeclarations: updates.preferences.showDeclarations ?? true
        };
      }
      
      // Utiliser setDoc avec merge: true pour créer ou mettre à jour
      await setDoc(userDoc, updateData, { merge: true });
      
      // Mettre à jour le signal local
      const currentProfile = this.userProfile();
      if (currentProfile) {
        this.userProfile.set({
          ...currentProfile,
          ...updates
        });
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { success: false, error };
    }
  }

  // Mettre à jour les préférences
  async updatePreferences(uid: string, preferences: Partial<UserProfile['preferences']>) {
    try {
      const userDoc = doc(this.firestore, `users/${uid}`);
      
      const updateData: any = {};
      if (preferences.theme !== undefined) updateData['preferences.theme'] = preferences.theme;
      if (preferences.notifications !== undefined) updateData['preferences.notifications'] = preferences.notifications;
      if (preferences.emailNotifications !== undefined) updateData['preferences.emailNotifications'] = preferences.emailNotifications;
      if (preferences.declarationUpdates !== undefined) updateData['preferences.declarationUpdates'] = preferences.declarationUpdates;
      if (preferences.matchAlerts !== undefined) updateData['preferences.matchAlerts'] = preferences.matchAlerts;
      if (preferences.publicProfile !== undefined) updateData['preferences.publicProfile'] = preferences.publicProfile;
      if (preferences.showDeclarations !== undefined) updateData['preferences.showDeclarations'] = preferences.showDeclarations;
      
      if (Object.keys(updateData).length > 0) {
        await setDoc(userDoc, updateData, { merge: true });
      }
      
      // Mettre à jour le signal local
      const currentProfile = this.userProfile();
      if (currentProfile) {
        this.userProfile.set({
          ...currentProfile,
          preferences: {
            ...currentProfile.preferences,
            ...preferences
          }
        });
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error updating preferences:', error);
      return { success: false, error };
    }
  }

  // Générer une URL d'avatar basée sur l'email
  private generateAvatar(email: string): string {
    const seed = email || 'user';
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
  }

  // Récupérer les statistiques de l'utilisateur (calculées à partir des déclarations)
  getUserStats(uid: string): Observable<UserStats> {
    return this.declarationService.getDeclarationsByUserId(uid).pipe(
      map((declarations: any[]) => {
        // Calculer les stats en fonction des déclarations
        const totalDeclarations = declarations.length;
        const foundDeclarations = declarations.filter((d: any) => d.type === 'found').length;
        const lostDeclarations = declarations.filter((d: any) => d.type === 'loss').length;
        const pendingDeclarations = declarations.filter((d: any) => d.status === 'pending').length;
        const resolvedDeclarations = declarations.filter((d: any) => d.status === 'resolved').length;
        
        // Calculer le taux de succès (déclarations résolues / total)
        const successRate = totalDeclarations > 0 ? Math.round((resolvedDeclarations / totalDeclarations) * 100) : 0;
        
        // Objets retournés = déclarations perdues résolues (supposé que les objets ont été retournés)
        const objectsReturned = lostDeclarations > 0 ? resolvedDeclarations : 0;
        
        return {
          totalDeclarations,
          foundDeclarations,
          pendingDeclarations,
          successRate,
          objectsReturned
        };
      })
    );
  }

  // Récupérer les préférences utilisateur
  getUserPreferences(uid: string): Observable<any> {
    const userDoc = doc(this.firestore, `users/${uid}`);
    return docData(userDoc).pipe(
      map((data: any) => ({
        emailNotifications: data?.preferences?.emailNotifications ?? true,
        declarationUpdates: data?.preferences?.declarationUpdates ?? true,
        matchAlerts: data?.preferences?.matchAlerts ?? true,
        publicProfile: data?.preferences?.publicProfile ?? false,
        showDeclarations: data?.preferences?.showDeclarations ?? true
      }))
    );
  }

  // Mettre à jour les préférences utilisateur (nouvelles méthodes)
  updateUserPreferences(uid: string, preferences: any): Observable<void> {
    const userDoc = doc(this.firestore, `users/${uid}`);
    return new Observable(observer => {
      setDoc(userDoc, {
        'preferences.emailNotifications': preferences.emailNotifications,
        'preferences.declarationUpdates': preferences.declarationUpdates,
        'preferences.matchAlerts': preferences.matchAlerts,
        'preferences.publicProfile': preferences.publicProfile,
        'preferences.showDeclarations': preferences.showDeclarations
      }, { merge: true }).then(() => {
        observer.next();
        observer.complete();
      }).catch(error => {
        observer.error(error);
      });
    });
  }

  // Supprimer le compte utilisateur
  async deleteUserAccount(uid: string): Promise<void> {
    try {
      // 1. Supprimer le document utilisateur (avant de perdre l'auth)
      const userDoc = doc(this.firestore, `users/${uid}`);
      await deleteDoc(userDoc);

      // 2. Supprimer le compte d'authentification Firebase
      const authUser = this.auth.currentUser;
      if (authUser) {
        await deleteUser(authUser);
      }
    } catch (error) {
      console.error('Error deleting user account:', error);
      throw error;
    }
  }

  // Vérifier si l'utilisateur est admin
  isAdmin(): boolean {
    return this.userProfile()?.role === 'admin';
  }

  // Formater la date d'inscription
  formatJoinDate(date: Date): string {
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // ============= GESTION FCM =============

  /**
   * Sauvegarde le token FCM pour l'utilisateur
   */
  saveFCMToken(uid: string, token: string): Observable<void> {
    return new Observable(observer => {
      try {
        const userDoc = doc(this.firestore, `users/${uid}`);
        setDoc(userDoc, {
          fcmTokens: token,
          fcmTokenUpdatedAt: new Date()
        }, { merge: true }).then(() => {
          observer.next();
          observer.complete();
        }).catch(error => {
          observer.error(error);
        });
      } catch (error) {
        observer.error(error);
      }
    });
  }

  /**
   * Supprime le token FCM pour l'utilisateur
   */
  removeFCMToken(uid: string): Observable<void> {
    return new Observable(observer => {
      try {
        const userDoc = doc(this.firestore, `users/${uid}`);
        setDoc(userDoc, {
          fcmTokens: null,
          fcmTokenRemovedAt: new Date()
        }, { merge: true }).then(() => {
          observer.next();
          observer.complete();
        }).catch(error => {
          observer.error(error);
        });
      } catch (error) {
        observer.error(error);
      }
    });
  }
}