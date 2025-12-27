import { Injectable, inject } from '@angular/core';
import { Observable, from, map, switchMap } from 'rxjs';
import {
  Firestore,
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  DocumentReference,
  collectionGroup,
  collectionData,
  docData,
  orderBy
} from '@angular/fire/firestore';
import {
  VerificationData,
  VerificationCreate,
  VerificationUpdate,
  VerificationStatus,
} from '@/types/verification';

@Injectable({
  providedIn: 'root',
})
export class VerificationService {
  private firestore: Firestore = inject(Firestore);

  /**
   * Crée une nouvelle vérification d'identité
   */
  createVerification(
    declarationId: string,
    userId: string,
    verification: VerificationCreate,
    matchingDeclarationId?: string // ID de la déclaration correspondante (optionnel)
  ): Observable<string> {
    const verificationsRef = collection(
      this.firestore,
      'declarations',
      declarationId,
      'verifications'
    );

    const verificationData = {
      declarationId,
      userId,
      identityDetails: verification.identityDetails,
      additionalInfo: verification.additionalInfo,
      serialNumber: verification.serialNumber || null,
      status: VerificationStatus.PENDING,
      timestamp: new Date().toISOString(),
      matchingDeclarationId: matchingDeclarationId || null // Stocker l'ID correspondant
    };

    return from(addDoc(verificationsRef, verificationData)).pipe(
      map((docRef: DocumentReference) => docRef.id)
    );
  }

  /**
   * Récupère toutes les vérifications d'une déclaration - Temps réel
   */
  getVerificationsByDeclaration(declarationId: string): Observable<VerificationData[]> {
    const verificationsRef = collection(
      this.firestore,
      'declarations',
      declarationId,
      'verifications'
    );

    return collectionData(verificationsRef, { idField: 'id' }).pipe(
      map(docs => docs.map(doc => ({
        ...doc,
        id: doc['id']
      } as VerificationData)))
    );
  }

  /**
   * Récupère toutes les vérifications (tous statuts confondus) - Temps réel
   */
  getAllVerifications(): Observable<VerificationData[]> {
    const verificationsGroup = collectionGroup(this.firestore, 'verifications');
    // Note: On ne trie pas côté serveur pour éviter de devoir créer un index composite complexe
    // On trie côté client
    
    return collectionData(verificationsGroup, { idField: 'id' }).pipe(
      map(docs => {
        const verifications = docs.map(doc => {
          const data = doc as any;
          // Gestion sécurisée du timestamp qui peut être un objet Timestamp Firestore ou une string/date
          let timestamp = new Date();
          if (data.timestamp) {
            if (typeof data.timestamp.toDate === 'function') {
              timestamp = data.timestamp.toDate();
            } else {
              timestamp = new Date(data.timestamp);
            }
          }

          return {
            ...data,
            id: doc['id'],
            timestamp
          } as VerificationData;
        });
        
        // Tri côté client
        return verifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      })
    );
  }

  /**
   * Récupère toutes les vérifications en attente - Temps réel
   */
  getPendingVerifications(): Observable<VerificationData[]> {
    // On réutilise getAllVerifications pour éviter la duplication de logique et les problèmes d'index
    return this.getAllVerifications().pipe(
      map(verifications => verifications.filter(v => v.status === VerificationStatus.PENDING))
    );
  }

  /**
   * Récupère une vérification spécifique - Temps réel
   */
  getVerification(
    declarationId: string,
    verificationId: string
  ): Observable<VerificationData> {
    const verificationRef = doc(
      this.firestore,
      'declarations',
      declarationId,
      'verifications',
      verificationId
    );

    return docData(verificationRef, { idField: 'id' }).pipe(
      map(data => {
        if (!data) {
          throw new Error('Vérification non trouvée');
        }
        return {
          ...data,
          id: verificationId,
          declarationId,
        } as VerificationData;
      })
    );
  }

  /**
   * Met à jour le statut d'une vérification
   */
  updateVerification(
    declarationId: string,
    verificationId: string,
    update: VerificationUpdate
  ): Observable<void> {
    const verificationRef = doc(
      this.firestore,
      'declarations',
      declarationId,
      'verifications',
      verificationId
    );

    const updateData = {
      status: update.status,
      updatedAt: new Date().toISOString(),
      ...(update.adminNotes && { adminNotes: update.adminNotes }),
      ...(update.rejectionReason && { rejectionReason: update.rejectionReason }),
    };

    return from(updateDoc(verificationRef, updateData));
  }

