import { Component, inject, signal } from '@angular/core';
import { DeclarationData } from '../types/declaration';
import { DeclarationService } from '../services/declaration.service';
import { Router } from '@angular/router';
import { ObjectItemComponent } from "../components/object-item/object-item.component";
import { SearchFieldComponent } from "../components/search-field/search-field.component";
import { CommonModule } from '@angular/common';

@Component({
   selector: 'app-search',
   templateUrl: './search.component.html',
   styleUrl: './search.component.css',
   standalone: true,
   imports: [ObjectItemComponent, SearchFieldComponent,CommonModule],
})
export class SearchComponent {
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
      } else {
         this.filteredItems.set(this.initialItems());
      }
   }
}
