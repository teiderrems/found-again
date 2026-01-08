import { DeclarationData, DeclarationType } from '@/types/declaration';
import { CommonModule } from '@angular/common';
import { Component, inject, input, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ImagePreviewDialogComponent } from '../image-preview-dialog/image-preview-dialog.component';
import { AuthService } from '@/services/auth.service';
import { DeclarationService } from '@/services/declaration.service';
import { MatSnackBar } from '@angular/material/snack-bar';

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
   private readonly authService = inject(AuthService);
   private readonly declarationService = inject(DeclarationService);
   private readonly snackBar = inject(MatSnackBar);
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

   isOwner(): boolean {
      const currentUserId = this.authService.getCurrentUserId();
      return currentUserId !== null && this.item().userId === currentUserId;
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
   
   editDeclaration(): void {
      // Naviguer vers la page d'édition appropriée selon le type
      const editRoute = this.isLost() ? '/objets-perdus/declarer' : '/objets-retrouves/declarer';
      this.router.navigate([editRoute], { queryParams: { edit: this.item().id } });
   }

   deleteDeclaration(): void {
      if (confirm('Êtes-vous sûr de vouloir supprimer cette déclaration ? Cette action est irréversible.')) {
         this.declarationService.deleteDeclaration(
            this.item().id,
            this.item().type,
            this.item().images
         ).subscribe({
            next: () => {
               this.snackBar.open('Déclaration supprimée avec succès', 'Fermer', { duration: 3000 });
               // Recharger la page ou émettre un événement pour rafraîchir la liste
               window.location.reload();
            },
            error: (error) => {
               console.error('Erreur lors de la suppression:', error);
               this.snackBar.open('Erreur lors de la suppression de la déclaration', 'Fermer', { duration: 3000 });
            }
         });
      }
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
