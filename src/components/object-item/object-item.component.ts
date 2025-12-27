import { DeclarationData, DeclarationType } from '@/types/declaration';
import { CommonModule } from '@angular/common';
import { Component, inject, input, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ImagePreviewDialogComponent } from '../image-preview-dialog/image-preview-dialog.component';

@Component({
   selector: 'app-object-item',
   templateUrl: './object-item.component.html',
   styleUrl: './object-item.component.css',
   standalone: true,
   imports: [CommonModule],
})
export class ObjectItemComponent implements OnInit {
   item = input.required<DeclarationData>();
   currentIndex = 0;
   images: string[] = [];
   
   private readonly router = inject(Router); 
   private readonly dialog = inject(MatDialog);
   private cacheBusterTimestamp: number = Date.now();
   
   ngOnInit(): void {
      this.images = this.item().images.map((img) => img.downloadURL);
   }
   
   goToVerify() {
      //verifier-identite
      this.router.navigate(['/verifier-identite',this.item().id]);
   }

   isLost(): boolean {
      return this.item().type === DeclarationType.LOSS;
   }

   isFound(): boolean {
      return this.item().type === DeclarationType.FOUND;
   }

   getLocationLabel(): string {
      return this.isLost() ? 'Perdu à :' : 'Trouvé à :';
   }

   getHelpText(): string {
      if (this.isLost()) {
         return 'Si vous l\'avez vu, merci de partager toute information utile.';
      }
      return 'Si c\'est le vôtre, merci de décrire un détail supplémentaire.';
   }

   getButtonText(): string {
      return this.isLost() ? 'J\'ai peut-être des infos' : 'C\'est peut-être à moi';
   }
   
   public get currentImageUrl(): string {
      const url = this.images[this.currentIndex];
      return `${url}?t=${this.cacheBusterTimestamp}`;
   }

   private updateIndex(newIndex: number, event: Event): void {
      event.stopPropagation();
      this.currentIndex = newIndex;
      this.cacheBusterTimestamp = Date.now();
   }

   nextImage(event: Event) {
      const newIndex = (this.currentIndex + 1) % this.images.length;
      this.updateIndex(newIndex, event);
   }

   prevImage(event: Event) {
      const newIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
      this.updateIndex(newIndex, event);
   }

   openPreview() {
      this.dialog.open(ImagePreviewDialogComponent, {
         data: {
            images: this.images,
            startIndex: this.currentIndex
         },
         maxWidth: '100vw',
         maxHeight: '100vh',
         height: '100%',
         width: '100%',
         panelClass: 'full-screen-modal',
         backdropClass: 'bg-transparent'
      });
   }

   // Removed old preview methods as they are handled by the dialog
}
