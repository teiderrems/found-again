// services/auth.service.ts

import { Injectable } from '@angular/core';
import * as credentialType from '../types/user';
import {
   Auth,
   sendPasswordResetEmail,
   signInWithPopup,
   user,
   User,
   UserCredential,
} from '@angular/fire/auth';
import {
   createUserWithEmailAndPassword,
   signInWithEmailAndPassword,
   updatePassword
} from '@angular/fire/auth';
import { GoogleAuthProvider } from '@angular/fire/auth';
import { doc, Firestore, setDoc, docData, updateDoc, query, collection, where, getDocs } from '@angular/fire/firestore';
import { from, lastValueFrom, Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators'; // Ajout de 'map'
import { UserProfile, UpdateProfileData } from '../types/user'; // Assurez-vous d'importer ces types

@Injectable({
   providedIn: 'root',
})
export class AuthService {
   // Observable pour l'état d'authentification
   public readonly currentUser$: Observable<User | null>;
   private userCollectionName = 'users';

   constructor(
      private readonly firestore: Firestore,
      private readonly auth: Auth,
   ) {
      this.currentUser$ = user(auth);
      this.currentUser$.subscribe((u) => {
         if (u) {
            // Note: le champ $user n'est plus utilisé/nécessaire. Les composants doivent s'abonner à currentUser$
            // this.$user = value.email;
         }
      });
   }

   // --- Authentification (Méthodes existantes, retournant Observable) ---

   async signInGoogle(): Promise<boolean> {
      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      try {
         const userCredential = await signInWithPopup(this.auth, provider);
         const userEmail = userCredential.user.email as string;
         const newUid = userCredential.user.uid; // UID créé par Google

         console.log('Google Sign-In - Email:', userEmail, 'Nouvel UID:', newUid);

         // Vérifier si un document utilisateur existe déjà avec cet email
         const existingUser = await this.findUserByEmail(userEmail, false);
         
         if (existingUser && existingUser.uid !== newUid) {
            // Un utilisateur existe avec le même email mais un UID différent
            // Il faut fusionner les données au nouvel UID
            console.log('Fusion de compte détectée. Ancien UID:', existingUser.uid, 'Nouvel UID:', newUid);
            return await this.mergeUserAccounts(newUid, existingUser);
         } else if (existingUser && existingUser.uid === newUid) {
            // C'est le même utilisateur qui se reconnecte avec Google
            console.log('✓ Utilisateur réauthentifié avec le même UID');
            return true;
         }

         console.log('Aucun utilisateur existant, création d\'un nouveau compte...');

         // Si l'utilisateur n'existe pas, créer un nouveau compte
         return await this.registerUser(
            {
               email: userCredential.user.email as string,
               firstname: 'Unknown',
               lastname: 'Unknown',
               password: 'user1234',
            },
            userCredential.user,
         );
      } catch (error) {
         console.error('Erreur lors de la connexion Google:', error);
         throw error;
      }
   }

   signIn(credential: credentialType.LoginCredentials): Observable<UserCredential> {
      return from(
         signInWithEmailAndPassword(this.auth, credential.email!, credential.password!),
      );
   }

   signUp(credential: credentialType.RegisterCredentials): Observable<UserCredential> {
      return from(
         createUserWithEmailAndPassword(
            this.auth,
            credential.email!,
            credential.password!,
         ),
      );
   }

   logOut(): Observable<void> {
      return from(this.auth.signOut());
   }

   resetPassword(email: string): Observable<void> {
      return from(sendPasswordResetEmail(this.auth, email));
   }

   /**
    * Inscrit l'utilisateur (Auth) puis crée le document de profil (Firestore).
    * (Version asynchrone conservée de votre code)
    * @returns Promise<User> L'utilisateur nouvellement créé.
    */
   public async registerUser(
      data: credentialType.RegisterCredentials,
      user?: User,
   ): Promise<boolean> {
      try {
         if (!user) {
            const userCredential = await lastValueFrom(this.signUp(data)); // Convertir en Promise pour async/await
            const user = userCredential!.user;
            const userId = user.uid;
            const userDocRef = doc(this.firestore, this.userCollectionName, userId);
            const alreadyExists = await lastValueFrom(
               docData(userDocRef),
            ).then((docData) => !!docData);

            if (alreadyExists) {
               console.log('Le profil utilisateur existe déjà dans Firestore.');
               return true;
            }
            else {
               await setDoc(userDocRef, {
                  email: data.email,
                  firstname: data.firstname,
                  lastname: data.lastname,
                  createdAt: new Date(),
                  role: 'standard',
                  preferences: {
                     theme: 'dark',
                     notifications: true,
                  },
                  deleted: false,
               } as any);

               console.log(
                  'Utilisateur créé et données supplémentaires enregistrées avec succès !',
               );
            }
            return true;
         } else {
            const userDocRef = doc(this.firestore, this.userCollectionName, user.uid);

            await setDoc(userDocRef, {
               email: data.email,
               firstname: data.firstname,
               lastname: data.lastname,
               createdAt: new Date(),
               role: 'standard',
               preferences: {
                  theme: 'dark',
                  notifications: true,
               },
               deleted: false,
            } as any);
            await updatePassword(user,data.password);

            console.log(
               'Utilisateur créé et données supplémentaires enregistrées avec succès !',
            );
         }
         return true;
      } catch (error: any) {
         console.error(
            "Erreur lors de la création de l'utilisateur ou de l'enregistrement des données :",
            error.message,
         );
         throw error;
      }
   }

   /**
    * Récupère le profil d'un utilisateur spécifique sous forme d'Observable.
    * @param userId L'UID de l'utilisateur.
    * @returns Observable<UserProfile | undefined>
    */
   public getUserProfile(userId: string): Observable<UserProfile | undefined> {
      const userDocRef = doc(this.firestore, this.userCollectionName, userId);
      // docData émet les données du document, et se met à jour en temps réel
      return docData(userDocRef) as Observable<UserProfile | undefined>;
   }

   /**
    * Récupère le profil de l'utilisateur actuellement connecté.
    * @returns Observable<UserProfile | undefined>
    */
   public getCurrentUserProfile(): Observable<UserProfile | undefined> {
      // 1. Attendre l'utilisateur connecté (currentUser$)
      return this.currentUser$.pipe(
         // 2. Utiliser switchMap pour passer à l'Observable du profil
         switchMap((user) => {
            if (user?.uid) {
               return this.getUserProfile(user.uid);
            }
            // 3. Si non connecté, retourner un Observable vide/null
            return new Observable<undefined>();
         }),
      );
   }

   /**
    * Met à jour des champs spécifiques du profil utilisateur.
    * @param userId L'UID de l'utilisateur à mettre à jour.
    * @param data Les champs partiels à modifier.
    * @returns Observable<void>
    */
   public updateUserProfile(userId: string, data: UpdateProfileData): Observable<void> {
      const userDocRef = doc(this.firestore, this.userCollectionName, userId);
      // updateDoc retourne une Promise<void>, que nous enveloppons dans from()
      return from(updateDoc(userDocRef, data as { [key: string]: any }));
   }

   /**
    * Récupère l'UID de l'utilisateur actuellement connecté.
    * @returns string | null
    */
   public getCurrentUserId(): string | null {
      const currentUser = this.auth.currentUser;
      return currentUser ? currentUser.uid : null;
   }

   // ============= GESTION COMPTES SUPPRIMÉS =============

   /**
    * Recherche un utilisateur par email dans la collection users
    * @param email L'email à rechercher
    * @param includeDeleted Si true, inclut les comptes supprimés
    * @returns Promise<UserProfile | null>
    */
   private async findUserByEmail(email: string, includeDeleted: boolean = false): Promise<UserProfile | null> {
      try {
         const usersRef = collection(this.firestore, this.userCollectionName);
         // Chercher simplement par email
         const q = query(usersRef, where('email', '==', email));
         const querySnapshot = await getDocs(q);

         if (!querySnapshot.empty) {
            // Filtrer en JavaScript pour éviter les problèmes d'index Firestore
            for (const docSnapshot of querySnapshot.docs) {
               const data = docSnapshot.data() as any;
               const isDeleted = data.deleted === true;
               
               if (includeDeleted || !isDeleted) {
                  console.log('Utilisateur trouvé:', { email, deleted: isDeleted });
                  return { uid: docSnapshot.id, ...data } as UserProfile;
               }
            }
         }

         console.log('Aucun utilisateur trouvé avec l\'email:', email);
         return null;
      } catch (error) {
         console.error('Erreur lors de la recherche de l\'utilisateur:', error);
         return null;
      }
   }

   /**
    * Recherche un compte supprimé par email
    * @param email L'email à rechercher
    * @returns Promise<UserProfile | null>
    */
   private async findDeletedAccountByEmail(email: string): Promise<UserProfile | null> {
      try {
         const usersRef = collection(this.firestore, this.userCollectionName);
         const q = query(usersRef, where('email', '==', email), where('deleted', '==', true));
         const querySnapshot = await getDocs(q);

         if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            return { uid: doc.id, ...doc.data() } as UserProfile;
         }

         return null;
      } catch (error) {
         console.error('Erreur lors de la recherche du compte supprimé:', error);
         return null;
      }
   }

   /**
    * Fusionne deux comptes utilisateur quand un même email se connecte avec une autre méthode
    * @param newUid Le nouvel UID Firebase (ex: Google)
    * @param existingUser Le compte utilisateur existant
    * @returns Promise<boolean>
    */
   private async mergeUserAccounts(newUid: string, existingUser: UserProfile): Promise<boolean> {
      try {
         // Créer un nouveau document avec le nouvel UID
         const newUserDocRef = doc(this.firestore, this.userCollectionName, newUid);

         const mergedProfile: UserProfile = {
            uid: newUid,
            email: existingUser.email,
            firstname: existingUser.firstname || 'Unknown',
            lastname: existingUser.lastname || 'Unknown',
            createdAt: existingUser.createdAt || new Date(),
            role: existingUser.role || 'standard',
            preferences: existingUser.preferences || {
               theme: 'dark',
               notifications: true,
            },
            phone: existingUser.phone,
            avatarUrl: existingUser.avatarUrl,
            location: existingUser.location,
            bio: existingUser.bio,
            declarations: existingUser.declarations || [],
         };

         // Ajouter les propriétés de fusion
         const dataToSave = {
            ...mergedProfile,
            mergedAt: new Date(),
            previousUid: existingUser.uid,
         };

         // Créer le nouveau document
         await setDoc(newUserDocRef, dataToSave as any);

         // Marquer l'ancien compte comme supprimé
         const oldUserDocRef = doc(this.firestore, this.userCollectionName, existingUser.uid);
         await updateDoc(oldUserDocRef, {
            deleted: true,
            deletedAt: new Date(),
            mergedToUid: newUid,
         });

         console.log('Comptes fusionnés avec succès. Ancien UID:', existingUser.uid, '-> Nouvel UID:', newUid);
         return true;
      } catch (error) {
         console.error('Erreur lors de la fusion des comptes:', error);
         throw error;
      }
   }

   /**
    * Restaure un compte supprimé
    * @param newUid Le nouvel UID Firebase (depuis Google)
    * @param email L'email de l'utilisateur
    * @param deletedAccount Le compte supprimé à restaurer
    * @returns Promise<boolean>
    */
   private async restoreDeletedAccount(newUid: string, email: string, deletedAccount: UserProfile): Promise<boolean> {
      try {
         // Copier les données du ancien compte au nouveau UID
         const userDocRef = doc(this.firestore, this.userCollectionName, newUid);

         const restoredProfile: UserProfile = {
            uid: newUid,
            email: email,
            firstname: deletedAccount.firstname || 'Unknown',
            lastname: deletedAccount.lastname || 'Unknown',
            createdAt: deletedAccount.createdAt || new Date(),
            role: deletedAccount.role || 'standard',
            preferences: deletedAccount.preferences || {
               theme: 'dark',
               notifications: true,
            },
            phone: deletedAccount.phone,
            avatarUrl: deletedAccount.avatarUrl,
            location: deletedAccount.location,
            bio: deletedAccount.bio,
            declarations: deletedAccount.declarations || [],
         };

         // Ajouter les propriétés de restauration
         const dataToSave = {
            ...restoredProfile,
            deleted: false,
            deletedAt: null,
            restoredAt: new Date(),
         };

         await setDoc(userDocRef, dataToSave);

         console.log('Compte supprimé restauré avec succès pour le nouvel UID:', newUid);
         return true;
      } catch (error) {
         console.error('Erreur lors de la restauration du compte:', error);
         throw error;
      }
   }
}
