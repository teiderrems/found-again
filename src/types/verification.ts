/**
 * Interface pour les données de vérification d'identité
 */
export interface VerificationData {
  id: string;
  declarationId: string;
  userId: string;
  identityDetails: string;
  additionalInfo: string;
  serialNumber?: string | null;
  status: 'pending' | 'verified' | 'rejected';
  timestamp: Date;
  updatedAt?: string;
  adminNotes?: string;
  rejectionReason?: string;
  matchingDeclarationId?: string; // ID de la déclaration correspondante (optionnel)
}

/**
 * Interface pour créer une vérification
 */
export interface VerificationCreate {
  identityDetails: string;
  additionalInfo: string;
  serialNumber?: string | null;
}

/**
 * Interface pour mettre à jour une vérification (admin)
 */
export interface VerificationUpdate {
  status: 'pending' | 'verified' | 'rejected';
  adminNotes?: string;
  rejectionReason?: string;
}

/**
 * Enum pour les statuts de vérification
 */
export enum VerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}
