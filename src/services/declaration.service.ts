import { Injectable, inject, Injector, runInInjectionContext } from '@angular/core';
import { Observable, from, switchMap, map, catchError, of, take } from 'rxjs';

import {
   Firestore,
   collection,
   addDoc,
   collectionData,
   doc,
   DocumentReference,
   setDoc,
   updateDoc,
   deleteDoc,
   getDoc,
   Query,
   query,
   where,
   and,
   QueryDocumentSnapshot,
   DocumentData,
} from '@angular/fire/firestore';

import { FirebaseStorageService } from './firebase-storage.service';
import {
   DeclarationCreate,
   DeclarationData,
   DeclarationType,
   ImageType,
} from '../types/declaration';

export interface PaginatedResult<T> {
   items: T[];
   lastDoc: QueryDocumentSnapshot<DocumentData> | null;
   hasMore: boolean;
   totalFiltered?: number;
}

@Injectable({
   providedIn: 'root',
})
export class DeclarationService {
   private firestore: Firestore = inject(Firestore);
   private storageService: FirebaseStorageService = inject(FirebaseStorageService);
   private injector = inject(Injector);

   // collections kept inline; constants removed to avoid unused-field warnings

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
      _type?: DeclarationType,
   ): Observable<string> {
      const colRef = this.getCollectionRef();

      const initialData = {
         ...declaration,
         images: [],
         createdAt: new Date().toISOString(),
         active: true,
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
      return runInInjectionContext(this.injector, () => collectionData(colRef, { idField: 'id' }) as Observable<DeclarationData[]>);
   }

   /**
    * Récupère seulement les déclarations actives (côté Firestore).
    */
   getActiveDeclarations(): Observable<DeclarationData[]> {
      const colRef = this.getCollectionRef();
      const activeFilter = where('active', '==', true);
      const declarationsQuery = query(colRef, activeFilter);
      return runInInjectionContext(this.injector, () => collectionData(declarationsQuery, { idField: 'id' }) as Observable<DeclarationData[]>);
   }

   /**
    * Récupère les déclarations actives avec pagination côté Firestore.
    * Utilise runInInjectionContext pour éviter les problèmes de contexte d'injection.
    * @param pageSize Nombre d'éléments par page
    * @param skipCount Nombre d'éléments à sauter (pour la pagination offset)
    * @param filters Filtres optionnels (type, searchTerm, category, dateFrom, dateTo)
    */
   getActiveDeclarationsPaginated(
      pageSize: number = 12,
      skipCount: number = 0,
      filters?: {
         type?: 'all' | 'loss' | 'found';
         searchTerm?: string;
         category?: string;
         condition?: string;
         dateFrom?: Date | null;
         dateTo?: Date | null;
         location?: string;
      },
      userId?: string
    ): Observable<PaginatedResult<DeclarationData>> {
      // Exécuter dans le contexte d'injection Angular
      return runInInjectionContext(this.injector, () => {
         const colRef = this.getCollectionRef();
         const simpleQuery = query(colRef, and(where('active', '==', true),where('userId', '!=', userId ?? '')));

         return collectionData(simpleQuery, { idField: 'id' }).pipe(
            take(1),
            map((allItems) => {
               let items = allItems as DeclarationData[];

               // Filtrage côté client
               if (filters?.type && filters.type !== 'all') {
                  items = items.filter(item => item.type === filters.type);
               }

               if (filters?.category) {
                  items = items.filter(item =>
                     item.category.toLowerCase() === filters.category!.toLowerCase()
                  );
               }

               if (filters?.condition) {
                  items = items.filter(item => item.condition === filters.condition);
               }

               if (filters?.dateFrom) {
                  const fromDate = filters.dateFrom.toISOString().split('T')[0];
                  items = items.filter(item => item.date >= fromDate);
               }

               if (filters?.dateTo) {
                  const toDate = filters.dateTo.toISOString().split('T')[0];
                  items = items.filter(item => item.date <= toDate);
               }

               if (filters?.searchTerm) {
                  const lowerCaseTerm = filters.searchTerm.toLowerCase().trim();
                  items = items.filter((declaration) => {
                     const inCategory = declaration.category.toLowerCase().includes(lowerCaseTerm);
                     const inTitle = declaration.title.toLowerCase().includes(lowerCaseTerm);
                     const inDescription = declaration.description.toLowerCase().includes(lowerCaseTerm);
                     const inLocation = declaration.location.toLowerCase().includes(lowerCaseTerm);
                     return inCategory || inTitle || inDescription || inLocation;
                  });
               }

               if (filters?.location) {
                  const lowerCaseLocation = filters.location.toLowerCase().trim();
                  items = items.filter((declaration) =>
                     declaration.location.toLowerCase().includes(lowerCaseLocation)
                  );
               }

               // Trier par date décroissante
               items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

               const totalFiltered = items.length;

               // Pagination offset-based
               const paginatedItems = items.slice(skipCount, skipCount + pageSize);

               return {
                  items: paginatedItems,
                  lastDoc: null,
                  hasMore: skipCount + pageSize < totalFiltered,
                  totalFiltered
               };
            }),
            catchError((e) => {
               console.error('Erreur lors de la récupération paginée des déclarations:', e);
               return of({
                  items: [],
                  lastDoc: null,
                  hasMore: false,
                  totalFiltered: 0
               });
            })
         );
      });
   }

   /**
    * Compte le nombre total de déclarations actives (pour affichage)
    * Utilise runInInjectionContext pour éviter les problèmes de contexte d'injection.
    */
   getActiveDeclarationsCount(filters?: {
      type?: 'all' | 'loss' | 'found';
      category?: string;
      dateFrom?: Date | null;
      dateTo?: Date | null;
   }): Observable<number> {
      return runInInjectionContext(this.injector, () => {
         const colRef = this.getCollectionRef();
         const simpleQuery = query(colRef, where('active', '==', true));

         return collectionData(simpleQuery, { idField: 'id' }).pipe(
            take(1),
            map((allItems) => {
               let items = allItems as DeclarationData[];

               if (filters?.type && filters.type !== 'all') {
                  items = items.filter(item => item.type === filters.type);
               }

               if (filters?.category) {
                  items = items.filter(item =>
                     item.category.toLowerCase() === filters.category!.toLowerCase()
                  );
               }

               if (filters?.dateFrom) {
                  const fromDate = filters.dateFrom.toISOString().split('T')[0];
                  items = items.filter(item => item.date >= fromDate);
               }

               if (filters?.dateTo) {
                  const toDate = filters.dateTo.toISOString().split('T')[0];
                  items = items.filter(item => item.date <= toDate);
               }

               return items.length;
            }),
            catchError((e) => {
               console.error('Erreur lors du comptage des déclarations:', e);
               return of(0);
            })
         );
      });
   }

   /**
    * Modifie une déclaration existante.
    */
   updateDeclaration(
      id: string,
      declaration: DeclarationCreate,
      existingImageUrls: string[],
      _type?: DeclarationType,
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
      _type: DeclarationType,
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
    * Récupère les déclarations d'un certain type, filtrées par ID utilisateur.
    *
    * @param userId L'ID de l'utilisateur pour lequel récupérer les déclarations.
    * @returns Un Observable de la liste des déclarations filtrées par utilisateur.
    */
   getDeclarationsByUserId(userId: string): Observable<DeclarationData[]> {
      const colRef = this.getCollectionRef();
      const userFilter = where('userId', '==', userId);
      const declarationsQuery: Query<DeclarationData> = query(
         colRef as Query<DeclarationData>,
         userFilter,
      );

      return collectionData(declarationsQuery, { idField: 'id' }) as Observable<
         DeclarationData[]
      >;
   }

   /**
    * Récupère les déclarations d'un certain type, filtrées par localisation (coordonnées).
    *
    * @param type Le type de déclaration (LOSS ou FOUND).
    * @param lat La latitude pour le filtrage.
    * @param lng La longitude pour le filtrage.
    * @returns Un Observable de la liste des déclarations filtrées par localisation.
    */
   getDeclarationsByLocation(
      _type: DeclarationType,
      lat: number,
      lng: number,
   ): Observable<DeclarationData[]> {
      const colRef = this.getCollectionRef();
      const latFilter = where('coordinates.lat', '==', lat);
      const lngFilter = where('coordinates.lng', '==', lng);
      const declarationsQuery: Query<DeclarationData> = query(
         colRef as Query<DeclarationData>,
         latFilter,
         lngFilter,
      );

      return collectionData(declarationsQuery, { idField: 'id' }) as Observable<
         DeclarationData[]
      >;
   }

   /**
    * Récupère les déclarations d'un certain type, filtrées par date.
    *
    * @param type Le type de déclaration (LOSS ou FOUND).
    * @param date La date (ISO string) pour le filtrage.
    * @returns Un Observable de la liste des déclarations filtrées par date.
    */
   getDeclarationsByDate(
      _type: DeclarationType,
      date: string,
   ): Observable<DeclarationData[]> {
      const colRef = this.getCollectionRef();
      const dateFilter = where('date', '==', date);
      const declarationsQuery: Query<DeclarationData> = query(
         colRef as Query<DeclarationData>,
         dateFilter,
      );

      return collectionData(declarationsQuery, { idField: 'id' }) as Observable<
         DeclarationData[]
      >;
   }


   /**
    * Récupère les déclarations d'un certain type, filtrées par catégorie ou titre (termes de recherche) ou description.
    *
    * @param type Le type de déclaration (LOSS ou FOUND).
    * @param searchTerm Le terme de recherche pour le filtrage (catégorie, titre ou description).
    * @returns Un Observable de la liste des déclarations filtrées.
    */
   getDeclarationsBySearchTerm(
      searchTerm: string,
   ): Observable<DeclarationData[]> {
      const colRef = this.getCollectionRef();
      const lowerCaseTerm = searchTerm.toLowerCase().trim();
      const declarationsQuery: Query<DeclarationData> = query(
         colRef as Query<DeclarationData>
      );

      return collectionData(declarationsQuery, { idField: 'id' }).pipe(
         map((declarations: DeclarationData[]) =>
            declarations.filter((declaration) => {
               const inCategory =
                  declaration.category.toLowerCase().includes(lowerCaseTerm);
               const inTitle =
                  declaration.title.toLowerCase().includes(lowerCaseTerm);
               const inDescription =
                  declaration.description.toLowerCase().includes(lowerCaseTerm);
               return inCategory || inTitle || inDescription;
            }),
         ),
      );
   }

   /**
    * Récupère les déclarations actives filtrées par terme de recherche (côté Firestore).
    */
   getActiveDeclarationsBySearchTerm(
      searchTerm: string,
   ): Observable<DeclarationData[]> {
      const colRef = this.getCollectionRef();
      const lowerCaseTerm = searchTerm.toLowerCase().trim();
      const activeFilter = where('active', '==', true);
      const declarationsQuery = query(colRef, activeFilter);

      return runInInjectionContext(this.injector, () => (collectionData(declarationsQuery, { idField: 'id' }) as Observable<any[]>)).pipe(
         map((declarations: any[]) =>
            (declarations as DeclarationData[]).filter((declaration) => {
               const inCategory =
                  declaration.category.toLowerCase().includes(lowerCaseTerm);
               const inTitle =
                  declaration.title.toLowerCase().includes(lowerCaseTerm);
               const inDescription =
                  declaration.description.toLowerCase().includes(lowerCaseTerm);
               return inCategory || inTitle || inDescription;
            }),
         ),
      );
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

   /**
    * Supprime une déclaration par son ID (réservé aux administrateurs).
    * Récupère d'abord la déclaration pour supprimer les images associées.
    */
   deleteDeclarationAsAdmin(declarationId: string): Observable<void> {
      return this.getDeclarationById(declarationId).pipe(
         switchMap((declaration) => {
            // Appelle la méthode de suppression existante avec tous les paramètres
            return this.deleteDeclaration(
               declarationId,
               declaration.type,
               declaration.images || []
            );
         }),
         catchError((e) => {
            console.error(`Erreur lors de la suppression de la déclaration ${declarationId}:`, e);
            throw e;
         })
      );
   }

   /**
    * Activate or deactivate a declaration
    */
   toggleDeclarationActive(declarationId: string, active: boolean): Observable<void> {
      const colRef = this.getCollectionRef();
      const docRef = doc(colRef, declarationId);

      return from(updateDoc(docRef, { active })).pipe(
         map(() => undefined),
         catchError((e) => {
            console.error(`Erreur lors de la modification du statut de la déclaration ${declarationId}:`, e);
            throw e;
         })
      );
   }

   /**
    * Deactivate loss declarations (when the owner found their item)
    */
   deactivateLossDeclaration(declarationId: string): Observable<void> {
      return this.toggleDeclarationActive(declarationId, false);
   }

   /**
    * Activate a declaration
    */
   activateDeclaration(declarationId: string): Observable<void> {
      return this.toggleDeclarationActive(declarationId, true);
   }


}
