export enum DeclarationType {
   LOSS = 'loss',
   FOUND = 'found',
}

export interface DeclarationCreate {
   title: string;
   category: string;
   description: string;
   location: string;
   coordinates?: { lat: number; lng: number };
   date: string;
   contactEmail: string;
   contactPhone: string;
   userId?: string;
   images: File[];
   type: DeclarationType;
}

export interface ImageType {
   fullPath: string;
   downloadURL: string;
}

export interface DeclarationData {
   id: string;
   title: string;
   category: string;
   description: string;
   createdAt: string;
   location: string;
   userId?: string;
   coordinates?: { lat: number; lng: number };
   date: string;
   contactEmail: string;
   contactPhone: string;
   images: ImageType[];
   type: DeclarationType;
   active?: boolean;
}

export interface DeclarationMatch {
   declaration: DeclarationData;
   matchingWith: DeclarationData;
   confidence: number;
   reason: string;
}

export interface MatchingDocument {
   userId: string;
   declarationId1: string;
   declarationId2: string;
   confidence: number;
   reason: string;
   type: 'loss_to_found' | 'found_to_loss';
   status: 'pending' | 'confirmed' | 'rejected' | 'closed';
   createdAt: Date;
   updatedAt: Date;
}
