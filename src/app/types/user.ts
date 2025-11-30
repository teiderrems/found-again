/**
 * Interface pour les données de profil stockées dans Firestore
 */
export interface UserProfile {
  email: string;
  firstname: string;
  lastname: string;
  createdAt: Date; // Timestamp Firestore stocké comme Date
  role: 'standard' | 'admin';
  preferences: {
    theme: 'light' | 'dark';
    notifications: boolean;
  };
}

/**
 * Interface pour les données nécessaires à l'inscription (Auth + Firestore)
 */
export interface RegisterCredentials {
  email: string;
  password: string;
  firstname: string;
  lastname: string;
}

/**
 * Interface pour les données nécessaires à la connexion (Auth + Firestore)
 */
export type LoginCredentials=Omit<RegisterCredentials,"firstname"|"lastname">

/**
 * Interface pour la mise à jour des données
 */
export type UpdateProfileData = Partial<Omit<UserProfile, 'email' | 'createdAt'>>;