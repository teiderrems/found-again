import { Component, inject } from '@angular/core';
import { DeclarationComponent } from '../../components/declaration/declaration.component';
import { DeclarationCreate, DeclarationType } from '../../types/declaration';
import { DeclarationService } from '../../services/declaration.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
   selector: 'app-lost-object',
   templateUrl: './lost-object.component.html',
   styleUrl: './lost-object.component.css',
   standalone: true,
   imports: [DeclarationComponent, MatSnackBarModule],
})
export class LostObjectComponent {
   DeclarationType = DeclarationType;

   private declarationService = inject(DeclarationService);
   private snackBar = inject(MatSnackBar);

   handleSubmit($event: DeclarationCreate) {
      this.declarationService.createDeclaration($event, DeclarationType.LOSS).subscribe({
         next: (response) => {
            console.log('Déclaration créée avec succès :', response);
            this.snackBar.open('Déclaration d\'objet perdu créée avec succès !', 'OK', {
               duration: 5000,
               verticalPosition: 'top'
            });
            // Vous pouvez ajouter une logique supplémentaire ici, comme la navigation ou l'affichage d'un message de succès.
         },
         error: (error) => {
            console.error('Erreur lors de la création de la déclaration :', error);
            let msg = 'Une erreur est survenue lors de la création de la déclaration.';
            if (error.code === 'permission-denied') {
               msg = 'Vous n\'avez pas la permission d\'effectuer cette action.';
            } else if (error.code === 'unavailable') {
               msg = 'Le service est temporairement indisponible. Vérifiez votre connexion.';
            }
            this.snackBar.open(msg, 'Fermer', {
               duration: 5000,
               verticalPosition: 'top'
            });
            // Gérer les erreurs ici, comme l'affichage d'un message d'erreur à l'utilisateur.
         },
      });
   }
}