  /**
   * Approuve une vérification
   */
  approveVerification(
    declarationId: string,
    verificationId: string,
    adminNotes?: string,
    matchingDeclarationId?: string // ID de la déclaration de perte correspondante
  ): Observable<void> {
    return this.updateVerificationStatus(declarationId, verificationId, {
      status: VerificationStatus.VERIFIED,
      adminNotes,
    }, matchingDeclarationId);
  }

  /**
   * Rejette une vérification
   */
  rejectVerification(
    declarationId: string,
    verificationId: string,
    rejectionReason: string,
    adminNotes?: string
  ): Observable<void> {
    return this.updateVerification(declarationId, verificationId, {
      status: VerificationStatus.REJECTED,
      rejectionReason,
      adminNotes,
    });
  }

  /**
   * Supprime une vérification
   */
  deleteVerification(
    declarationId: string,
    verificationId: string
  ): Observable<void> {
    const verificationRef = doc(
      this.firestore,
      'declarations',
      declarationId,
      'verifications',
      verificationId
    );

    return from(deleteDoc(verificationRef));
  }

  /**
   * Récupère les vérifications d'un utilisateur
   */
  getUserVerifications(userId: string): Observable<VerificationData[]> {
    const declarationsRef = collection(this.firestore, 'declarations');

    return from(getDocs(declarationsRef)).pipe(
      switchMap(async (snapshot) => {
        const userVerifications: VerificationData[] = [];

        for (const declarationDoc of snapshot.docs) {
          const verificationsRef = collection(
            this.firestore,
            'declarations',
            declarationDoc.id,
            'verifications'
          );

          const verificationsSnapshot = await getDocs(
            query(verificationsRef, where('userId', '==', userId))
          );

          verificationsSnapshot.docs.forEach(verificationDoc => {
            userVerifications.push({
              id: verificationDoc.id,
              declarationId: declarationDoc.id,
              ...verificationDoc.data()
            } as VerificationData);
          });
        }

        return userVerifications;
      })
    );
  }

  /**
   * Récupère les statistiques des vérifications
   */
  getVerificationStats(): Observable<{
    total: number;
    pending: number;
    verified: number;
    rejected: number;
  }> {
    const declarationsRef = collection(this.firestore, 'declarations');

    return from(getDocs(declarationsRef)).pipe(
      switchMap(async (snapshot) => {
        let total = 0;
        let pending = 0;
        let verified = 0;
        let rejected = 0;

        for (const declarationDoc of snapshot.docs) {
          const verificationsRef = collection(
            this.firestore,
            'declarations',
            declarationDoc.id,
            'verifications'
          );

          const verificationsSnapshot = await getDocs(verificationsRef);
          total += verificationsSnapshot.size;

          for (const verificationDoc of verificationsSnapshot.docs) {
            const status = verificationDoc.data()['status'];
            if (status === VerificationStatus.PENDING) {
              pending++;
            } else if (status === VerificationStatus.VERIFIED) {
              verified++;
            } else if (status === VerificationStatus.REJECTED) {
              rejected++;
            }
          }
        }

        return { total, pending, verified, rejected };
      })
    );
  }

  /**
   * Met à jour le statut d'une vérification (Admin)
   */
  updateVerificationStatus(
    declarationId: string,
    verificationId: string,
    update: VerificationUpdate,
    matchingDeclarationId?: string // ID de la déclaration de perte correspondante
  ): Observable<void> {
    const verificationRef = doc(
      this.firestore,
      'declarations',
      declarationId,
      'verifications',
      verificationId
    );

    return from(updateDoc(verificationRef, {
      status: update.status,
      adminNotes: update.adminNotes || null,
      rejectionReason: update.rejectionReason || null,
      updatedAt: new Date().toISOString()
    } as any)).pipe(
      switchMap(async () => {
        // Si la vérification est validée, on désactive les deux déclarations
        if (update.status === VerificationStatus.VERIFIED) {
          // 1. Désactiver la déclaration d'objet trouvé (celle qui contient la vérification)
          const foundDeclarationRef = doc(this.firestore, 'declarations', declarationId);
          await updateDoc(foundDeclarationRef, { 
            active: false, 
            status: 'resolved',
            resolvedAt: new Date().toISOString()
          });

          // 2. Désactiver la déclaration d'objet perdu correspondante
          // Si l'ID n'est pas fourni, on essaie de le récupérer depuis le document de vérification
          let targetMatchingId = matchingDeclarationId;
          
          if (!targetMatchingId) {
            const verificationSnap = await getDoc(verificationRef);
            if (verificationSnap.exists()) {
              const data = verificationSnap.data();
              targetMatchingId = data['matchingDeclarationId'];
            }
          }

          if (targetMatchingId) {
            const lostDeclarationRef = doc(this.firestore, 'declarations', targetMatchingId);
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
}
