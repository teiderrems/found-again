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
}
