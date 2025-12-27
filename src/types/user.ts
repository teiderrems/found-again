/**
 * Interface pour une déclaration (objet perdu/trouvé)
 */
export interface Declaration {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  type: 'lost' | 'found';
  createdAt: Date;
  userId: string;
}

/**
 * Interface pour les données de profil stockées dans Firestore
 */
export interface UserProfile {
  uid: string;
  email: string;
  firstname: string;
  lastname: string;
  createdAt: Date;
  role: 'standard' | 'admin';
  preferences: {
    theme: 'light' | 'dark';
    notifications: boolean;
    emailNotifications?: boolean;
    declarationUpdates?: boolean;
    matchAlerts?: boolean;
    publicProfile?: boolean;
    showDeclarations?: boolean;
  };
  phone?: string;
  avatarUrl?: string;
  location?: string;
  bio?: string;
  declarations?: Declaration[];
}

/**
 * Interface pour les données de profil stockées dans Firestore
 */
export interface UserStats {
  totalDeclarations: number;
  foundDeclarations: number;
  pendingDeclarations: number;
  successRate: number;
  objectsReturned: number;
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