import { Component, inject, OnInit, signal } from '@angular/core';
import { DeclarationComponent } from '../../components/declaration/declaration.component';
import { DeclarationCreate, DeclarationType, DeclarationData } from '../../types/declaration';
import { DeclarationService } from '../../services/declaration.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
   selector: 'app-lost-object',
   templateUrl: './lost-object.component.html',
   styleUrl: './lost-object.component.css',
   standalone: true,
   imports: [DeclarationComponent, MatSnackBarModule],
})
export class LostObjectComponent implements OnInit {
   DeclarationType = DeclarationType;

   private declarationService = inject(DeclarationService);
   private snackBar = inject(MatSnackBar);
   private readonly router = inject(Router);
   private readonly route = inject(ActivatedRoute);

   // Mode édition
   isEditMode = signal(false);
   editDeclarationId = signal<string | null>(null);
   existingDeclaration = signal<DeclarationData | null>(null);

   ngOnInit() {
      // Vérifier si on est en mode édition
      this.route.queryParams.subscribe(params => {
         const editId = params['edit'];
         if (editId) {
            this.isEditMode.set(true);
            this.editDeclarationId.set(editId);
            this.loadExistingDeclaration(editId);
         }
      });
   }

   private loadExistingDeclaration(declarationId: string) {
      this.declarationService.getDeclarationById(declarationId).subscribe({
         next: (declaration) => {
            this.existingDeclaration.set(declaration);
         },
         error: (error) => {
            console.error('Erreur lors du chargement de la déclaration:', error);
            this.snackBar.open('Erreur lors du chargement de la déclaration à modifier.', 'Fermer', {
               duration: 5000,
               verticalPosition: 'top'
            });
            this.router.navigate(['/']);
         }
      });
   }

   handleSubmit($event: DeclarationCreate) {
      if (this.isEditMode()) {
         // Mode édition
         this.updateDeclaration($event);
      } else {
         // Mode création
         this.createDeclaration($event);
      }
   }

   private createDeclaration(declarationData: DeclarationCreate) {
      this.declarationService.createDeclaration(declarationData, DeclarationType.LOSS).subscribe({
         next: (response) => {
            this.snackBar.open('Déclaration d\'objet perdu créée avec succès !', 'OK', {
               duration: 5000,
               verticalPosition: 'top'
            });
            this.router.navigate(['/']);
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
         },
      });
   }

   private updateDeclaration(declarationData: DeclarationCreate) {
      if (!this.editDeclarationId() || !this.existingDeclaration()) return;

      // Récupérer les images existantes complètes
      const existingImages = this.existingDeclaration()!.images;

      this.declarationService.updateDeclaration(
         this.editDeclarationId()!,
         declarationData,
         existingImages,
         DeclarationType.LOSS
      ).subscribe({
         next: () => {
            this.snackBar.open('Déclaration d\'objet perdu mise à jour avec succès !', 'OK', {
               duration: 5000,
               verticalPosition: 'top'
            });
            this.router.navigate(['/']);
         },
         error: (error) => {
            console.error('Erreur lors de la mise à jour de la déclaration :', error);
            let msg = 'Une erreur est survenue lors de la mise à jour de la déclaration.';
            if (error.code === 'permission-denied') {
               msg = 'Vous n\'avez pas la permission d\'effectuer cette action.';
            } else if (error.code === 'unavailable') {
               msg = 'Le service est temporairement indisponible. Vérifiez votre connexion.';
            }
            this.snackBar.open(msg, 'Fermer', {
               duration: 5000,
               verticalPosition: 'top'
            });
         }
      });
   }
}
