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

import { SupabaseStorageService } from './supabase-storage.service';
import {
   DeclarationCreate,
   DeclarationData,
   DeclarationType,
} from '../types/declaration';

@Injectable({
   providedIn: 'root',
})
export class DeclarationService {
   private firestore: Firestore = inject(Firestore);
   private storageService: SupabaseStorageService = inject(SupabaseStorageService);

   private readonly LOSS_COLLECTION = 'loss';
   private readonly FOUND_COLLECTION = 'found';

   /**
    * Retourne la référence de collection appropriée basée sur le type.
    */
   private getCollectionRef(type: DeclarationType) {
      const path =
         type === DeclarationType.LOSS ? this.LOSS_COLLECTION : this.FOUND_COLLECTION;
      return collection(this.firestore, path);
   }

   /**
    * Crée une nouvelle déclaration dans Firestore, gère l'upload des images via Supabase Storage.
    */
   createDeclaration(
      declaration: DeclarationCreate,
      type: DeclarationType,
   ): Observable<string> {
      const colRef = this.getCollectionRef(type);

      const initialData = {
         ...declaration,
         images: [],
         createdAt: new Date().toISOString(),
      };

      return from(addDoc(colRef, initialData)).pipe(
         switchMap((docRef: DocumentReference) => {
            const declarationId = docRef.id;

            const uploadTask$ = from(this.storageService.uploadFiles(declaration.images));
            const uploadResult$ =
               declaration.images.length > 0 ? uploadTask$ : from([[] as string[]]);

            return uploadResult$.pipe(
               switchMap((imageUrls: string[]) => {
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
   getDeclarations(type: DeclarationType): Observable<DeclarationData[]> {
      const colRef = this.getCollectionRef(type);
      return collectionData(colRef, { idField: 'id' }) as Observable<DeclarationData[]>;
   }

   /**
    * Récupère une déclaration par son ID.
    */
   getDeclarationById(
      id: string,
      type: DeclarationType,
   ): Observable<DeclarationData | undefined> {
      const docRef = doc(this.getCollectionRef(type), id);

      return from(getDoc(docRef)).pipe(
         map((snapshot) => {
            if (snapshot.exists()) {
               return {
                  id: snapshot.id,
                  ...(snapshot.data() as Omit<DeclarationData, 'id'>),
               } as DeclarationData;
            }
            return undefined;
         }),
      );
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
      const colRef = this.getCollectionRef(type);
      const docRef = doc(colRef, id);

      const newFilesToUpload = declaration.images;

      const uploadTask$ = from(this.storageService.uploadFiles(newFilesToUpload));

      const uploadResult$ =
         newFilesToUpload.length > 0 ? uploadTask$ : from([[] as string[]]);

      return uploadResult$.pipe(
         switchMap((newImageUrls: string[]) => {
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
      const colRef = this.getCollectionRef(type);
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
      imageUrls: string[],
   ): Observable<void> {
      const colRef = this.getCollectionRef(type);
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
}
