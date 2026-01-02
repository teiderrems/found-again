import { Component, Inject, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { VerificationData } from '@/types/verification';
import { DeclarationData } from '@/types/declaration';
import { DeclarationService } from '@/services/declaration.service';
import { FirebaseDatePipe } from '@/pipes/firebase-date.pipe';

@Component({
  selector: 'app-verification-details-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    FirebaseDatePipe
  ],
  template: `
    <h2 mat-dialog-title>Détails de la vérification</h2>
    <mat-dialog-content class="max-h-[80vh]">
      @if (data) {
        <mat-tab-group animationDuration="0ms">
          <!-- Onglet 1: Informations de vérification -->
          <mat-tab label="Vérification">
            <div class="space-y-4 p-4">
              <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 class="font-semibold text-gray-700 dark:text-gray-300 mb-2">Informations fournies</h3>
                
                <div class="mb-3">
                  <span class="text-sm text-gray-500 dark:text-gray-400 block">Détails d'identité</span>
                  <p class="text-gray-900 dark:text-white whitespace-pre-wrap">{{ data.identityDetails || 'Non spécifié' }}</p>
                </div>

                <div class="mb-3">
                  <span class="text-sm text-gray-500 dark:text-gray-400 block">Informations supplémentaires</span>
                  <p class="text-gray-900 dark:text-white whitespace-pre-wrap">{{ data.additionalInfo || 'Non spécifié' }}</p>
                </div>

                @if (data.serialNumber) {
                  <div class="mb-3">
                    <span class="text-sm text-gray-500 dark:text-gray-400 block">Numéro de série</span>
                    <p class="text-gray-900 dark:text-white font-mono">{{ data.serialNumber }}</p>
                  </div>
                }
              </div>

              <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span class="text-gray-500 dark:text-gray-400">ID Utilisateur:</span>
                  <p class="font-medium text-gray-900 dark:text-white truncate" [title]="data.userId">{{ data.userId }}</p>
                </div>
                <div>
                  <span class="text-gray-500 dark:text-gray-400">ID Déclaration:</span>
                  <p class="font-medium text-gray-900 dark:text-white truncate" [title]="data.declarationId">{{ data.declarationId }}</p>
                </div>
                <div>
                  <span class="text-gray-500 dark:text-gray-400">Date:</span>
                  <p class="font-medium text-gray-900 dark:text-white">{{ data.timestamp | firebaseDate:'dd/MM/yyyy HH:mm' }}</p>
                </div>
                <div>
                  <span class="text-gray-500 dark:text-gray-400">Statut:</span>
                  <span [class]="'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ' + 
                                (data.status === 'verified' ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300' : 
                                 data.status === 'rejected' ? 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300' : 
                                 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300')">
                    {{ data.status === 'verified' ? 'Approuvé' : data.status === 'rejected' ? 'Rejeté' : 'En attente' }}
                  </span>
                </div>
              </div>

              @if (data.rejectionReason) {
                <div class="bg-red-50 dark:bg-red-900/30 p-3 rounded border border-red-100 dark:border-red-800">
                  <span class="text-sm text-red-600 dark:text-red-400 block font-medium">Raison du rejet</span>
                  <p class="text-red-800 dark:text-red-300 text-sm">{{ data.rejectionReason }}</p>
                </div>
              }
            </div>
          </mat-tab>

          <!-- Onglet 2: Déclaration concernée -->
          <mat-tab label="Déclaration">
            <div class="p-4">
              @if (isLoading()) {
                <div class="flex justify-center p-4">
                  <mat-spinner diameter="40"></mat-spinner>
                </div>
              } @else if (declaration()) {
                <div class="space-y-4">
                  <div class="flex justify-between items-start">
                    <h3 class="text-lg font-bold text-gray-900 dark:text-white">{{ declaration()?.title }}</h3>
                    <span class="px-2 py-1 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300">
                      {{ declaration()?.type === 'loss' ? 'Perdu' : 'Trouvé' }}
                    </span>
                  </div>

                  <div class="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span class="text-gray-500 dark:text-gray-400 block">Catégorie</span>
                      <span class="font-medium text-gray-900 dark:text-white">{{ declaration()?.category }}</span>
                    </div>
                    <div>
                      <span class="text-gray-500 dark:text-gray-400 block">Date</span>
                      <span class="font-medium text-gray-900 dark:text-white">{{ declaration()?.date | date:'dd/MM/yyyy' }}</span>
                    </div>
                    <div class="col-span-2">
                      <span class="text-gray-500 dark:text-gray-400 block">Lieu</span>
                      <span class="font-medium text-gray-900 dark:text-white">{{ declaration()?.location }}</span>
                    </div>
                  </div>

                  <div>
                    <span class="text-gray-500 dark:text-gray-400 block text-sm mb-1">Description</span>
                    <p class="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded">{{ declaration()?.description }}</p>
                  </div>

                  @if (declaration()?.images?.length) {
                    <div>
                      <span class="text-gray-500 dark:text-gray-400 block text-sm mb-2">Images</span>
                      <div class="grid grid-cols-2 gap-2">
                        @for (img of declaration()?.images; track $index) {
                          <img [src]="img.downloadURL" class="w-full h-32 object-cover rounded border border-gray-200 dark:border-gray-600">
                        }
                      </div>
                    </div>
                  } @else {
                    <p class="text-gray-500 dark:text-gray-400 italic text-sm">Aucune image disponible.</p>
                  }
                </div>
              } @else {
                <div class="text-center p-4">
                  <p class="text-red-500 dark:text-red-400 mb-2">Impossible de charger la déclaration.</p>
                  <p class="text-sm text-gray-500 dark:text-gray-400">ID: {{ data.declarationId }}</p>
                </div>
              }
            </div>
          </mat-tab>

          <!-- Onglet 3: Déclaration correspondante (si existe) -->
          @if (data.matchingDeclarationId) {
            <mat-tab label="Correspondance">
              <div class="p-4">
                @if (isLoading()) {
                  <div class="flex justify-center p-4">
                    <mat-spinner diameter="40"></mat-spinner>
                  </div>
                } @else if (matchingDeclaration()) {
                  <div class="space-y-4">
                    <div class="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 p-3 rounded mb-4">
                      <p class="text-sm text-yellow-800 dark:text-yellow-300">
                        <mat-icon class="inline-block align-middle text-sm mr-1">link</mat-icon>
                        Cette déclaration est liée à l'objet ci-dessous.
                      </p>
                    </div>

                    <div class="flex justify-between items-start">
                      <h3 class="text-lg font-bold text-gray-900 dark:text-white">{{ matchingDeclaration()?.title }}</h3>
                      <span class="px-2 py-1 rounded text-xs font-medium bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300">
                        {{ matchingDeclaration()?.type === 'loss' ? 'Perdu' : 'Trouvé' }}
                      </span>
                    </div>

                    <div class="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span class="text-gray-500 dark:text-gray-400 block">Catégorie</span>
                        <span class="font-medium text-gray-900 dark:text-white">{{ matchingDeclaration()?.category }}</span>
                      </div>
                      <div>
                        <span class="text-gray-500 dark:text-gray-400 block">Date</span>
                        <span class="font-medium text-gray-900 dark:text-white">{{ matchingDeclaration()?.date | date:'dd/MM/yyyy' }}</span>
                      </div>
                      <div class="col-span-2">
                        <span class="text-gray-500 dark:text-gray-400 block">Lieu</span>
                        <span class="font-medium text-gray-900 dark:text-white">{{ matchingDeclaration()?.location }}</span>
                      </div>
                    </div>

                    <div>
                      <span class="text-gray-500 dark:text-gray-400 block text-sm mb-1">Description</span>
                      <p class="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded">{{ matchingDeclaration()?.description }}</p>
                    </div>

                    @if (matchingDeclaration()?.images?.length) {
                      <div>
                        <span class="text-gray-500 dark:text-gray-400 block text-sm mb-2">Images</span>
                        <div class="grid grid-cols-2 gap-2">
                          @for (img of matchingDeclaration()?.images; track $index) {
                            <img [src]="img.downloadURL" class="w-full h-32 object-cover rounded border border-gray-200 dark:border-gray-600">
                          }
                        </div>
                      </div>
                    }
                  </div>
                } @else {
                  <p class="text-gray-500 dark:text-gray-400 italic text-center p-4">Impossible de charger la déclaration correspondante.</p>
                }
              </div>
            </mat-tab>
          }
        </mat-tab-group>
      } @else {
        <div class="p-4 text-center text-red-500 dark:text-red-400">
          Données de vérification manquantes.
        </div>
      }
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
export class VerificationDetailsDialogComponent implements OnInit {
  private declarationService = inject(DeclarationService);
  
  declaration = signal<DeclarationData | null>(null);
  matchingDeclaration = signal<DeclarationData | null>(null);
  isLoading = signal(true);

  constructor(
    public dialogRef: MatDialogRef<VerificationDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: VerificationData
  ) {}

  ngOnInit() {
    this.loadData();
  }

  private loadData() {
    this.isLoading.set(true);
    
    // Charger la déclaration principale
    this.declarationService.getDeclarationById(this.data.declarationId).subscribe({
      next: (decl) => {
        this.declaration.set(decl);
        
        // Si une déclaration correspondante existe, la charger aussi
        if (this.data.matchingDeclarationId) {
          this.declarationService.getDeclarationById(this.data.matchingDeclarationId).subscribe({
            next: (matchDecl) => {
              this.matchingDeclaration.set(matchDecl);
              this.isLoading.set(false);
            },
            error: () => this.isLoading.set(false)
          });
        } else {
          this.isLoading.set(false);
        }
      },
      error: (err) => {
        console.error('Erreur chargement déclaration', err);
        this.isLoading.set(false);
      }
    });
  }
}
