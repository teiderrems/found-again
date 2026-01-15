import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DeclarationData, DeclarationType } from '@/types/declaration';
import { AuthService } from '@/services/auth.service';

@Component({
  selector: 'app-declaration-details-modal',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="max-w-4xl w-full max-h-[90vh] overflow-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-2xl">
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold"
               [ngClass]="isLost()
                 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                 : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'">
            <mat-icon class="text-sm">{{ isLost() ? 'search_off' : 'check_circle' }}</mat-icon>
            <span>{{ isLost() ? 'Objet perdu' : 'Objet trouvé' }}</span>
          </div>
          <span class="text-sm text-gray-500 dark:text-gray-400">
            {{ data.date | date:'dd/MM/yyyy à HH:mm' }}
          </span>
        </div>
        <button mat-icon-button (click)="close()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Content -->
      <div class="overflow-y-auto max-h-[calc(90vh-140px)]">
        <div class="p-6 space-y-6">

          <!-- Images Carousel -->
          @if (data.images && data.images.length > 0) {
            <div class="relative">
              <div class="aspect-video bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden">
                <img [src]="currentImageUrl"
                     [alt]="data.title"
                     class="w-full h-full object-cover">
              </div>

              @if (data.images.length > 1) {
                <!-- Navigation buttons -->
                <button (click)="prevImage()"
                        class="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors">
                  <mat-icon>chevron_left</mat-icon>
                </button>
                <button (click)="nextImage()"
                        class="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors">
                  <mat-icon>chevron_right</mat-icon>
                </button>

                <!-- Indicators -->
                <div class="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  @for (image of data.images; track image.downloadURL; let i = $index) {
                    <button (click)="setCurrentImage(i)"
                            class="w-2 h-2 rounded-full transition-colors"
                            [class.bg-white]="i === currentImageIndex"
                            [class.bg-white/50]="i !== currentImageIndex">
                    </button>
                  }
                </div>
              }
            </div>
          }

          <!-- Title and Category -->
          <div class="space-y-2">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ data.title }}</h1>
            @if (data.category) {
              <div class="inline-flex items-center gap-2 px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-sm font-medium">
                <mat-icon class="text-sm">category</mat-icon>
                <span>{{ data.category }}</span>
              </div>
            }
          </div>

          <!-- Description -->
          <div class="space-y-3">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Description</h3>
            <p class="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">{{ data.description }}</p>
          </div>

          <!-- Location -->
          <div class="space-y-3">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ getLocationLabel() }}</h3>
            <div class="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
              <div class="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <mat-icon class="text-white text-lg">location_on</mat-icon>
              </div>
              <div>
                <div class="font-medium text-gray-900 dark:text-white">{{ data.location }}</div>
                @if (data.coordinates) {
                  <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Coordonnées: {{ data.coordinates.lat.toFixed(6) }}, {{ data.coordinates.lng.toFixed(6) }}
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- Additional Details -->
          @if (data.condition) {
            <div class="space-y-3">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Détails supplémentaires</h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                @if (data.condition) {
                  <div class="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <mat-icon class="text-blue-500">build</mat-icon>
                    <div>
                      <div class="text-sm font-medium text-gray-900 dark:text-white">État</div>
                      <div class="text-sm text-gray-600 dark:text-gray-400">{{ getConditionText() }}</div>
                    </div>
                  </div>
                }
              </div>
            </div>
          }

          <!-- Help Text -->
          <div class="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800">
            <div class="flex items-start gap-3">
              <mat-icon class="text-orange-500 mt-0.5">lightbulb</mat-icon>
              <div>
                <div class="font-medium text-orange-800 dark:text-orange-200 mb-1">Comment aider ?</div>
                <p class="text-sm text-orange-700 dark:text-orange-300">{{ getHelpText() }}</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- Footer Actions -->
      <div class="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <div class="text-sm text-gray-500 dark:text-gray-400">
          Déclaré par {{ isOwner() ? 'vous' : 'un utilisateur' }}
        </div>
        <div class="flex gap-3">
          @if (isOwner()) {
            <button mat-button (click)="editDeclaration()" class="text-blue-600 hover:text-blue-700">
              <mat-icon class="mr-2">edit</mat-icon>
              Modifier
            </button>
          } @else {
            <button mat-raised-button
                    color="primary"
                    (click)="contactOwner()"
                    class="bg-orange-500 hover:bg-orange-600">
              <mat-icon class="mr-2">{{ isLost() ? 'search' : 'check_circle' }}</mat-icon>
              {{ getActionText() }}
            </button>
          }
        </div>
      </div>
    </div>
  `,
})
export class DeclarationDetailsModalComponent {
  private dialogRef = inject(MatDialogRef<DeclarationDetailsModalComponent>);
  private authService = inject(AuthService);

  data: DeclarationData = inject(MAT_DIALOG_DATA);
  currentImageIndex = 0;

  get currentImageUrl(): string {
    return this.data.images?.[this.currentImageIndex]?.downloadURL || '';
  }

  isLost(): boolean {
    return this.data.type === DeclarationType.LOSS;
  }

  isOwner(): boolean {
    const currentUserId = this.authService.getCurrentUserId();
    return currentUserId !== null && this.data.userId === currentUserId;
  }

  getLocationLabel(): string {
    return this.isLost() ? 'Lieu de perte' : 'Lieu de découverte';
  }

  getConditionText(): string {
    switch (this.data.condition) {
      case 'excellent': return 'Excellent';
      case 'good': return 'Bon';
      case 'fair': return 'Correct';
      case 'poor': return 'Mauvais';
      case 'unknown': return 'Inconnu';
      default: return 'Non spécifié';
    }
  }

  getHelpText(): string {
    if (this.isLost()) {
      return 'Si vous avez vu cet objet ou avez des informations à propos de sa localisation, n\'hésitez pas à contacter le propriétaire.';
    }
    return 'Si cet objet vous appartient, veuillez contacter la personne qui l\'a trouvé pour organiser sa restitution.';
  }

  getActionText(): string {
    return this.isLost() ? 'J\'ai des informations' : 'C\'est à moi';
  }

  setCurrentImage(index: number): void {
    this.currentImageIndex = index;
  }

  prevImage(): void {
    if (this.data.images && this.data.images.length > 0) {
      this.currentImageIndex = (this.currentImageIndex - 1 + this.data.images.length) % this.data.images.length;
    }
  }

  nextImage(): void {
    if (this.data.images && this.data.images.length > 0) {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.data.images.length;
    }
  }

  editDeclaration(): void {
    // TODO: Implement edit functionality
    this.close();
  }

  contactOwner(): void {
    // TODO: Implement contact functionality
    this.close();
  }

  close(): void {
    this.dialogRef.close();
  }
}