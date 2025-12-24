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
            <label class="text-sm font-semibold text-gray-700">Catégorie <span class="text-red-500">*</span></label>
            <select
               [value]="selectedCategoryId"
               (change)="onCategoryChange($event)"
               class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#009245] focus:ring-2 focus:ring-[#009245]/10 outline-none transition-all duration-200 cursor-pointer font-medium text-gray-700"
            >
               <option value="">Sélectionnez une catégorie</option>
               <option
                  *ngFor="let category of categories"
                  [value]="category.id"
                  [style.color]="category.color"
               >
                  {{ category.name }}
               </option>
            </select>
         </div>

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
