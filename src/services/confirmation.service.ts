import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../components/confirmation-dialog.component';

export type ConfirmationType = 'delete' | 'update' | 'activate' | 'deactivate' | 'resolve' | 'delete-account';

@Injectable({
  providedIn: 'root'
})
export class ConfirmationService {
  private dialog = inject(MatDialog);

  /**
   * Configuration standardisée pour chaque type de confirmation
   */
  private getConfirmationConfig(type: ConfirmationType, customData?: Partial<ConfirmationDialogData>): ConfirmationDialogData {
    const baseConfig: Record<ConfirmationType, ConfirmationDialogData> = {
      delete: {
        title: 'Supprimer',
        message: 'Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible.',
        confirmText: 'Supprimer',
        cancelText: 'Annuler',
        type: 'danger'
      },
      update: {
        title: 'Mettre à jour',
        message: 'Êtes-vous sûr de vouloir enregistrer ces modifications ?',
        confirmText: 'Enregistrer',
        cancelText: 'Annuler',
        type: 'info'
      },
      activate: {
        title: 'Activer',
        message: 'Êtes-vous sûr de vouloir activer cet élément ?',
        confirmText: 'Activer',
        cancelText: 'Annuler',
        type: 'warning'
      },
      deactivate: {
        title: 'Désactiver',
        message: 'Êtes-vous sûr de vouloir désactiver cet élément ?',
        confirmText: 'Désactiver',
        cancelText: 'Annuler',
        type: 'warning'
      },
      resolve: {
        title: 'Marquer comme résolu',
        message: 'Êtes-vous sûr de vouloir marquer cet élément comme résolu ?',
        confirmText: 'Confirmer',
        cancelText: 'Annuler',
        type: 'info'
      },
      'delete-account': {
        title: 'Supprimer le compte',
        message: 'Êtes-vous sûr de vouloir supprimer définitivement votre compte ? Cette action est irréversible et toutes vos données seront supprimées.',
        confirmText: 'Supprimer',
        cancelText: 'Annuler',
        type: 'danger',
        confirmAction: 'SUPPRIMER'
      }
    };

    return { ...baseConfig[type], ...customData };
  }

  /**
   * Affiche une confirmation générique
   */
  confirm(data: ConfirmationDialogData): Observable<boolean> {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      disableClose: false,
      data
    });

    return dialogRef.afterClosed();
  }

  /**
   * Confirmation de suppression
   */
  confirmDelete(customData?: Partial<ConfirmationDialogData>): Observable<boolean> {
    return this.confirm(this.getConfirmationConfig('delete', customData));
  }

  /**
   * Confirmation de mise à jour
   */
  confirmUpdate(customData?: Partial<ConfirmationDialogData>): Observable<boolean> {
    return this.confirm(this.getConfirmationConfig('update', customData));
  }

  /**
   * Confirmation d'activation
   */
  confirmActivate(customData?: Partial<ConfirmationDialogData>): Observable<boolean> {
    return this.confirm(this.getConfirmationConfig('activate', customData));
  }

  /**
   * Confirmation de désactivation
   */
  confirmDeactivate(customData?: Partial<ConfirmationDialogData>): Observable<boolean> {
    return this.confirm(this.getConfirmationConfig('deactivate', customData));
  }

  /**
   * Confirmation de résolution
   */
  confirmResolve(customData?: Partial<ConfirmationDialogData>): Observable<boolean> {
    return this.confirm(this.getConfirmationConfig('resolve', customData));
  }

  /**
   * Confirmation de suppression de compte
   */
  confirmDeleteAccount(customData?: Partial<ConfirmationDialogData>): Observable<boolean> {
    return this.confirm(this.getConfirmationConfig('delete-account', customData));
  }
}