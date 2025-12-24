import { Injectable, inject } from '@angular/core';
import { Observable, from, switchMap, map, catchError } from 'rxjs';

import {
   Firestore,
   collection,
   addDoc,
   collectionData,
   doc,
   DocumentReference,
   setDoc,
   deleteDoc,
   getDoc,
   Query,
   query,
   where,
} from '@angular/fire/firestore';

import { FirebaseStorageService } from './firebase-storage.service';
import {
   DeclarationCreate,
   DeclarationData,
   DeclarationType,
   ImageType,
} from '../types/declaration';

@Injectable({
   providedIn: 'root',
})
export class DeclarationService {
   private firestore: Firestore = inject(Firestore);
   private storageService: FirebaseStorageService = inject(FirebaseStorageService);

   private readonly LOSS_COLLECTION = 'loss';
   private readonly FOUND_COLLECTION = 'found';

   /**
    * Retourne la référence de collection appropriée basée sur le type.
    */
   private getCollectionRef() {
      return collection(this.firestore, "declarations");
   }

   /**
    * Crée une nouvelle déclaration dans Firestore, gère l'upload des images via Supabase Storage.
    */
   createDeclaration(
      declaration: DeclarationCreate,
      type: DeclarationType,
   ): Observable<string> {
      const colRef = this.getCollectionRef();

      const initialData = {
         ...declaration,
         images: [],
         createdAt: new Date().toISOString(),
      };

      return from(addDoc(colRef, initialData)).pipe(
         switchMap((docRef: DocumentReference) => {
            const declarationId = docRef.id;

            const uploadTask$ = from(this.storageService.uploadFiles(declaration.images, declarationId));
            const uploadResult$ =
               declaration.images.length > 0 ? uploadTask$ : from([[] as ImageType[]]);

            return uploadResult$.pipe(
               switchMap((imageUrls: ImageType[]) => {
                  const dataToUpdate = {
                     ...declaration,
                     images: imageUrls,
                  };

                  const docRefUpdate = doc(colRef, declarationId);
                  return from(setDoc(docRefUpdate, dataToUpdate, { merge: true })).pipe(
                     map(() => declarationId),
                  );
               }),
            );
         }),
         catchError((e) => {
            console.error('Erreur dans createDeclaration:', e);
            throw e;
         }),
      );
   }

   /**
    * Récupère toutes les déclarations d'un certain type.
    */
   getDeclarations(): Observable<DeclarationData[]> {
      const colRef = this.getCollectionRef();
      return collectionData(colRef, { idField: 'id' }) as Observable<DeclarationData[]>;
   }

   /**
    * Modifie une déclaration existante.
    */
   updateDeclaration(
      id: string,
      declaration: DeclarationCreate,
      existingImageUrls: string[],
      type: DeclarationType,
   ): Observable<void> {
      const colRef = this.getCollectionRef();
      const docRef = doc(colRef, id);

      const newFilesToUpload = declaration.images;

      const uploadTask$ = from(this.storageService.uploadFiles(newFilesToUpload));

      const uploadResult$ =
         newFilesToUpload.length > 0 ? uploadTask$ : from([[] as ImageType[]]);

      return uploadResult$.pipe(
         switchMap((newImageUrls: ImageType[]) => {
            const finalImageUrls = [...existingImageUrls, ...newImageUrls];

            const dataToUpdate = {
               ...declaration,
               images: finalImageUrls,
               updatedAt: new Date().toISOString(),
            };

            return from(setDoc(docRef, dataToUpdate, { merge: true })).pipe(
               map(() => undefined),
            );
         }),
         catchError((e) => {
            console.error('Erreur dans updateDeclaration:', e);
            throw e;
         }),
      );
   }

   /**
    * Récupère les déclarations d'un certain type, filtrées par catégorie.
    *
    * @param type Le type de déclaration (LOSS ou FOUND).
    * @param category La valeur de la catégorie sur laquelle filtrer (ex: 'Animaux', 'Électronique').
    * @returns Un Observable de la liste des déclarations filtrées.
    */
   getDeclarationsByCategory(
      type: DeclarationType,
      category: string,
   ): Observable<DeclarationData[]> {
      const colRef = this.getCollectionRef();
      const categoryFilter = where('category', '==', category);
      const declarationsQuery: Query<DeclarationData> = query(
         colRef as Query<DeclarationData>,
         categoryFilter,
      );

      return collectionData(declarationsQuery, { idField: 'id' }) as Observable<
         DeclarationData[]
      >;
   }

   /**
    * Supprime une déclaration (document Firestore) et tous ses fichiers associés (Supabase Storage).
    */
   deleteDeclaration(
      id: string,
      type: DeclarationType,
      imageUrls: ImageType[],
   ): Observable<void> {
      const colRef = this.getCollectionRef();
      const docRef = doc(colRef, id);

      const deleteStorage$ = from(this.storageService.deleteFiles(imageUrls)).pipe(
         catchError((storageError) => {
            console.warn(
               `Avertissement: Échec lors de la suppression des fichiers Supabase Storage pour ID ${id}.`,
               storageError,
            );
            return [null];
         }),
      );

      return deleteStorage$.pipe(
         switchMap(() => from(deleteDoc(docRef))),
         catchError((e) => {
            console.error(`Échec critique de la suppression de la déclaration ${id}:`, e);
            throw e;
         }),
      );
   }

   /**
    * Récupère une déclaration par son ID
    */
   getDeclarationById(id: string): Observable<DeclarationData> {
      return from(getDoc(doc(this.firestore, 'declarations', id))).pipe(
         map((docSnapshot) => {
            if (!docSnapshot.exists()) {
               throw new Error('Déclaration non trouvée');
            }
            return {
               id: docSnapshot.id,
               ...docSnapshot.data()
            } as DeclarationData;
         }),
         catchError((e) => {
            console.error(`Erreur lors de la récupération de la déclaration ${id}:`, e);
            throw e;
         })
      );
   }

   /**
    * Vérifie l'identité d'un utilisateur qui prétend être propriétaire de l'objet
    */
   verifyIdentity(verificationData: {
      declarationId: string;
      identityDetails: string;
      additionalInfo: string;
      serialNumber?: string | null;
      timestamp: Date;
   }): Observable<{ isVerified: boolean; message: string }> {
      return from(
         setDoc(
            doc(this.firestore, 'declarations', verificationData.declarationId, 'verifications', new Date().getTime().toString()),
            {
               identityDetails: verificationData.identityDetails,
               additionalInfo: verificationData.additionalInfo,
               serialNumber: verificationData.serialNumber || null,
               timestamp: verificationData.timestamp,
               status: 'pending'
            }
         )
      ).pipe(
         map(() => ({
            isVerified: true,
            message: 'Vérification enregistrée avec succès'
         })),
         catchError((e) => {
            console.error('Erreur lors de la vérification d\'identité:', e);
            return from(Promise.resolve({
               isVerified: false,
               message: 'Erreur lors de la vérification'
            }));
         })
      );
   }
}
