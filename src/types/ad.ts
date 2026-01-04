import { Timestamp } from '@angular/fire/firestore';

/**
 * Interface pour une publicité
 */
export interface Ad {
  id?: string;
  title: string;
  description: string;
  imageUrl: string;
  videoUrl?: string; // Lien vidéo (YouTube, Vimeo, etc.)
  linkUrl?: string;
  isActive: boolean;
  priority: number; // Plus le nombre est élevé, plus la priorité est haute
  createdAt: Date | Timestamp;
  updatedAt?: Date | Timestamp;
  startDate?: Date | Timestamp;
  endDate?: Date | Timestamp;
  impressions: number;
  clicks: number;
  targetAudience?: 'all' | 'lost' | 'found'; // Ciblage par type d'utilisateur
}

/**
 * Interface pour créer une nouvelle publicité
 */
export type CreateAdData = Omit<Ad, 'id' | 'createdAt' | 'updatedAt' | 'impressions' | 'clicks'>;

/**
 * Interface pour mettre à jour une publicité
 */
export type UpdateAdData = Partial<Omit<Ad, 'id' | 'createdAt'>>;
