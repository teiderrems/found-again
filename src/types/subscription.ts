import { Timestamp } from '@angular/fire/firestore';

/**
 * Types de plans d'abonnement
 */
export type SubscriptionPlan = 'free' | 'premium_monthly' | 'premium_yearly';

/**
 * Statut de l'abonnement
 */
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'pending';

/**
 * Interface pour un abonnement utilisateur
 */
export interface Subscription {
  id?: string;
  userId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  startDate: Date | Timestamp;
  endDate: Date | Timestamp;
  autoRenew: boolean;
  createdAt: Date | Timestamp;
  updatedAt?: Date | Timestamp;
  paymentMethod?: string;
  transactionId?: string;
  amount: number;
  currency: string;
}

/**
 * Interface pour les détails d'un plan d'abonnement
 */
export interface SubscriptionPlanDetails {
  id: SubscriptionPlan;
  name: string;
  description: string;
  price: number;
  currency: string;
  duration: number; // En jours
  features: string[];
  isPopular?: boolean;
}

/**
 * Plans d'abonnement disponibles
 */
export const SUBSCRIPTION_PLANS: SubscriptionPlanDetails[] = [
  {
    id: 'free',
    name: 'Gratuit',
    description: 'Accès basique avec publicités',
    price: 0,
    currency: 'EUR',
    duration: 0,
    features: [
      'Déclarer des objets perdus/trouvés',
      'Rechercher des objets',
      'Notifications de base',
      'Affichage de publicités'
    ]
  },
  {
    id: 'premium_monthly',
    name: 'Premium Mensuel',
    description: 'Accès complet sans publicités',
    price: 4.99,
    currency: 'EUR',
    duration: 30,
    features: [
      'Sans publicités',
      'Notifications prioritaires',
      'Alertes de correspondance instantanées',
      'Badge Premium sur le profil',
      'Support prioritaire',
      'Statistiques avancées'
    ],
    isPopular: true
  },
  {
    id: 'premium_yearly',
    name: 'Premium Annuel',
    description: 'Meilleure offre - 2 mois offerts',
    price: 49.99,
    currency: 'EUR',
    duration: 365,
    features: [
      'Tous les avantages Premium',
      '2 mois gratuits',
      'Accès aux nouvelles fonctionnalités en avant-première'
    ]
  }
];

/**
 * Interface pour créer un nouvel abonnement
 */
export type CreateSubscriptionData = Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Interface pour mettre à jour un abonnement
 */
export type UpdateSubscriptionData = Partial<Omit<Subscription, 'id' | 'userId' | 'createdAt'>>;
