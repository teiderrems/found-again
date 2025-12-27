import { Component, Inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export interface ImagePreviewData {
  images: any[];
  startIndex: number;
}

@Component({
  selector: 'app-image-preview-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatIconModule, MatButtonModule],
  template: `
    <div class="relative w-full h-full flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all duration-300" (click)="close()">
        <button mat-icon-button (click)="close()" class="absolute top-4 right-4 text-white z-50 bg-black/20 hover:bg-black/40 backdrop-blur-sm transition-all duration-200">
            <mat-icon>close</mat-icon>
        </button>

        <div class="relative w-full h-full flex items-center justify-center p-4 pointer-events-none">
            <!-- Previous -->
            @if (data.images.length > 1) {
                <button mat-icon-button (click)="$event.stopPropagation(); prev()" class="pointer-events-auto absolute left-4 text-white bg-black/20 hover:bg-black/40 backdrop-blur-sm p-2 z-10 transition-all hover:scale-110">
                    <mat-icon>chevron_left</mat-icon>
                </button>
            }

            <!-- Image -->
            <img [src]="currentImage" 
                 class="pointer-events-auto max-w-[90vw] max-h-[85vh] object-contain select-none shadow-2xl rounded-lg transition-transform duration-300" 
                 [alt]="'Preview ' + currentIndex"
                 (click)="$event.stopPropagation()">

            <!-- Next -->
            @if (data.images.length > 1) {
                <button mat-icon-button (click)="$event.stopPropagation(); next()" class="pointer-events-auto absolute right-4 text-white bg-black/20 hover:bg-black/40 backdrop-blur-sm p-2 z-10 transition-all hover:scale-110">
                    <mat-icon>chevron_right</mat-icon>
                </button>
            }
            
            <!-- Counter -->
            <div class="absolute bottom-8 left-1/2 -translate-x-1/2 text-white bg-black/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium border border-white/10">
                {{ currentIndex + 1 }} / {{ data.images.length }}
            </div>
        </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
  `]
})
export class ImagePreviewDialogComponent {
  currentIndex = 0;

  constructor(
    public dialogRef: MatDialogRef<ImagePreviewDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ImagePreviewData
  ) {
    this.currentIndex = data.startIndex || 0;
  }

  get currentImage(): string {
    const img = this.data.images[this.currentIndex];
    return typeof img === 'string' ? img : img.downloadURL;
  }

  close() {
    this.dialogRef.close();
  }

  prev() {
    this.currentIndex = (this.currentIndex - 1 + this.data.images.length) % this.data.images.length;
  }

  next() {
    this.currentIndex = (this.currentIndex + 1) % this.data.images.length;
  }
  
  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowLeft') this.prev();
    if (event.key === 'ArrowRight') this.next();
    if (event.key === 'Escape') this.close();
  }
}
