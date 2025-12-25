import { Injectable, inject } from '@angular/core';
import { Observable, from, map, mergeMap, switchMap, combineLatest, of } from 'rxjs';
import {
  Firestore,
  collection,
  query,
  where,
  collectionData,
  Query,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
} from '@angular/fire/firestore';
import { DeclarationData, DeclarationType } from '@/types/declaration';
import { UserProfile } from '@/types/user';

export interface AdminStats {
  totalUsers: number;
  totalDeclarations: number;
  foundDeclarations: number;
  lostDeclarations: number;
  pendingVerifications: number;
  recentDeclarations: DeclarationData[];
  recentUsers: UserProfile[];
}

export interface DeclarationWithUser extends DeclarationData {
  userDetails?: UserProfile;
}

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private firestore: Firestore = inject(Firestore);

  /**
   * Récupère les statistiques principales du dashboard admin
   */
  getAdminStats(): Observable<AdminStats> {
    return from(Promise.all([
      this.getTotalUsers(),
      this.getTotalDeclarations(),
      this.getFoundDeclarations(),
      this.getLostDeclarations(),
      this.getPendingVerifications(),
      this.getRecentDeclarations(),
      this.getRecentUsers(),
    ])).pipe(
      map(([totalUsers, totalDeclarations, foundDeclarations, lostDeclarations, pendingVerifications, recentDeclarations, recentUsers]) => ({
        totalUsers,
        totalDeclarations,
        foundDeclarations,
        lostDeclarations,
        pendingVerifications,
        recentDeclarations,
        recentUsers,
      }))
    );
  }

  /**
   * Récupère le nombre total d'utilisateurs
   */
  private async getTotalUsers(): Promise<number> {
    const usersRef = collection(this.firestore, 'users');
    const snapshot = await getDocs(usersRef);
    return snapshot.size;
  }

  /**
   * Récupère le nombre total de déclarations
   */
  private async getTotalDeclarations(): Promise<number> {
    const declarationsRef = collection(this.firestore, 'declarations');
    const snapshot = await getDocs(declarationsRef);
    return snapshot.size;
  }

  /**
   * Récupère le nombre de déclarations trouvées
   */
  private async getFoundDeclarations(): Promise<number> {
    const declarationsRef = collection(this.firestore, 'declarations');
    const q = query(declarationsRef, where('type', '==', DeclarationType.FOUND));
    const snapshot = await getDocs(q);
    return snapshot.size;
  }

  /**
   * Récupère le nombre de déclarations perdues
   */
  private async getLostDeclarations(): Promise<number> {
    const declarationsRef = collection(this.firestore, 'declarations');
    const q = query(declarationsRef, where('type', '==', DeclarationType.LOSS));
    const snapshot = await getDocs(q);
    return snapshot.size;
  }

  /**
   * Récupère le nombre de vérifications en attente
   */
  private async getPendingVerifications(): Promise<number> {
    const declarationsRef = collection(this.firestore, 'declarations');
    const snapshot = await getDocs(declarationsRef);
    let pendingCount = 0;

    for (const doc of snapshot.docs) {
      const verificationsRef = collection(this.firestore, 'declarations', doc.id, 'verifications');
      const verificationsSnapshot = await getDocs(query(verificationsRef, where('status', '==', 'pending')));
      pendingCount += verificationsSnapshot.size;
    }

    return pendingCount;
  }

  /**
   * Récupère les déclarations récentes (derniers 10)
   */
  private async getRecentDeclarations(): Promise<DeclarationData[]> {
    const declarationsRef = collection(this.firestore, 'declarations');
    const snapshot = await getDocs(declarationsRef);
    const declarations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as DeclarationData));
    
    return declarations
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  }

  /**
   * Récupère les utilisateurs récents (derniers 10)
   */
  private async getRecentUsers(): Promise<UserProfile[]> {
    const usersRef = collection(this.firestore, 'users');
    const snapshot = await getDocs(usersRef);
    const users = snapshot.docs.map(doc => doc.data() as UserProfile);
    
    return users
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);
  }

  /**
   * Récupère toutes les déclarations avec les détails des utilisateurs
   */
  getAllDeclarationsWithUsers(): Observable<DeclarationWithUser[]> {
    const declarationsRef = collection(this.firestore, 'declarations');
    return from(getDocs(declarationsRef)).pipe(
      switchMap(snapshot => {
        if (snapshot.empty) {
          return of([]);
        }

        const observables = snapshot.docs.map(declarationDoc => {
          const declaration = {
            id: declarationDoc.id,
            ...declarationDoc.data()
          } as DeclarationData;

          if (declaration.userId) {
            return from(getDoc(doc(this.firestore, 'users', declaration.userId))).pipe(
              map(userDoc => ({
                ...declaration,
                userDetails: userDoc.exists() ? (userDoc.data() as UserProfile) : undefined
              } as DeclarationWithUser))
            );
          }

          return of({
            ...declaration,
            userDetails: undefined
          } as DeclarationWithUser);
        });

        return combineLatest(observables);
      })
    );
  }

  /**
   * Met à jour le statut d'une vérification
   */
  updateVerificationStatus(
    declarationId: string,
    verificationId: string,
    status: 'pending' | 'verified' | 'rejected'
  ): Observable<void> {
    const verificationRef = doc(this.firestore, 'declarations', declarationId, 'verifications', verificationId);
    return from(updateDoc(verificationRef, { status, updatedAt: new Date().toISOString() }));
  }

  /**
   * Supprime une déclaration (fonction admin)
   */
  deleteDeclaration(declarationId: string): Observable<void> {
    const declarationRef = doc(this.firestore, 'declarations', declarationId);
    return from(deleteDoc(declarationRef));
  }

  /**
   * Met à jour le rôle d'un utilisateur
   */
  updateUserRole(userId: string, role: 'standard' | 'admin'): Observable<void> {
    const userRef = doc(this.firestore, 'users', userId);
    return from(updateDoc(userRef, { role }));
  }

  /**
   * Récupère les déclarations avec vérifications en attente
   */
  getDeclarationsWithPendingVerifications(): Observable<DeclarationWithUser[]> {
    const declarationsRef = collection(this.firestore, 'declarations');
    return from(getDocs(declarationsRef)).pipe(
      switchMap(snapshot => {
        const promises = snapshot.docs.map(async (declarationDoc) => {
          const declaration = {
            id: declarationDoc.id,
            ...declarationDoc.data()
          } as DeclarationData;

          // Check for pending verifications
          const verificationsRef = collection(this.firestore, 'declarations', declaration.id, 'verifications');
          const verificationsSnapshot = await getDocs(query(verificationsRef, where('status', '==', 'pending')));

          if (verificationsSnapshot.size > 0 && declaration.userId) {
            const userDoc = await getDoc(doc(this.firestore, 'users', declaration.userId));
            return {
              ...declaration,
              userDetails: userDoc.exists() ? (userDoc.data() as UserProfile) : undefined
            } as DeclarationWithUser;
          }

          return null;
        });

        return from(Promise.all(promises)).pipe(
          map(results => results.filter((r): r is DeclarationWithUser => r !== null))
        );
      })
    );
  }
}
