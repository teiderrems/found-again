import { Component, inject } from '@angular/core';
import { DeclarationComponent } from '../components/declaration/declaration.component';
import { DeclarationCreate, DeclarationType } from '../types/declaration';
import { DeclarationService } from '../services/declaration.service';

@Component({
   selector: 'app-lost-object',
   templateUrl: './lost-object.component.html',
   styleUrl: './lost-object.component.css',
   standalone: true,
   imports: [DeclarationComponent],
})
export class LostObjectComponent {
   DeclarationType = DeclarationType;

   private declarationService = inject(DeclarationService);

   handleSubmit($event: DeclarationCreate) {
      this.declarationService.createDeclaration($event, DeclarationType.LOSS).subscribe({
         next: (response) => {
            console.log('Déclaration créée avec succès :', response);
            // Vous pouvez ajouter une logique supplémentaire ici, comme la navigation ou l'affichage d'un message de succès.
         },
         error: (error) => {
            console.error('Erreur lors de la création de la déclaration :', error);
            // Gérer les erreurs ici, comme l'affichage d'un message d'erreur à l'utilisateur.
         },
      });
   }
}
