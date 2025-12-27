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
              <div class="bg-gray-50 p-4 rounded-lg">
                <h3 class="font-semibold text-gray-700 mb-2">Informations fournies</h3>
                
                <div class="mb-3">
                  <span class="text-sm text-gray-500 block">Détails d'identité</span>
                  <p class="text-gray-900 whitespace-pre-wrap">{{ data.identityDetails || 'Non spécifié' }}</p>
                </div>

                <div class="mb-3">
                  <span class="text-sm text-gray-500 block">Informations supplémentaires</span>
                  <p class="text-gray-900 whitespace-pre-wrap">{{ data.additionalInfo || 'Non spécifié' }}</p>
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
                    <h3 class="text-lg font-bold">{{ declaration()?.title }}</h3>
                    <span class="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      {{ declaration()?.type === 'loss' ? 'Perdu' : 'Trouvé' }}
                    </span>
                  </div>

                  <div class="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span class="text-gray-500 block">Catégorie</span>
                      <span class="font-medium">{{ declaration()?.category }}</span>
                    </div>
                    <div>
                      <span class="text-gray-500 block">Date</span>
                      <span class="font-medium">{{ declaration()?.date | date:'dd/MM/yyyy' }}</span>
                    </div>
                    <div class="col-span-2">
                      <span class="text-gray-500 block">Lieu</span>
                      <span class="font-medium">{{ declaration()?.location }}</span>
                    </div>
                  </div>

                  <div>
                    <span class="text-gray-500 block text-sm mb-1">Description</span>
                    <p class="text-gray-900 bg-gray-50 p-3 rounded">{{ declaration()?.description }}</p>
                  </div>

                  @if (declaration()?.images?.length) {
                    <div>
                      <span class="text-gray-500 block text-sm mb-2">Images</span>
                      <div class="grid grid-cols-2 gap-2">
                        @for (img of declaration()?.images; track $index) {
                          <img [src]="img.downloadURL" class="w-full h-32 object-cover rounded border border-gray-200">
                        }
                      </div>
                    </div>
                  } @else {
                    <p class="text-gray-500 italic text-sm">Aucune image disponible.</p>
                  }
                </div>
              } @else {
                <div class="text-center p-4">
                  <p class="text-red-500 mb-2">Impossible de charger la déclaration.</p>
                  <p class="text-sm text-gray-500">ID: {{ data.declarationId }}</p>
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
                    <div class="bg-yellow-50 border border-yellow-200 p-3 rounded mb-4">
                      <p class="text-sm text-yellow-800">
                        <mat-icon class="inline-block align-middle text-sm mr-1">link</mat-icon>
                        Cette déclaration est liée à l'objet ci-dessous.
                      </p>
                    </div>

                    <div class="flex justify-between items-start">
                      <h3 class="text-lg font-bold">{{ matchingDeclaration()?.title }}</h3>
                      <span class="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                        {{ matchingDeclaration()?.type === 'loss' ? 'Perdu' : 'Trouvé' }}
                      </span>
                    </div>

                    <div class="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span class="text-gray-500 block">Catégorie</span>
                        <span class="font-medium">{{ matchingDeclaration()?.category }}</span>
                      </div>
                      <div>
                        <span class="text-gray-500 block">Date</span>
                        <span class="font-medium">{{ matchingDeclaration()?.date | date:'dd/MM/yyyy' }}</span>
                      </div>
                      <div class="col-span-2">
                        <span class="text-gray-500 block">Lieu</span>
                        <span class="font-medium">{{ matchingDeclaration()?.location }}</span>
                      </div>
                    </div>

                    <div>
                      <span class="text-gray-500 block text-sm mb-1">Description</span>
                      <p class="text-gray-900 bg-gray-50 p-3 rounded">{{ matchingDeclaration()?.description }}</p>
                    </div>

                    @if (matchingDeclaration()?.images?.length) {
                      <div>
                        <span class="text-gray-500 block text-sm mb-2">Images</span>
                        <div class="grid grid-cols-2 gap-2">
                          @for (img of matchingDeclaration()?.images; track $index) {
                            <img [src]="img.downloadURL" class="w-full h-32 object-cover rounded border border-gray-200">
                          }
                        </div>
                      </div>
                    }
                  </div>
                } @else {
                  <p class="text-gray-500 italic text-center p-4">Impossible de charger la déclaration correspondante.</p>
                }
              </div>
            </mat-tab>
          }
        </mat-tab-group>
      } @else {
        <div class="p-4 text-center text-red-500">
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
