import { Component, OnInit } from '@angular/core';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { FormControl } from '@angular/forms';

interface Item {
   title: string;
   description: string;
   location: string;
   images: string[];
   currentImageIndex: number;
}

@Component({
  selector: 'app-app-home',
  templateUrl: './app-home.component.html',
  styleUrl: './app-home.component.css'
})
export class AppHomeComponent implements OnInit {
   searchControl = new FormControl('');

   items = [
      {
         title: 'Casque sans fil Sony',
         description: 'Casque noir trouvé sur un banc. Quelques rayures sur l\'arceau mais fonctionne parfaitement.',
         location: 'Gare du Nord - Hall principal',
         images: [
            'assets/cartImage.png',
            'https://images.unsplash.com/photo-1583394838336-acd977736f90?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
         ],
         currentImageIndex: 0
      },
      {
         title: 'Trousseau de clés',
         description: 'Trousseau contenant 3 clés et un porte-clés en métal en forme de Tour Eiffel.',
         location: 'Métro Ligne 4 - Siège',
         images: [
            'assets/cartImage.png',
            'https://images.unsplash.com/photo-1563288784-8740217d3421?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
         ],
         currentImageIndex: 0
      },
      {
         title: 'iPhone 12 Noir',
         description: 'iPhone avec coque transparente trouvé par terre. L\'écran est verrouillé, fond d\'écran de plage.',
         location: 'Cafétéria - Table 4',
         images: [
            'assets/cartImage.png',
            'https://images.unsplash.com/photo-1592899671815-277043984c28?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
         ],
         currentImageIndex: 0
      },
      {
         title: 'Portefeuille en cuir',
         description: 'Portefeuille marron en cuir usé. Contient des cartes de fidélité mais pas de papiers d\'identité.',
         location: 'Salle d\'attente B',
         images: [
            'assets/cartImage.png',
            'https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
         ],
         currentImageIndex: 0
      },
      {
         title: 'Casque sans fil Sony',
         description: 'Casque noir trouvé sur un banc. Quelques rayures sur l\'arceau mais fonctionne parfaitement.',
         location: 'Gare du Nord - Hall principal',
         images: [
            'assets/cartImage.png',
            'https://images.unsplash.com/photo-1583394838336-acd977736f90?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
         ],
         currentImageIndex: 0
      },
      {
         title: 'Trousseau de clés',
         description: 'Trousseau contenant 3 clés et un porte-clés en métal en forme de Tour Eiffel.',
         location: 'Métro Ligne 4 - Siège',
         images: [
            'assets/cartImage.png',
            'https://images.unsplash.com/photo-1563288784-8740217d3421?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
         ],
         currentImageIndex: 0
      },
      {
         title: 'iPhone 12 Noir',
         description: 'iPhone avec coque transparente trouvé par terre. L\'écran est verrouillé, fond d\'écran de plage.',
         location: 'Cafétéria - Table 4',
         images: [
            'assets/cartImage.png',
            'https://images.unsplash.com/photo-1592899671815-277043984c28?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
         ],
         currentImageIndex: 0
      },
      {
         title: 'Portefeuille en cuir',
         description: 'Portefeuille marron en cuir usé. Contient des cartes de fidélité mais pas de papiers d\'identité.',
         location: 'Salle d\'attente B',
         images: [
            'assets/cartImage.png',
            'https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
         ],
         currentImageIndex: 0
      }
   ];

   filteredItems = [...this.items];

   ngOnInit() {
      this.searchControl.valueChanges
         .pipe(
            debounceTime(300), // Attend 300ms que l'utilisateur arrête de taper (optimisation)
            distinctUntilChanged() // Évite de chercher 2 fois la même chose
         )
         .subscribe(searchTerm => {
            this.filterItems(searchTerm);
         });
   }

   filterItems(searchTerm: string | null) {
      if (!searchTerm) {
         this.filteredItems = this.items; // Si vide, on affiche tout
         return;
      }

      const lowerTerm = searchTerm.toLowerCase();

      this.filteredItems = this.items.filter(item =>
         item.title.toLowerCase().includes(lowerTerm) ||
         item.description.toLowerCase().includes(lowerTerm) ||
         item.location.toLowerCase().includes(lowerTerm)
      );
   }

   nextImage(item: Item, event: Event) {
      event.stopPropagation();
      if (item.currentImageIndex < item.images.length - 1) {
         item.currentImageIndex++;
      } else {
         item.currentImageIndex = 0; // Retour au début (boucle)
      }
   }

   prevImage(item: Item, event: Event) {
      event.stopPropagation();
      if (item.currentImageIndex > 0) {
         item.currentImageIndex--;
      } else {
         item.currentImageIndex = item.images.length - 1;
      }
   }

}
