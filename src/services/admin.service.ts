import { Injectable, inject, Injector, runInInjectionContext } from '@angular/core';
import { Observable, from, map, switchMap, combineLatest } from 'rxjs';
import {
  Firestore,
  collection,
  query,
  where,
  collectionData,
  collectionGroup,
  doc,
  updateDoc,
  deleteDoc,
} from '@angular/fire/firestore';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { DeclarationData, DeclarationType } from '@/types/declaration';
import { UserProfile } from '@/types/user';
import { VerificationData } from '@/types/verification';

export interface VerificationWithDetails extends VerificationData {
  userName?: string;
  declarationTitle?: string;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  totalDeclarations: number;
  foundDeclarations: number;
  lostDeclarations: number;
  activeDeclarations: number;
  inactiveDeclarations: number;
  pendingVerifications: number;
  recentDeclarations: DeclarationData[];
  recentUsers: UserProfile[];
  recentVerifications: VerificationWithDetails[];
  allDeclarations: DeclarationData[];
  allUsers: UserProfile[];
}

export interface DeclarationWithUser extends DeclarationData {
  userDetails?: UserProfile;
}

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private firestore: Firestore = inject(Firestore);
  private injector = inject(Injector);
  private functions: Functions = inject(Functions);

  /**
   * Récupère les statistiques principales du dashboard admin - Temps réel
   */
  getAdminStats(): Observable<AdminStats> {
    const usersRef = collection(this.firestore, 'users');
    const declarationsRef = collection(this.firestore, 'declarations');
    const verificationsGroup = collectionGroup(this.firestore, 'verifications');

    const users$ = runInInjectionContext(this.injector, () => collectionData(usersRef, { idField: 'uid' })) as Observable<UserProfile[]>;
    const declarations$ = runInInjectionContext(this.injector, () => collectionData(declarationsRef, { idField: 'id' })) as Observable<DeclarationData[]>;
    const verifications$ = runInInjectionContext(this.injector, () => collectionData(verificationsGroup, { idField: 'id' }));

    return combineLatest([users$, declarations$, verifications$]).pipe(
      map(([users, declarations, verifications]) => {
        const totalUsers = users.length;
        const activeUsers = users.filter(u => u.isActive !== false).length; // Default to true if undefined
        const inactiveUsers = users.filter(u => u.isActive === false).length;

        const totalDeclarations = declarations.length;

        const foundDeclarations = declarations.filter(d => d.type === DeclarationType.FOUND).length;
        const lostDeclarations = declarations.filter(d => d.type === DeclarationType.LOSS).length;
        const activeDeclarations = declarations.filter(d => d.active === true).length;
        const inactiveDeclarations = declarations.filter(d => d.active === false).length;

        const pendingVerifications = verifications.filter(v => v['status'] === 'pending').length;

        // Recent items
        const recentDeclarations = [...declarations]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5);

        const recentUsers = [...users]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5);

        const recentVerifications = verifications
            .map(v => {
                const data = v as any;
                let timestamp = new Date();
                if (data.timestamp) {
                    if (typeof data.timestamp.toDate === 'function') {
                        timestamp = data.timestamp.toDate();
                    } else {
                        timestamp = new Date(data.timestamp);
                    }
                }

                // Enrichir avec les infos utilisateur et déclaration
                const user = users.find(u => u.uid === data.userId);
                const userName = user ? `${user.firstname} ${user.lastname}` : 'Utilisateur inconnu';

                const declaration = declarations.find(d => d.id === data.declarationId);
                const declarationTitle = declaration ? declaration.title : 'Déclaration inconnue';

                return {
                  ...data,
                  timestamp,
                  userName,
                  declarationTitle
                } as VerificationWithDetails;
            })
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, 5);

        return {
          totalUsers,
          activeUsers,
          inactiveUsers,
          totalDeclarations,
          foundDeclarations,
          lostDeclarations,
          activeDeclarations,
          inactiveDeclarations,
          pendingVerifications,
          recentDeclarations,
          recentUsers,
          recentVerifications,
          allDeclarations: declarations,
          allUsers: users
        };
      })
    );
  }

  /**
   * Récupère toutes les déclarations avec les détails des utilisateurs - Temps réel
   */
  getAllDeclarationsWithUsers(): Observable<DeclarationWithUser[]> {
    const declarationsRef = collection(this.firestore, 'declarations');
    const usersRef = collection(this.firestore, 'users');

    const declarations$ = runInInjectionContext(this.injector, () => collectionData(declarationsRef, { idField: 'id' })) as Observable<DeclarationData[]>;
    const users$ = runInInjectionContext(this.injector, () => collectionData(usersRef, { idField: 'uid' })) as Observable<UserProfile[]>;

    return combineLatest([declarations$, users$]).pipe(
      map(([declarations, users]) => {
        return declarations.map(declaration => {
          const user = users.find(u => u.uid === declaration.userId);
          return {
            ...declaration,
            userDetails: user
          } as DeclarationWithUser;
        });
      })
    );
  }

  /**
   * Met à jour le statut d'une vérification
   */
  updateVerificationStatus(
    declarationId: string,
    verificationId: string,
    status: 'pending' | 'verified' | 'rejected',
    matchingDeclarationId?: string // ID de la déclaration de perte correspondante
  ): Observable<void> {
    console.log('🔧 Updating verification status:', declarationId, verificationId, status);
    const verificationRef = doc(this.firestore, 'declarations', declarationId, 'verifications', verificationId);

    return from(updateDoc(verificationRef, { status, updatedAt: new Date().toISOString() })).pipe(
      switchMap(async () => {
        console.log('✅ Verification status updated');
        // Si la vérification est validée, on désactive les deux déclarations
        if (status === 'verified') {
          console.log('🔧 Disabling declarations after verification');
          // 1. Désactiver la déclaration d'objet trouvé (celle qui contient la vérification)
          const foundDeclarationRef = doc(this.firestore, 'declarations', declarationId);
          await updateDoc(foundDeclarationRef, {
            active: false,
            status: 'resolved',
            resolvedAt: new Date().toISOString()
          });

          // 2. Désactiver la déclaration d'objet perdu correspondante (si l'ID est fourni)
          if (matchingDeclarationId) {
            const lostDeclarationRef = doc(this.firestore, 'declarations', matchingDeclarationId);
            await updateDoc(lostDeclarationRef, {
              active: false,
              status: 'resolved',
              resolvedAt: new Date().toISOString()
            });
          }
        }
      })
    );
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
   * Active ou désactive un utilisateur via Cloud Function (Auth + Firestore)
   */
  toggleUserStatus(targetUid: string, isActive: boolean): Observable<void> {
    const toggleStatus = httpsCallable(this.functions, 'toggleUserStatus');
    return from(toggleStatus({ targetUid, isActive }).then(() => void 0));
  }

  /**
   * Récupère les déclarations avec vérifications en attente - Temps réel
   */
  getDeclarationsWithPendingVerifications(): Observable<DeclarationWithUser[]> {
    const declarationsRef = collection(this.firestore, 'declarations');
    const usersRef = collection(this.firestore, 'users');
    const verificationsGroup = collectionGroup(this.firestore, 'verifications');

    const declarations$ = runInInjectionContext(this.injector, () => collectionData(declarationsRef, { idField: 'id' })) as Observable<DeclarationData[]>;
    const users$ = runInInjectionContext(this.injector, () => collectionData(usersRef, { idField: 'uid' })) as Observable<UserProfile[]>;
    const verifications$ = runInInjectionContext(this.injector, () => collectionData(verificationsGroup, { idField: 'id' }));

    return combineLatest([declarations$, users$, verifications$]).pipe(
      map(([declarations, users, verifications]) => {
        const pendingVerifications = verifications.filter(v => v['status'] === 'pending');
        const declarationIdsWithPending = new Set(pendingVerifications.map(v => v['declarationId']));

        return declarations
          .filter(d => declarationIdsWithPending.has(d.id))
          .map(declaration => {
            const user = users.find(u => u.uid === declaration.userId);
            return {
              ...declaration,
              userDetails: user
            } as DeclarationWithUser;
          });
      })
    );
  }

  /**
   * Récupère tous les utilisateurs de la collection 'users' - Temps réel
   */
  getAllUsers(): Observable<UserProfile[]> {
    const usersRef = collection(this.firestore, 'users');
    return runInInjectionContext(this.injector, () => collectionData(usersRef, { idField: 'uid' })) as Observable<UserProfile[]>;
  }

  /**
   * Supprime un utilisateur (Firestore uniquement)
   */
  deleteUser(userId: string): Observable<void> {
    const userRef = doc(this.firestore, 'users', userId);
    return from(deleteDoc(userRef));
  }
}
