import { DeclarationData, DeclarationType } from '@/types/declaration';
import { CommonModule } from '@angular/common';
import { Component, inject, input, OnInit, signal, HostListener, output } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '@/services/auth.service';
import { DeclarationService } from '@/services/declaration.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmationService } from '@/services/confirmation.service';

@Component({
   selector: 'app-object-item',
   templateUrl: './object-item.component.html',
   styleUrl: './object-item.component.css',
   standalone: true,
   imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
})
export class ObjectItemComponent implements OnInit {
   item = input.required<DeclarationData>();
   currentIndex = 0;
   images: string[] = [];
   
   // Événement pour ouvrir la modale de détail
   openDetailModal = output<DeclarationData>();
   
   private readonly router = inject(Router); 
   private readonly dialog = inject(MatDialog);
   private readonly authService = inject(AuthService);
   private readonly declarationService = inject(DeclarationService);
   private readonly snackBar = inject(MatSnackBar);
   private readonly confirmationService = inject(ConfirmationService);

   isShowActionsBtn = signal(false);
   
   // État pour la modal de prévisualisation
   showPreviewModal = signal(false);
   previewIndex = signal(0);
   
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

   // Méthode pour ouvrir la modale de détail
   onItemClick(): void {
      this.openDetailModal.emit(this.item());
   }
   
   editDeclaration(): void {
      // Naviguer vers la page d'édition appropriée selon le type
      this.isShowActionsBtn.set(false);
      const editRoute = this.isLost() ? '/déclarer-perte' : '/déclarer-objet-trouvé';
      this.router.navigate([editRoute], { queryParams: { edit: this.item().id } });
   }

   deleteDeclaration(): void {
      this.isShowActionsBtn.set(false);

      this.confirmationService.confirmDeleteAccount({
         title: 'Supprimer la déclaration',
         message: 'Êtes-vous sûr de vouloir supprimer cette déclaration ? Cette action est irréversible et toutes les données associées seront supprimées.'
      }).subscribe(result => {
         if (result === true) {
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
      });
   }
   
   public get currentImageUrl(): string {
      return this.images[this.currentIndex];
   }

   private updateIndex(newIndex: number, event: Event): void {
      event.stopPropagation();
      this.currentIndex = newIndex;
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
      this.previewIndex.set(this.currentIndex);
      this.showPreviewModal.set(true);
   }

   closePreview() {
      this.showPreviewModal.set(false);
   }

   nextPreviewImage() {
      const newIndex = (this.previewIndex() + 1) % this.images.length;
      this.previewIndex.set(newIndex);
   }

   prevPreviewImage() {
      const newIndex = (this.previewIndex() - 1 + this.images.length) % this.images.length;
      this.previewIndex.set(newIndex);
   }

   get currentPreviewImage(): string {
      return this.images[this.previewIndex()];
   }

   @HostListener('window:keydown', ['$event'])
   handleKeyDown(event: KeyboardEvent) {
      if (!this.showPreviewModal()) return;
      
      if (event.key === 'ArrowLeft') {
         this.prevPreviewImage();
      } else if (event.key === 'ArrowRight') {
         this.nextPreviewImage();
      } else if (event.key === 'Escape') {
         this.closePreview();
      }
   }

   // Removed old preview methods as they are handled by the dialog
}
