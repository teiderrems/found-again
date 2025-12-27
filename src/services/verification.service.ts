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
  DocumentReference
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
    verification: VerificationCreate
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
    };

    return from(addDoc(verificationsRef, verificationData)).pipe(
      map((docRef: DocumentReference) => docRef.id)
    );
  }

  /**
   * Récupère toutes les vérifications d'une déclaration
   */
  getVerificationsByDeclaration(declarationId: string): Observable<VerificationData[]> {
    const verificationsRef = collection(
      this.firestore,
      'declarations',
      declarationId,
      'verifications'
    );

    return from(getDocs(verificationsRef)).pipe(
      map(snapshot =>
        snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as VerificationData))
      )
    );
  }

  /**
   * Récupère toutes les vérifications (tous statuts confondus)
   */
  getAllVerifications(): Observable<VerificationData[]> {
    const declarationsRef = collection(this.firestore, 'declarations');

    return from(getDocs(declarationsRef)).pipe(
      switchMap(async (snapshot) => {
        const allVerifications: VerificationData[] = [];

        for (const declarationDoc of snapshot.docs) {
          const verificationsRef = collection(
            this.firestore,
            'declarations',
            declarationDoc.id,
            'verifications'
          );

          const verificationsSnapshot = await getDocs(verificationsRef);

          verificationsSnapshot.docs.forEach(verificationDoc => {
            allVerifications.push({
              id: verificationDoc.id,
              declarationId: declarationDoc.id,
              ...verificationDoc.data()
            } as VerificationData);
          });
        }

        return allVerifications;
      })
    );
  }

  /**
   * Récupère toutes les vérifications en attente
   */
  getPendingVerifications(): Observable<VerificationData[]> {
    const declarationsRef = collection(this.firestore, 'declarations');

    return from(getDocs(declarationsRef)).pipe(
      switchMap(async (snapshot) => {
        const allVerifications: VerificationData[] = [];

        for (const declarationDoc of snapshot.docs) {
          const verificationsRef = collection(
            this.firestore,
            'declarations',
            declarationDoc.id,
            'verifications'
          );

          const verificationsSnapshot = await getDocs(
            query(verificationsRef, where('status', '==', VerificationStatus.PENDING))
          );

          verificationsSnapshot.docs.forEach(verificationDoc => {
            allVerifications.push({
              id: verificationDoc.id,
              declarationId: declarationDoc.id,
              ...verificationDoc.data()
            } as VerificationData);
          });
        }

        return allVerifications;
      })
    );
  }

  /**
   * Récupère une vérification spécifique
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

    return from(getDoc(verificationRef)).pipe(
      map(docSnapshot => {
        if (!docSnapshot.exists()) {
          throw new Error('Vérification non trouvée');
        }
        return {
          id: docSnapshot.id,
          declarationId,
          ...docSnapshot.data()
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
    adminNotes?: string
  ): Observable<void> {
    return this.updateVerification(declarationId, verificationId, {
      status: VerificationStatus.VERIFIED,
      adminNotes,
    });
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
}
