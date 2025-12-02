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
   images: File[];
   type:DeclarationType;
}

export interface DeclarationData {
   id: string;
   title: string;
   category: string;
   description: string;
   location: string;
   coordinates?: { lat: number; lng: number };
   date: string;
   contactEmail: string;
   contactPhone: string;
   images: string[];
   type:DeclarationType;
}
