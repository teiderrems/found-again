import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { ReactiveFormsModule } from '@angular/forms';
import { DeclarationComponent } from '../../components/declaration/declaration.component';
import { DeclarationCreate, DeclarationType } from '../../types/declaration';
import { DeclarationService } from '../../services/declaration.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-found-object-declaration',
  templateUrl: './found-object.component.html',
  styleUrls: ['./found-object.component.css'],
  standalone: true,
  imports: [ReactiveFormsModule, DeclarationComponent, MatSnackBarModule]
})
export class FoundObjectComponent {
  
  DeclarationType=DeclarationType

  private declarationService = inject(DeclarationService);
  private snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  
  handleSubmit($event: DeclarationCreate) {
    this.declarationService.createDeclaration($event,DeclarationType.FOUND).subscribe({
      next: (response) => {
        this.snackBar.open('Déclaration d\'objet trouvé créée avec succès !', 'OK', {
          duration: 5000,
          verticalPosition: 'top'
        });
        this.router.navigate(['/']);
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
      }
    });
  }
}