import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DeclarationData, DeclarationType } from '@/types/declaration';
import { Coordinates } from '@/services/location.service';
import { ImagePreviewDialogComponent } from '../image-preview-dialog/image-preview-dialog.component';

declare var google: any;

interface DialogData {
  declaration: DeclarationData;
  userLocation: Coordinates | null;
}

@Component({
  selector: 'app-declaration-details-dialog',
  standalone: true,
  imports: [
    CommonModule, 
    MatDialogModule, 
    MatButtonModule, 
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <div class="flex flex-col h-full max-h-[90vh]">
      <!-- Header with Image Background if available -->
      <div class="relative shrink-0">
        @if (data.declaration.images && data.declaration.images.length > 0) {
          <div class="h-48 md:h-64 w-full overflow-hidden relative cursor-pointer group" (click)="openPreview(0)">
            <div class="absolute inset-0 bg-linear-to-t from-black/60 to-transparent z-10"></div>
            <img [src]="data.declaration.images[0].downloadURL" [alt]="data.declaration.title" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105">
            
            <!-- Fullscreen Icon on hover -->
            <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/30 backdrop-blur-sm rounded-full p-4 opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 transform scale-75 group-hover:scale-100">
              <mat-icon class="text-white text-3xl">fullscreen</mat-icon>
            </div>

            <button mat-icon-button (click)="$event.stopPropagation(); close()" class="absolute top-4 right-4 z-20 text-white bg-black/20 hover:bg-black/40 backdrop-blur-sm">
              <mat-icon>close</mat-icon>
            </button>
            
            <button mat-icon-button (click)="$event.stopPropagation(); share()" class="absolute top-4 right-16 z-20 text-white bg-black/20 hover:bg-black/40 backdrop-blur-sm">
              <mat-icon>share</mat-icon>
            </button>

            <div class="absolute bottom-4 left-6 z-20 text-white">
              <div class="flex items-center gap-2 mb-2">
                <span [class]="'px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ' + (data.declaration.type === DeclarationType.FOUND ? 'bg-[#009245] text-white' : 'bg-orange-500 text-white')">
                  {{ data.declaration.type === DeclarationType.FOUND ? 'Objet Trouvé' : 'Objet Perdu' }}
                </span>
                <span class="text-sm font-medium opacity-90">{{ data.declaration.date | date:'dd MMMM yyyy' }}</span>
              </div>
              <h2 class="text-2xl md:text-3xl font-bold shadow-sm">{{ data.declaration.title }}</h2>
            </div>
          </div>
        } @else {
          <div class="p-6 border-b border-gray-100 flex justify-between items-start">
            <div>
              <div class="flex items-center gap-2 mb-2">
                <span [class]="'px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ' + (data.declaration.type === DeclarationType.FOUND ? 'bg-green-100 text-[#009245]' : 'bg-orange-100 text-orange-700')">
                  {{ data.declaration.type === DeclarationType.FOUND ? 'Objet Trouvé' : 'Objet Perdu' }}
                </span>
                <span class="text-sm text-gray-500">{{ data.declaration.date | date:'dd MMMM yyyy' }}</span>
              </div>
              <h2 class="text-2xl font-bold text-gray-900">{{ data.declaration.title }}</h2>
            </div>
            <button mat-icon-button (click)="close()" class="text-gray-400 hover:text-gray-600">
              <mat-icon>close</mat-icon>
            </button>
            <button mat-icon-button (click)="share()" class="text-gray-400 hover:text-gray-600 mr-2">
              <mat-icon>share</mat-icon>
            </button>
          </div>
        }
      </div>

      <!-- Scrollable Content -->
      <div class="flex-1 overflow-y-auto p-6">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <!-- Main Info (Left Column) -->
          <div class="lg:col-span-2 space-y-8">
            
            <!-- Description -->
            <div>
              <h3 class="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <mat-icon class="text-gray-400">description</mat-icon>
                Description
              </h3>
              <p class="text-gray-600 leading-relaxed whitespace-pre-wrap text-base">{{ data.declaration.description }}</p>
            </div>

            <!-- Additional Images -->
            @if (data.declaration.images && data.declaration.images.length > 1) {
              <div>
                <h3 class="text-lg font-bold text-gray-900 mb-3">Autres photos</h3>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  @for (img of data.declaration.images.slice(1); track img; let i = $index) {
                    <div class="aspect-square rounded-xl overflow-hidden border border-gray-200 cursor-pointer hover:shadow-lg transition-all group relative" (click)="openPreview(i + 1)">
                      <img [src]="img.downloadURL" [alt]="data.declaration.title" class="w-full h-full object-cover hover:scale-105 transition-transform duration-500">
                      <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                        <mat-icon class="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">fullscreen</mat-icon>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }

            <!-- Distance & Travel Info -->
            @if (data.userLocation) {
              <div class="bg-blue-50 rounded-xl p-5 border border-blue-100">
                <h3 class="text-blue-900 font-bold mb-4 flex items-center gap-2">
                  <mat-icon>directions</mat-icon>
                  Itinéraire depuis votre position
                </h3>
                
                @if (isLoadingRoute) {
                  <div class="flex justify-center py-4">
                    <mat-spinner diameter="30"></mat-spinner>
                  </div>
                } @else if (distance && duration) {
                  <div class="flex flex-wrap gap-4">
                    <div class="flex items-center gap-3 bg-white px-4 py-2 rounded-lg shadow-sm">
                      <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <mat-icon>straighten</mat-icon>
                      </div>
                      <div>
                        <p class="text-xs text-gray-500 uppercase font-bold">Distance</p>
                        <p class="text-lg font-bold text-gray-900">{{ distance }}</p>
                      </div>
                    </div>

                    <div class="flex items-center gap-3 bg-white px-4 py-2 rounded-lg shadow-sm">
                      <div class="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                        <mat-icon>timer</mat-icon>
                      </div>
                      <div>
                        <p class="text-xs text-gray-500 uppercase font-bold">Durée estimée</p>
                        <p class="text-lg font-bold text-gray-900">{{ duration }}</p>
                      </div>
                    </div>

                    <div class="flex items-center gap-2 ml-auto">
                       <button mat-icon-button [class]="travelMode === 'DRIVING' ? 'text-blue-600 bg-blue-100' : 'text-gray-400'" (click)="setTravelMode('DRIVING')" matTooltip="Voiture">
                         <mat-icon>directions_car</mat-icon>
                       </button>
                       <button mat-icon-button [class]="travelMode === 'WALKING' ? 'text-blue-600 bg-blue-100' : 'text-gray-400'" (click)="setTravelMode('WALKING')" matTooltip="Marche">
                         <mat-icon>directions_walk</mat-icon>
                       </button>
                       <button mat-icon-button [class]="travelMode === 'TRANSIT' ? 'text-blue-600 bg-blue-100' : 'text-gray-400'" (click)="setTravelMode('TRANSIT')" matTooltip="Transports">
                         <mat-icon>directions_transit</mat-icon>
                       </button>
                    </div>
                  </div>
                } @else {
                  <p class="text-sm text-gray-500 italic">Impossible de calculer l'itinéraire.</p>
                }
              </div>
            }
          </div>

          <!-- Sidebar Info (Right Column) -->
          <div class="space-y-6">
            <!-- Key Details Card -->
            <div class="bg-gray-50 p-6 rounded-2xl border border-gray-100">
              <div class="space-y-4">
                <div>
                  <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Catégorie</h3>
                  <div class="flex items-center gap-2">
                    <mat-icon class="text-gray-500">category</mat-icon>
                    <p class="text-gray-900 font-medium">{{ data.declaration.category }}</p>
                  </div>
                </div>
                
                <div class="h-px bg-gray-200"></div>

                <div>
                  <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Lieu</h3>
                  <div class="flex items-start gap-2">
                    <mat-icon class="text-gray-500 mt-0.5">location_on</mat-icon>
                    <p class="text-gray-900 font-medium">{{ data.declaration.location }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Contact Actions -->
            <div class="space-y-3">
              <h3 class="text-lg font-bold text-gray-900">Contacter</h3>
              @if (data.declaration.contactEmail) {
                <a [href]="'mailto:' + data.declaration.contactEmail" 
                   class="flex items-center justify-center gap-3 w-full px-6 py-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                  <mat-icon>email</mat-icon>
                  Envoyer un email
                </a>
              }
              @if (data.declaration.contactPhone) {
                <a [href]="'tel:' + data.declaration.contactPhone" 
                   class="flex items-center justify-center gap-3 w-full px-6 py-4 bg-[#009245] hover:bg-green-700 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                  <mat-icon>phone</mat-icon>
                  Appeler ({{ data.declaration.contactPhone }})
                </a>
              }
              @if (!data.declaration.contactEmail && !data.declaration.contactPhone) {
                <div class="p-4 bg-gray-100 rounded-xl text-center text-gray-500 text-sm">
                  Aucune information de contact disponible
                </div>
              }
            </div>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    /* Custom scrollbar for the content area */
    .overflow-y-auto::-webkit-scrollbar {
      width: 8px;
    }
    .overflow-y-auto::-webkit-scrollbar-track {
      background: transparent;
    }
    .overflow-y-auto::-webkit-scrollbar-thumb {
      background-color: rgba(0, 0, 0, 0.1);
      border-radius: 4px;
    }
    .overflow-y-auto::-webkit-scrollbar-thumb:hover {
      background-color: rgba(0, 0, 0, 0.2);
    }
  `]
})
export class DeclarationDetailsDialogComponent implements OnInit {
  DeclarationType = DeclarationType;
  distance: string | null = null;
  duration: string | null = null;
  travelMode: 'DRIVING' | 'WALKING' | 'TRANSIT' = 'DRIVING';
  isLoadingRoute = false;

  constructor(
    public dialogRef: MatDialogRef<DeclarationDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    if (this.data.userLocation && this.data.declaration.coordinates) {
      this.calculateRoute();
    }
  }

  close() {
    this.dialogRef.close();
  }

  share() {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: this.data.declaration.title,
        text: this.data.declaration.description,
        url: url
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(url).then(() => {
        this.snackBar.open('Lien copié dans le presse-papier', 'OK', { duration: 3000 });
      });
    }
  }

  openPreview(index: number) {
    if (!this.data.declaration.images || this.data.declaration.images.length === 0) return;

    this.dialog.open(ImagePreviewDialogComponent, {
      maxWidth: '100vw',
      maxHeight: '100vh',
      height: '100%',
      width: '100%',
      panelClass: 'full-screen-modal',
      backdropClass: 'bg-transparent',
      data: {
        images: this.data.declaration.images,
        startIndex: index
      }
    });
  }

  setTravelMode(mode: 'DRIVING' | 'WALKING' | 'TRANSIT') {
    this.travelMode = mode;
    this.calculateRoute();
  }

  calculateRoute() {
    if (typeof google === 'undefined' || !google.maps) return;

    this.isLoadingRoute = true;
    const origin = new google.maps.LatLng(
      this.data.userLocation!.latitude,
      this.data.userLocation!.longitude
    );
    const destination = new google.maps.LatLng(
      this.data.declaration.coordinates!.lat,
      this.data.declaration.coordinates!.lng
    );

    const service = new google.maps.DistanceMatrixService();
    service.getDistanceMatrix(
      {
        origins: [origin],
        destinations: [destination],
        travelMode: google.maps.TravelMode[this.travelMode],
        unitSystem: google.maps.UnitSystem.METRIC
      },
      (response: any, status: any) => {
        this.isLoadingRoute = false;
        if (status === 'OK' && response.rows[0].elements[0].status === 'OK') {
          this.distance = response.rows[0].elements[0].distance.text;
          this.duration = response.rows[0].elements[0].duration.text;
        } else {
          console.warn('Distance Matrix failed or no route found', status);
          this.distance = null;
          this.duration = null;
        }
      }
    );
  }
}
