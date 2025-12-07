import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategoryService } from '../services/category.service';
import { DefaultCategory } from '../constants/categories.constants';
import { MaterialCategory } from '@/constants/categories-material.constants';
import { MatIconModule } from "@angular/material/icon";

@Component({
   selector: 'app-category-selector',
   standalone: true,
   imports: [CommonModule, MatIconModule],
   template: `
      <div class="space-y-4">
         <!-- Sélecteur de catégorie -->
         <div class="flex flex-col space-y-2">
            <label class="text-sm font-medium text-gray-700">Catégorie *</label>
            <select
               [value]="selectedCategoryId"
               (change)="onCategoryChange($event)"
               class="form-select rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
               <option value="">Sélectionnez une catégorie</option>
               <option
                  *ngFor="let category of categories"
                  [value]="category.id"
                  [style.color]="category.color"
                  class=" flex space-x-1 items-center hover:cursor-pointer"
               >
                  <mat-icon [fontIcon]="category.icon "></mat-icon><span>{{ category.name }}</span>
               </option>
            </select>
         </div>

         <!-- Description de la catégorie sélectionnée -->
         <div *ngIf="selectedCategory" class="mt-4 p-3 bg-gray-50 rounded-lg">
            <h4 class="font-medium text-gray-800">{{ selectedCategory.name }}</h4>
            <p class="text-sm text-gray-600 mt-1">{{ selectedCategory.description }}</p>
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

   private updateSelectedCategory(): void {
      this.selectedCategory = this.categories.find(
         (cat) => cat.id === this.selectedCategoryId,
      );
   }
}
