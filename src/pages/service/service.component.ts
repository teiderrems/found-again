import { Component, inject, signal } from '@angular/core';
import { AppFeature, AppFeaturesService } from '../../services/app-features.service';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
   selector: 'app-service',
   templateUrl: './service.component.html',
   styleUrl: './service.component.css',
   standalone: true,
   imports: [CommonModule, RouterModule, MatIconModule]
})
export class ServiceComponent {
   private featuresService = inject(AppFeaturesService);

   features: AppFeature[] = [];
   stats = signal<
      | {
           totalDeclarations: string;
           successRate: string;
           activeUsers: string;
           responseTime: string;
           partnerCount: string;
        }
      | undefined
   >(undefined);

   faqs = [
      {
         question: 'Combien de temps une déclaration reste-t-elle active ?',
         answer:
            'Vos déclarations restent actives pendant 90 jours. Vous recevrez des rappels et pouvez les renouveler si nécessaire.',
      },
      {
         question: 'Mes informations personnelles sont-elles protégées ?',
         answer:
            "Absolument. Nous préservons votre anonymat et ne partageons vos coordonnées qu'avec la personne ayant retrouvé votre objet, avec votre accord.",
      },
      {
         question: 'Le service est-il vraiment gratuit ?',
         answer:
            "Oui, la déclaration et la recherche d'objets sont entièrement gratuites. Nous croyons en l'entraide et la solidarité communautaire.",
      },
      {
         question: 'Comment sont établies les correspondances ?',
         answer:
            'Notre algorithme analyse la description, la localisation, la catégorie et les photos pour trouver les meilleures correspondances automatiquement.',
      },
   ];

   ngOnInit() {
      this.features = this.featuresService.getFeatures();
      this.stats.set(this.featuresService.getStats());
   }

   getCardClasses(feature: AppFeature): string {
      return 'feature-card group';
   }

   handleAction(action: string): void {
      switch (action) {
         case 'configure-notifications':
            console.log('Configuration des notifications');
            // Implémentez la logique d'action
            break;
         default:
            console.log('Action non reconnue:', action);
      }
   }
}
