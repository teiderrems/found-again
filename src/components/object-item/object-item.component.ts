import { DeclarationData } from '@/types/declaration';
import { CommonModule } from '@angular/common';
import { Component, input, OnInit, signal } from '@angular/core';

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
   isPreviewOpen = signal(false);

   private cacheBusterTimestamp: number = Date.now();

   ngOnInit(): void {
      this.images = this.item().images.map((img) => img.downloadURL);
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
      this.isPreviewOpen.set(true);
      document.body.style.overflow = 'hidden';
   }

   closePreview() {
      this.isPreviewOpen.set(false);
      document.body.style.overflow = 'auto';
   }

   nextPreviewImage(event: Event) {
      event.stopPropagation();
      this.nextImage(event);
   }

   prevPreviewImage(event: Event) {
      event.stopPropagation();
      this.prevImage(event);
   }
}
