import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Ad, CreateAdData } from '@/types/ad';

export interface AdFormDialogData {
  ad?: Ad;
  mode: 'create' | 'edit';
}

export interface AdFormDialogResult {
  success: boolean;
  data?: CreateAdData;
}

@Component({
  selector: 'app-ad-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <!-- Header -->
    <h2 mat-dialog-title class="flex items-center gap-3 border-b border-gray-200 dark:border-gray-700 pb-4">
      <div class="p-2.5 rounded-xl" [ngClass]="data.mode === 'edit' ? 'bg-blue-100 dark:bg-blue-900/50' : 'bg-[#FC4E00]/10'">
        <mat-icon [ngClass]="data.mode === 'edit' ? 'text-blue-600 dark:text-blue-400' : 'text-[#FC4E00]'" style="font-size: 24px; width: 24px; height: 24px;">
          {{ data.mode === 'edit' ? 'edit' : 'add_circle' }}
        </mat-icon>
      </div>
      <div class="flex-1">
        <span class="text-xl font-bold text-gray-900 dark:text-white">
          {{ data.mode === 'edit' ? 'Modifier la publicité' : 'Nouvelle publicité' }}
        </span>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {{ data.mode === 'edit' ? 'Modifiez les informations ci-dessous' : 'Créez une publicité pour les utilisateurs non-premium' }}
        </p>
      </div>
      <button 
        type="button"
        (click)="onCancel()" 
        class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
        <mat-icon>close</mat-icon>
      </button>
    </h2>

    <!-- Form Content -->
    <mat-dialog-content class="py-6">
      <form [formGroup]="adForm" id="adForm">
        <!-- Layout 2 colonnes sur desktop -->
        <div class="flex flex-col lg:flex-row gap-8">
          
          <!-- Colonne gauche: Formulaire -->
          <div class="flex-1 space-y-5">
            <!-- Titre -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Titre <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                formControlName="title"
                placeholder="Ex: Étiquettes connectées TrackTag"
                class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[#FC4E00] focus:border-[#FC4E00] outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all"
              />
              @if (adForm.get('title')?.hasError('required') && adForm.get('title')?.touched) {
                <p class="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                  <mat-icon class="text-xs" style="font-size: 14px; width: 14px; height: 14px;">error</mat-icon>
                  Le titre est requis
                </p>
              }
            </div>

            <!-- Description -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Description <span class="text-red-500">*</span>
              </label>
              <textarea
                formControlName="description"
                rows="4"
                placeholder="Décrivez votre publicité de manière attractive..."
                class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[#FC4E00] focus:border-[#FC4E00] outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none transition-all"
              ></textarea>
              @if (adForm.get('description')?.hasError('required') && adForm.get('description')?.touched) {
                <p class="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                  <mat-icon class="text-xs" style="font-size: 14px; width: 14px; height: 14px;">error</mat-icon>
                  La description est requise
                </p>
              }
            </div>

            <!-- URL de l'image -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                <mat-icon class="align-middle mr-1" style="font-size: 18px; width: 18px; height: 18px;">image</mat-icon>
                URL de l'image <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                formControlName="imageUrl"
                placeholder="https://exemple.com/image.jpg"
                class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[#FC4E00] focus:border-[#FC4E00] outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all"
              />
              @if (adForm.get('imageUrl')?.hasError('required') && adForm.get('imageUrl')?.touched) {
                <p class="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                  <mat-icon class="text-xs" style="font-size: 14px; width: 14px; height: 14px;">error</mat-icon>
                  L'URL de l'image est requise
                </p>
              }
            </div>

            <!-- Lien vidéo (YouTube, Vimeo, etc.) -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                <mat-icon class="align-middle mr-1" style="font-size: 18px; width: 18px; height: 18px;">smart_display</mat-icon>
                Lien vidéo <span class="text-gray-400 text-xs font-normal ml-1">(optionnel)</span>
              </label>
              <input
                type="text"
                formControlName="videoUrl"
                placeholder="https://www.youtube.com/watch?v=xxxxxx ou https://vimeo.com/xxxxxx"
                class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[#FC4E00] focus:border-[#FC4E00] outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all"
              />
            </div>

            <!-- URL de redirection -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                <mat-icon class="align-middle mr-1" style="font-size: 18px; width: 18px; height: 18px;">link</mat-icon>
                URL de redirection
                <span class="text-gray-400 text-xs font-normal ml-1">(optionnel)</span>
              </label>
              <input
                type="text"
                formControlName="linkUrl"
                placeholder="https://votre-site.com/landing-page"
                class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[#FC4E00] focus:border-[#FC4E00] outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all"
              />
            </div>

            <!-- Deux colonnes: Priorité + Audience -->
            <div class="grid grid-cols-2 gap-4">
              <!-- Priorité -->
              <div>
                <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Priorité
                </label>
                <div class="flex items-center gap-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5">
                  <input
                    type="range"
                    formControlName="priority"
                    min="1"
                    max="10"
                    class="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-[#FC4E00]"
                  />
                  <span class="w-10 h-10 flex items-center justify-center rounded-xl bg-[#FC4E00] text-white font-bold text-lg shadow-sm">
                    {{ adForm.get('priority')?.value }}
                  </span>
                </div>
              </div>

              <!-- Audience cible -->
              <div>
                <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Audience
                </label>
                <select
                  formControlName="targetAudience"
                  class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[#FC4E00] focus:border-[#FC4E00] outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white cursor-pointer transition-all"
                >
                  <option value="all">Tous</option>
                  <option value="lost">Perte signalée</option>
                  <option value="found">Objet trouvé</option>
                </select>
              </div>
            </div>

            <!-- Toggle actif + Dates -->
            <div class="flex flex-wrap items-center gap-6 pt-2">
              <!-- Toggle actif -->
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" formControlName="isActive" class="sr-only peer">
                <div class="w-12 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#FC4E00]/20 dark:peer-focus:ring-[#FC4E00]/30 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-500 peer-checked:bg-[#FC4E00] shadow-inner"></div>
                <span class="ms-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Active</span>
              </label>

              <!-- Dates inline -->
              <div class="flex items-center gap-2 flex-1">
                <mat-icon class="text-gray-400" style="font-size: 18px; width: 18px; height: 18px;">date_range</mat-icon>
                <input
                  type="date"
                  formControlName="startDate"
                  class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#FC4E00] focus:border-[#FC4E00] outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm transition-all"
                  placeholder="Début"
                />
                <span class="text-gray-400">→</span>
                <input
                  type="date"
                  formControlName="endDate"
                  class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#FC4E00] focus:border-[#FC4E00] outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm transition-all"
                  placeholder="Fin"
                />
              </div>
            </div>
          </div>

          <!-- Colonne droite: Aperçu live (desktop only) -->
          <div class="hidden lg:block w-80 shrink-0">
            <div class="sticky top-0">
              <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <mat-icon style="font-size: 18px; width: 18px; height: 18px;">visibility</mat-icon>
                Aperçu en direct
              </h3>
              
              <!-- Card Preview -->
              <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <!-- Image -->
                <div class="relative h-44 bg-gray-100 dark:bg-gray-700 overflow-hidden">
                  @if (adForm.get('imageUrl')?.value) {
                    <img 
                      [src]="adForm.get('imageUrl')?.value" 
                      alt="Aperçu" 
                      class="w-full h-full object-cover"
                      (error)="onImageError($event)"
                    />
                    <!-- Badge priorité -->
                    <div class="absolute top-3 right-3 px-2.5 py-1 bg-[#FC4E00] text-white text-xs font-bold rounded-full shadow-md">
                      P{{ adForm.get('priority')?.value }}
                    </div>
                  } @else {
                    <div class="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
                      <div class="text-center">
                        <mat-icon style="font-size: 48px; width: 48px; height: 48px;">image</mat-icon>
                        <p class="text-sm mt-2">Ajoutez une URL d'image</p>
                      </div>
                    </div>
                  }
                </div>
                
                <!-- Content -->
                <div class="p-4">
                  <h4 class="font-bold text-gray-900 dark:text-white text-lg line-clamp-1">
                    {{ adForm.get('title')?.value || 'Titre de la publicité' }}
                  </h4>
                  <p class="text-gray-600 dark:text-gray-400 text-sm mt-2 line-clamp-3">
                    {{ adForm.get('description')?.value || 'La description de votre publicité apparaîtra ici...' }}
                  </p>
                  
                  <!-- CTA Button Preview -->
                  @if (adForm.get('linkUrl')?.value) {
                    <div class="mt-4">
                      <span class="inline-flex items-center gap-1.5 px-4 py-2 bg-[#FC4E00] text-white text-sm font-medium rounded-lg">
                        En savoir plus
                        <mat-icon style="font-size: 16px; width: 16px; height: 16px;">arrow_forward</mat-icon>
                      </span>
                    </div>
                  }
                </div>

                <!-- Footer status -->
                <div class="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-100 dark:border-gray-600 flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span [class]="'w-2 h-2 rounded-full ' + (adForm.get('isActive')?.value ? 'bg-green-500' : 'bg-gray-400')"></span>
                    <span class="text-xs text-gray-500 dark:text-gray-400">
                      {{ adForm.get('isActive')?.value ? 'Active' : 'Inactive' }}
                    </span>
                  </div>
                  <span class="text-xs text-gray-400 dark:text-gray-500">
                    {{ getAudienceLabel(adForm.get('targetAudience')?.value) }}
                  </span>
                </div>
              </div>

              <!-- Tips -->
              <div class="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                <p class="text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
                  <mat-icon class="shrink-0" style="font-size: 16px; width: 16px; height: 16px;">lightbulb</mat-icon>
                  <span>Conseil : Utilisez des images de haute qualité (min. 400x200px) pour un meilleur rendu.</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Mobile: Aperçu simplifié -->
        <div class="lg:hidden mt-6">
          @if (adForm.get('imageUrl')?.value) {
            <div class="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
              <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 block">Aperçu de l'image</span>
              <div class="relative h-32 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                <img 
                  [src]="adForm.get('imageUrl')?.value" 
                  alt="Aperçu" 
                  class="w-full h-full object-cover"
                  (error)="onImageError($event)"
                />
              </div>
            </div>
          }
        </div>
      </form>
    </mat-dialog-content>

    <!-- Actions -->
    <mat-dialog-actions align="end" class="border-t border-gray-200 dark:border-gray-700 pt-4 gap-3">
      <button 
        type="button" 
        mat-button
        (click)="onCancel()"
        class="px-6 py-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl font-medium transition-colors">
        Annuler
      </button>
      <button 
        type="submit"
        form="adForm"
        (click)="onSubmit()"
        [disabled]="isLoading() || adForm.invalid"
        class="inline-flex items-center gap-2 px-8 py-2.5 bg-[#FC4E00] hover:bg-[#d94300] disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
        @if (isLoading()) {
          <mat-spinner diameter="18"></mat-spinner>
        } @else {
          <mat-icon style="font-size: 20px; width: 20px; height: 20px;">
            {{ data.mode === 'edit' ? 'save' : 'add' }}
          </mat-icon>
        }
        {{ data.mode === 'edit' ? 'Mettre à jour' : 'Créer la publicité' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    :host {
      display: block;
    }

    ::ng-deep .mat-mdc-dialog-container .mdc-dialog__surface {
      border-radius: 20px !important;
    }

    ::ng-deep .mat-mdc-progress-spinner circle {
      stroke: white !important;
    }

    .line-clamp-1 {
      display: -webkit-box;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .line-clamp-3 {
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    input[type="range"]::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #FC4E00;
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(252, 78, 0, 0.4);
    }

    input[type="range"]::-moz-range-thumb {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #FC4E00;
      cursor: pointer;
      border: none;
      box-shadow: 0 2px 6px rgba(252, 78, 0, 0.4);
    }
  `]
})
export class AdFormDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<AdFormDialogComponent>);
  data = inject<AdFormDialogData>(MAT_DIALOG_DATA);

  isLoading = signal(false);
  adForm: FormGroup;

  constructor() {
    this.adForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.maxLength(500)]],
      imageUrl: ['', [Validators.required]],
      videoUrl: [''],
      linkUrl: [''],
      isActive: [true],
      priority: [5, [Validators.required, Validators.min(1), Validators.max(10)]],
      targetAudience: ['all'],
      startDate: [null],
      endDate: [null],
    });
  }

  ngOnInit(): void {
    if (this.data.mode === 'edit' && this.data.ad) {
      this.adForm.patchValue({
        title: this.data.ad.title,
        description: this.data.ad.description,
        imageUrl: this.data.ad.imageUrl,
        videoUrl: this.data.ad.videoUrl || '',
        linkUrl: this.data.ad.linkUrl || '',
        isActive: this.data.ad.isActive,
        priority: this.data.ad.priority,
        targetAudience: this.data.ad.targetAudience || 'all',
        startDate: this.data.ad.startDate ? this.formatDateForInput(this.data.ad.startDate) : null,
        endDate: this.data.ad.endDate ? this.formatDateForInput(this.data.ad.endDate) : null,
      });
    } else {
      // Valeurs par défaut pour une nouvelle publicité
      this.adForm.patchValue({
        title: 'Étiquettes connectées TrackTag',
        description: 'Ne perdez plus jamais vos affaires ! Nos étiquettes GPS vous permettent de localiser vos objets en temps réel. -20% avec le code FOUND20.',
        imageUrl: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400',
        videoUrl: '',
        linkUrl: 'https://exemple-tracktag.com',
        priority: 5,
      });
    }
  }

  private formatDateForInput(date: any): string {
    if (!date) return '';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toISOString().split('T')[0];
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = 'https://via.placeholder.com/400x200?text=Image+non+disponible';
  }

  getAudienceLabel(value: string): string {
    switch (value) {
      case 'lost': return 'Perte signalée';
      case 'found': return 'Objet trouvé';
      default: return 'Tous les utilisateurs';
    }
  }

  onSubmit() {
    if (this.adForm.invalid) return;

    const formValue = this.adForm.value;
    const adData: CreateAdData = {
      title: formValue.title,
      description: formValue.description,
      imageUrl: formValue.imageUrl,
      videoUrl: formValue.videoUrl || undefined,
      linkUrl: formValue.linkUrl || undefined,
      isActive: formValue.isActive,
      priority: formValue.priority,
      targetAudience: formValue.targetAudience,
      startDate: formValue.startDate ? new Date(formValue.startDate) : undefined,
      endDate: formValue.endDate ? new Date(formValue.endDate) : undefined,
    };

    this.dialogRef.close({ success: true, data: adData });
  }

  onCancel() {
    this.dialogRef.close({ success: false });
  }
}
