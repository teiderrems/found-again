// GUIDE D'UTILISATION - ConfirmationDialogComponent

/**
 * Composant réutilisable pour confirmer les actions importantes
 * Located: src/components/confirmation-dialog.component.ts
 */

// ============= EXEMPLE 1: SUPPRESSION (Avec saisie de confirmation) =============

import { ConfirmationDialogComponent } from '../../components/confirmation-dialog.component';
import { MatDialog } from '@angular/material/dialog';

export class ExampleComponent {
  constructor(private dialog: MatDialog) {}

  deleteItem() {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      disableClose: false,
      data: {
        title: 'Supprimer l\'élément',
        message: 'Cette action est irréversible. Êtes-vous sûr ?',
        confirmText: 'Supprimer',
        cancelText: 'Annuler',
        type: 'danger',        // 'danger' = icône rouge, bouton rouge
        confirmAction: 'CONFIRMER'  // L'utilisateur doit taper ce texte
      }
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        // Effectuer l'action
        console.log('Action confirmée');
      } else {
        console.log('Action annulée');
      }
    });
  }

  // ============= EXEMPLE 2: MISE À JOUR (Confirmation simple) =============

  updateSettings() {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      disableClose: false,
      data: {
        title: 'Enregistrer les modifications',
        message: 'Êtes-vous sûr de vouloir enregistrer ces changements ?',
        confirmText: 'Enregistrer',
        cancelText: 'Annuler',
        type: 'info'  // 'info' = icône bleue, bouton bleu
      }
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        // Effectuer la mise à jour
        console.log('Paramètres mis à jour');
      }
    });
  }

  // ============= EXEMPLE 3: AVERTISSEMENT =============

  deactivateAccount() {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      disableClose: false,
      data: {
        title: 'Désactiver le compte',
        message: 'Votre compte sera temporairement désactivé et vous ne pourrez plus accéder.',
        confirmText: 'Désactiver',
        cancelText: 'Garder actif',
        type: 'warning'  // 'warning' = icône orange, bouton orange
      }
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        console.log('Compte désactivé');
      }
    });
  }
}

/**
 * ============= OPTIONS DISPONIBLES =============
 * 
 * Interface ConfirmationDialogData {
 *   title: string;              // Titre du dialogue
 *   message: string;            // Message de confirmation
 *   confirmText?: string;       // Texte du bouton confirm (défaut: 'Confirmer')
 *   cancelText?: string;        // Texte du bouton cancel (défaut: 'Annuler')
 *   type?: 'danger' | 'warning' | 'info';  // Style du dialogue
 *   confirmAction?: string;     // Texte à saisir pour les actions danger
 * }
 * 
 * Types:
 * - 'danger': Icône supprimer rouge, bouton rouge, champ de saisie requis
 * - 'warning': Icône avertissement orange, bouton orange
 * - 'info': Icône info bleu, bouton bleu (défaut)
 * 
 * ============= UTILISATION AVEC ASYNC/AWAIT =============
 * 
 * async deleteItem() {
 *   const confirmed = await new Promise<boolean>((resolve) => {
 *     const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
 *       width: '400px',
 *       data: {
 *         title: 'Supprimer',
 *         message: 'Êtes-vous sûr ?',
 *         type: 'danger',
 *         confirmAction: 'DELETE'
 *       }
 *     });
 *     dialogRef.afterClosed().subscribe(resolve);
 *   });
 *
 *   if (confirmed) {
 *     await this.performDelete();
 *   }
 * }
 */
