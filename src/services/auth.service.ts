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
import { doc, Firestore, setDoc, docData, updateDoc } from '@angular/fire/firestore';
import { from, lastValueFrom, Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators'; // 👈 Ajout de 'map'
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

            await setDoc(userDocRef, {
               email: user.email,
               firstname: data.firstname,
               lastname: data.lastname,
               createdAt: new Date(),
               role: 'standard',
               preferences: {
                  theme: 'dark',
                  notifications: true,
               },
            } as UserProfile); // Ajouter un cast si nécessaire pour la rigueur TypeScript

            console.log(
               'Utilisateur créé et données supplémentaires enregistrées avec succès !',
            );
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
            } as UserProfile); // Ajouter un cast si nécessaire pour la rigueur TypeScript
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
}
