import { Item } from '@/app/home/home.component';
import { CommonModule } from '@angular/common';
import { Component, input, signal } from '@angular/core';

@Component({
  selector: 'app-object-item',
  templateUrl: './object-item.component.html',
  styleUrl: './object-item.component.css',
  standalone:true,
  imports:[CommonModule]
})
export class ObjectItemComponent {

  item=input<Item>();
  currentIndex=signal(0);

  nextImage( event: Event) {
      event.stopPropagation();
      if (this.currentIndex() < this.item()!.images.length - 1) {
         this.currentIndex.update(value=>value++);
      } else {
         this.currentIndex.set(0);
      }
   }

   prevImage( event: Event) {
      event.stopPropagation();
      if (this.currentIndex() > 0) {
        this.currentIndex.update(value=>value--);
      } else {
         this.currentIndex.set(this.item()!.images.length - 1);
      }
   }
}
