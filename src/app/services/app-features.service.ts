// services/app-features.service.ts
import { Injectable } from '@angular/core';

export interface AppFeature {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  route?: string;
  action?: string;
  stats?: string;
  benefits: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AppFeaturesService {
  
  getFeatures(): AppFeature[] {
    return [
      {
        id: '1',
        title: 'Déclaration Rapide',
        description: 'Signalez un objet perdu ou retrouvé en quelques minutes avec notre formulaire intuitif',
        icon: 'speed',
        color: '#3B82F6',
        route: '/declarer',
        stats: '2 min en moyenne',
        benefits: [
          'Formulaire simplifié et guidé',
          'Sauvegarde automatique',
          'Validation en temps réel',
          'Interface mobile optimisée'
        ]
      },
      {
        id: '2',
        title: 'Recherche Avancée',
        description: 'Trouvez facilement parmi les milliers d\'objets déclarés grâce à notre moteur de recherche intelligent',
        icon: 'search',
        color: '#10B981',
        route: '/rechercher',
        stats: '95% de pertinence',
        benefits: [
          'Recherche par mot-clé et catégorie',
          'Filtres géolocalisés',
          'Reconnaissance d\'image',
          'Suggestions intelligentes'
        ]
      },
      {
        id: '3',
        title: 'Notifications Intelligentes',
        description: 'Soyez alerté instantanément lorsqu\'une correspondance est trouvée avec votre déclaration',
        icon: 'notifications',
        color: '#F59E0B',
        action: 'configure-notifications',
        stats: 'Alertes en temps réel',
        benefits: [
          'Notifications push et email',
          'Correspondances automatiques',
          'Alertes géolocalisées',
          'Personnalisation des préférences'
        ]
      },
      {
        id: '4',
        title: 'Sécurité & Confidentialité',
        description: 'Vos données personnelles sont protégées et votre anonymat est préservé',
        icon: 'security',
        color: '#EF4444',
        benefits: [
          'Chiffrement des données',
          'Anonymat garanti',
          'Contact sécurisé',
          'Suppression automatique'
        ]
      },
      {
        id: '5',
        title: 'Géolocalisation',
        description: 'Localisez précisément le lieu de perte ou de trouvaille sur une carte interactive',
        icon: 'location_on',
        color: '#8B5CF6',
        stats: 'Précision de 10m',
        benefits: [
          'Carte interactive',
          'Suggestions de lieux',
          'Zone de recherche',
          'Points de dépôt partenaires'
        ]
      },
      {
        id: '6',
        title: 'Communauté Active',
        description: 'Bénéficiez de l\'aide d\'une communauté solidaire et de partenaires de confiance',
        icon: 'groups',
        color: '#EC4899',
        route: '/communaute',
        stats: '50k+ membres',
        benefits: [
          'Réseau d\'entraide',
          'Partenaires locaux',
          'Témoignages vérifiés',
          'Support communautaire'
        ]
      },
      {
        id: '7',
        title: 'Gestion Multi-supports',
        description: 'Accédez à votre compte et gérez vos déclarations sur tous vos appareils',
        icon: 'devices',
        color: '#06B6D4',
        benefits: [
          'Application mobile',
          'Version desktop',
          'Synchronisation en temps réel',
          'Progressive Web App'
        ]
      },
      {
        id: '8',
        title: 'Statistiques & Rapports',
        description: 'Suivez l\'avancement de vos déclarations et consultez les statistiques de restitution',
        icon: 'analytics',
        color: '#84CC16',
        route: '/tableau-de-bord',
        stats: '70% de restitution',
        benefits: [
          'Tableau de bord personnel',
          'Historique des déclarations',
          'Statistiques en temps réel',
          'Rapports mensuels'
        ]
      }
    ];
  }

  getMainFeatures(): AppFeature[] {
    return this.getFeatures().slice(0, 4);
  }

  getStats() {
    return {
      totalDeclarations: '125,847',
      successRate: '68%',
      activeUsers: '50,000+',
      responseTime: '< 24h',
      partnerCount: '250+'
    };
  }
}