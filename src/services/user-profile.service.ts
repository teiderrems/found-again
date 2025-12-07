// user-profile.service.ts
import { Injectable, signal, computed } from '@angular/core';
import { Auth, user } from '@angular/fire/auth';
import { 
  Firestore, 
  doc, 
  docData, 
  updateDoc
} from '@angular/fire/firestore';
import { Observable, map, tap } from 'rxjs';
import { UserProfile, UserStats } from '../types/user';

@Injectable({
  providedIn: 'root'
})
export class UserProfileService {
  // Signal pour le profil utilisateur
  private userProfile = signal<UserProfile | null>(null);
  private userStats = signal<UserStats | null>(null);
  
  // Observables Firestore
  userProfile$: Observable<UserProfile | null > |null=null;
  
  constructor(
    private auth: Auth,
    private firestore: Firestore
  ) {
    // Récupérer l'utilisateur connecté
    const authUser = user(this.auth);
    
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
    return docData(userDoc).pipe(
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
            notifications: data.preferences?.notifications ?? true
          },
          phone: data.phone || '',
          avatarUrl: data.avatarUrl || this.generateAvatar(data.email || ''),
          location: data.location || '',
          bio: data.bio || ''
        };
      })
    );
  }

  // Mettre à jour le profil
  async updateProfile(uid: string, updates: Partial<UserProfile>) {
    try {
      const userDoc = doc(this.firestore, `users/${uid}`);
      
      // Préparer les données à mettre à jour
      const updateData: any = {};
      
      if (updates.firstname !== undefined) updateData.firstname = updates.firstname;
      if (updates.lastname !== undefined) updateData.lastname = updates.lastname;
      if (updates.phone !== undefined) updateData.phone = updates.phone;
      if (updates.location !== undefined) updateData.location = updates.location;
      if (updates.bio !== undefined) updateData.bio = updates.bio;
      
      if (updates.preferences) {
        updateData.preferences = {
          theme: updates.preferences.theme || 'light',
          notifications: updates.preferences.notifications ?? true
        };
      }
      
      await updateDoc(userDoc, updateData);
      
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
      
      await updateDoc(userDoc, {
        'preferences.theme': preferences.theme || 'light',
        'preferences.notifications': preferences.notifications ?? true
      });
      
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

  // Récupérer les statistiques de l'utilisateur
  getUserStats(uid: string): Observable<UserStats> {
    const statsDoc = doc(this.firestore, `userStats/${uid}`);
    return docData(statsDoc).pipe(
      map((data: any) => ({
        totalDeclarations: data?.totalDeclarations || 0,
        foundDeclarations: data?.foundDeclarations || 0,
        pendingDeclarations: data?.pendingDeclarations || 0,
        successRate: data?.successRate || 0,
        objectsReturned: data?.objectsReturned || 0
      }))
    );
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
}