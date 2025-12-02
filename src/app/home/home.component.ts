import { Component, inject, OnInit, signal } from '@angular/core';
// import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../components/header/header.component';
import { FooterComponent } from '../components/footer/footer.component';
import { Router, RouterOutlet } from '@angular/router';
import { ObjectItemComponent } from '../components/object-item/object-item.component';
import { SearchFieldComponent } from '../components/search-field/search-field.component';
import { DeclarationService } from '../services/declaration.service';
import { DeclarationData } from '../types/declaration';

export interface Item {
   title: string;
   description: string;
   location: string;
   images: string[];
   currentImageIndex: number;
}

const items = [
   {
      title: 'Casque sans fil Sony',
      description:
         "Casque noir trouvé sur un banc. Quelques rayures sur l'arceau mais fonctionne parfaitement.",
      location: 'Gare du Nord - Hall principal',
      images: [
         'assets/cartImage.png',
         'https://images.unsplash.com/photo-1583394838336-acd977736f90?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      ],
      currentImageIndex: 0,
   },
   {
      title: 'Trousseau de clés',
      description:
         'Trousseau contenant 3 clés et un porte-clés en métal en forme de Tour Eiffel.',
      location: 'Métro Ligne 4 - Siège',
      images: [
         'assets/cartImage.png',
         'https://images.unsplash.com/photo-1563288784-8740217d3421?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      ],
      currentImageIndex: 0,
   },
   {
      title: 'iPhone 12 Noir',
      description:
         "iPhone avec coque transparente trouvé par terre. L'écran est verrouillé, fond d'écran de plage.",
      location: 'Cafétéria - Table 4',
      images: [
         'assets/cartImage.png',
         'https://images.unsplash.com/photo-1592899671815-277043984c28?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      ],
      currentImageIndex: 0,
   },
   {
      title: 'Portefeuille en cuir',
      description:
         "Portefeuille marron en cuir usé. Contient des cartes de fidélité mais pas de papiers d'identité.",
      location: "Salle d'attente B",
      images: [
         'assets/cartImage.png',
         'https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      ],
      currentImageIndex: 0,
   },
   {
      title: 'Casque sans fil Sony',
      description:
         "Casque noir trouvé sur un banc. Quelques rayures sur l'arceau mais fonctionne parfaitement.",
      location: 'Gare du Nord - Hall principal',
      images: [
         'assets/cartImage.png',
         'https://images.unsplash.com/photo-1583394838336-acd977736f90?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      ],
      currentImageIndex: 0,
   },
   {
      title: 'Trousseau de clés',
      description:
         'Trousseau contenant 3 clés et un porte-clés en métal en forme de Tour Eiffel.',
      location: 'Métro Ligne 4 - Siège',
      images: [
         'assets/cartImage.png',
         'https://images.unsplash.com/photo-1563288784-8740217d3421?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      ],
      currentImageIndex: 0,
   },
   {
      title: 'iPhone 12 Noir',
      description:
         "iPhone avec coque transparente trouvé par terre. L'écran est verrouillé, fond d'écran de plage.",
      location: 'Cafétéria - Table 4',
      images: [
         'assets/cartImage.png',
         'https://images.unsplash.com/photo-1592899671815-277043984c28?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      ],
      currentImageIndex: 0,
   },
   {
      title: 'Portefeuille en cuir',
      description:
         "Portefeuille marron en cuir usé. Contient des cartes de fidélité mais pas de papiers d'identité.",
      location: "Salle d'attente B",
      images: [
         'assets/cartImage.png',
         'https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      ],
      currentImageIndex: 0,
   },
];

@Component({
   selector: 'app-home',
   templateUrl: './home.component.html',
   styleUrl: './home.component.css',
   imports: [
      CommonModule,
      HeaderComponent,
      FooterComponent,
      RouterOutlet,
      ObjectItemComponent,
      SearchFieldComponent,
   ],
   standalone: true,
})
export class HomeComponent implements OnInit {
   ngOnInit(): void {
      this.declarationService.getDeclarations().subscribe({
         next: (declarations) => {
            this.initialItems.set(declarations);
            this.filteredItems.set(declarations);
         },
         error: (error) => {
            console.error('Erreur lors de la récupération des déclarations :', error);
         },
      });
   }
   router = inject(Router);

   private declarationService = inject(DeclarationService);

   initialItems = signal<DeclarationData[]>([]);
   filteredItems = signal<DeclarationData[]>(this.initialItems());

   filterItems(searchTerm: string | null) {
      if (searchTerm) {
         const lowerTerm = searchTerm.toLowerCase();
         const filterResults = this.initialItems().filter(
            (item) =>
               item.title.toLowerCase().includes(lowerTerm) ||
               item.description.toLowerCase().includes(lowerTerm) ||
               item.location.toLowerCase().includes(lowerTerm),
         );
         this.filteredItems.set(filterResults);
      }
      else{
         this.filteredItems.set(this.initialItems());
      }
   }
}
