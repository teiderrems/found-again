import { Component, Input, Output, EventEmitter, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../services/category.service';
import { DefaultCategory } from '../constants/categories.constants';
import { MaterialCategory } from '@/constants/categories-material.constants';
import { MatIconModule } from "@angular/material/icon";

@Component({
   selector: 'app-category-selector',
   standalone: true,
   imports: [CommonModule, MatIconModule, FormsModule],
   template: `
      <div class="space-y-4">
         <!-- Sélecteur de catégorie -->
         <div class="flex flex-col space-y-2">
            <label class="text-sm font-semibold text-gray-700">Catégorie <span class="text-red-500">*</span></label>
            <div class="flex gap-2">
               <select
                  [value]="selectedCategoryId"
                  (change)="onCategoryChange($event)"
                  class="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#009245] focus:ring-2 focus:ring-[#009245]/10 outline-none transition-all duration-200 cursor-pointer font-medium text-gray-700"
               >
                  <option value="">Sélectionnez une catégorie</option>
                  <option
                     *ngFor="let category of categories"
                     [value]="category.name"
                     [style.color]="category.color"
                  >
                     {{ category.name }}
                  </option>
               </select>
               <button
                  (click)="toggleAddCategory()"
                  class="px-4 py-3 border-2 border-[#009245] text-[#009245] rounded-xl hover:bg-[#009245] hover:text-white transition-all duration-200 font-medium flex items-center gap-2"
                  title="Ajouter une nouvelle catégorie"
               >
                  <mat-icon>add</mat-icon>
                  <span class="hidden sm:inline">Ajouter</span>
               </button>
            </div>
         </div>

         <!-- Formulaire pour ajouter une nouvelle catégorie -->
         @if (showAddCategoryForm()) {
            <div class="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
               <h4 class="font-semibold text-gray-900">Nouvelle catégorie</h4>
               
               <input
                  [(ngModel)]="newCategoryName"
                  type="text"
                  placeholder="Nom de la catégorie"
                  class="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[#009245] outline-none transition-all"
               />
               
               <textarea
                  [(ngModel)]="newCategoryDescription"
                  placeholder="Description (optionnel)"
                  class="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[#009245] outline-none transition-all resize-none"
                  rows="2"
               ></textarea>

               <div class="flex gap-2">
                  <button
                     (click)="createCategory()"
                     [disabled]="!newCategoryName.trim()"
                     class="flex-1 px-4 py-2 bg-[#009245] text-white rounded-lg hover:bg-[#007a35] disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                  >
                     Créer
                  </button>
                  <button
                     (click)="toggleAddCategory()"
                     class="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all font-medium"
                  >
                     Annuler
                  </button>
               </div>
            </div>
         }

         <!-- Description de la catégorie sélectionnée -->
         <div *ngIf="selectedCategory" class="mt-4 p-4 bg-linear-to-r from-[#009245]/5 to-green-50 border-l-4 border-[#009245] rounded-lg animate-in fade-in slide-in-from-left-2 duration-300">
            <div class="flex items-start space-x-3">
               <mat-icon [fontIcon]="selectedCategory.icon" class="text-[#009245] text-2xl mt-1"></mat-icon>
               <div class="flex-1">
                  <h4 class="font-semibold text-gray-900">{{ selectedCategory.name }}</h4>
                  <p class="text-sm text-gray-600 mt-1">{{ selectedCategory.description }}</p>
               </div>
            </div>
         </div>
      </div>
   `,
})
export class CategorySelectorComponent implements OnInit {
   private categoryService = inject(CategoryService);

   @Input() selectedCategoryId: string = '';
   @Input() showPopular: boolean = true;
   @Output() categorySelected = new EventEmitter<string>();

   categories: DefaultCategory[] = [];
   popularCategories: DefaultCategory[] = [];
   selectedCategory?: DefaultCategory;

   selectedCategories: string[] = [];
   showAddCategoryForm = signal(false);
   newCategoryName = '';
   newCategoryDescription = '';

   onCategorySelected(category: MaterialCategory): void {
      console.log('Catégorie sélectionnée:', category);
      this.selectedCategories = [category.id];
   }

   onCategoryDeselected(category: MaterialCategory): void {
      console.log('Catégorie désélectionnée:', category);
      this.selectedCategories = this.selectedCategories.filter(
         (id) => id !== category.id,
      );
   }

   ngOnInit() {
      this.loadCategories();
   }

   private loadCategories(): void {
      this.categoryService.getCategories().subscribe((categories) => {
         this.categories = categories;
         this.updateSelectedCategory();

         if (this.showPopular) {
            this.categoryService.getPopularCategories(8).subscribe((popular) => {
               this.popularCategories = popular;
            });
         }
      });
   }

   onCategoryChange(event: Event): void {
      const target = event.target as HTMLSelectElement;
      this.selectedCategoryId = target.value;
      this.updateSelectedCategory();
      this.categorySelected.emit(this.selectedCategoryId);
   }

   selectCategory(category: DefaultCategory): void {
      this.selectedCategoryId = category.id;
      this.updateSelectedCategory();
      this.categorySelected.emit(this.selectedCategoryId);
   }

   toggleAddCategory(): void {
      this.showAddCategoryForm.update(value => !value);
      if (!this.showAddCategoryForm()) {
         this.newCategoryName = '';
         this.newCategoryDescription = '';
      }
   }

   createCategory(): void {
      if (!this.newCategoryName.trim()) {
         console.warn('Le nom de la catégorie est vide');
         return;
      }

      // Créer une nouvelle catégorie personnalisée
      const newCategory: DefaultCategory = {
         id: this.newCategoryName.toLowerCase().replace(/\s+/g, '-'),
         name: this.newCategoryName.trim(),
         description: this.newCategoryDescription.trim() || 'Catégorie personnalisée',
         icon: 'category',
         color: '#009245',
         priority: this.categories.length + 1,
         tags: [this.newCategoryName.toLowerCase()],
      };

      // Ajouter à la liste des catégories
      this.categories.push(newCategory);
      
      // Mettre à jour le cache du service
      this.categoryService.updateCategoryCache(this.categories);

      // Sélectionner la nouvelle catégorie
      this.selectedCategoryId = newCategory.name;
      this.updateSelectedCategory();
      this.categorySelected.emit(this.selectedCategoryId);

      // Fermer le formulaire et réinitialiser
      this.showAddCategoryForm.set(false);
      this.newCategoryName = '';
      this.newCategoryDescription = '';

      console.log('Nouvelle catégorie créée:', newCategory);
   }

   private updateSelectedCategory(): void {
      this.selectedCategory = this.categories.find(
         (cat) => cat.id === this.selectedCategoryId || cat.name === this.selectedCategoryId,
      );
   }
}
