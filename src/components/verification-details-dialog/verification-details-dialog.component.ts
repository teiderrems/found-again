import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { VerificationData } from '@/types/verification';
import { FirebaseDatePipe } from '@/pipes/firebase-date.pipe';

@Component({
  selector: 'app-verification-details-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    FirebaseDatePipe
  ],
  template: `
    <h2 mat-dialog-title>Détails de la vérification</h2>
    <mat-dialog-content>
      <div class="space-y-4">
        <div class="bg-gray-50 p-4 rounded-lg">
          <h3 class="font-semibold text-gray-700 mb-2">Informations fournies</h3>
          
          <div class="mb-3">
            <span class="text-sm text-gray-500 block">Détails d'identité</span>
            <p class="text-gray-900 whitespace-pre-wrap">{{ data.identityDetails }}</p>
          </div>

          <div class="mb-3">
            <span class="text-sm text-gray-500 block">Informations supplémentaires</span>
            <p class="text-gray-900 whitespace-pre-wrap">{{ data.additionalInfo }}</p>
          </div>

          @if (data.serialNumber) {
            <div class="mb-3">
              <span class="text-sm text-gray-500 block">Numéro de série</span>
              <p class="text-gray-900 font-mono">{{ data.serialNumber }}</p>
            </div>
          }
        </div>

        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span class="text-gray-500">ID Utilisateur:</span>
            <p class="font-medium truncate" [title]="data.userId">{{ data.userId }}</p>
          </div>
          <div>
            <span class="text-gray-500">ID Déclaration:</span>
            <p class="font-medium truncate" [title]="data.declarationId">{{ data.declarationId }}</p>
          </div>
          <div>
            <span class="text-gray-500">Date:</span>
            <p class="font-medium">{{ data.timestamp | firebaseDate:'dd/MM/yyyy HH:mm' }}</p>
          </div>
          <div>
            <span class="text-gray-500">Statut:</span>
            <span [class]="'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ' + 
                          (data.status === 'verified' ? 'bg-green-100 text-green-800' : 
                           data.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                           'bg-yellow-100 text-yellow-800')">
              {{ data.status === 'verified' ? 'Approuvé' : data.status === 'rejected' ? 'Rejeté' : 'En attente' }}
            </span>
          </div>
        </div>

        @if (data.rejectionReason) {
          <div class="bg-red-50 p-3 rounded border border-red-100">
            <span class="text-sm text-red-600 block font-medium">Raison du rejet</span>
            <p class="text-red-800 text-sm">{{ data.rejectionReason }}</p>
          </div>
        }
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Fermer</button>
      @if (data.status === 'pending') {
        <button mat-button color="warn" [mat-dialog-close]="'reject'">Rejeter</button>
        <button mat-raised-button color="primary" [mat-dialog-close]="'approve'">Approuver</button>
      }
    </mat-dialog-actions>
  `
})
export class VerificationDetailsDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<VerificationDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: VerificationData
  ) {}
}
