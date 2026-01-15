import { Component, inject, signal, computed, HostListener, OnInit, OnDestroy } from '@angular/core';
import { DeclarationData, ObjectCondition } from '../../types/declaration';
import { DeclarationService } from '../../services/declaration.service';
import { Router } from '@angular/router';
import { ObjectItemComponent } from "../../components/object-item/object-item.component";
import { SearchFieldComponent } from "../../components/search-field/search-field.component";
import { DeclarationDetailsModalComponent } from "../../components/declaration-details-modal/declaration-details-modal.component";
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DEFAULT_CATEGORIES } from '../../constants/categories.constants';
import { AuthService } from '@/services/auth.service';

export interface AdvancedSearchFilters {
   searchTerm: string;
   type: 'all' | 'loss' | 'found';
   category: string;
   condition: string;
   dateFrom: Date | null;
   dateTo: Date | null;
   location: string;
   sortBy: 'date' | 'title' | 'category';
   sortOrder: 'asc' | 'desc';
}

@Component({
   selector: 'app-search',
   templateUrl: './search.component.html',
   styleUrl: './search.component.css',
   standalone: true,
   imports: [
      CommonModule,
      FormsModule,
      ObjectItemComponent,
      SearchFieldComponent,
      MatIconModule,
      MatButtonModule,
      MatSelectModule,
      MatFormFieldModule,
      MatDatepickerModule,
      MatNativeDateModule,
      MatInputModule,
      MatChipsModule,
      MatSlideToggleModule,
      MatProgressSpinnerModule,
      MatDialogModule
   ],
})
export class SearchComponent implements OnInit, OnDestroy {
   router = inject(Router);
   private declarationService = inject(DeclarationService);
   private authService = inject(AuthService);
   private dialog = inject(MatDialog);
   private userId = this.authService.getCurrentUserId();

   // Données chargées depuis Firestore
   loadedItems = signal<DeclarationData[]>([]);
   loading = signal(false);
   
   // Pagination offset-based
   readonly ITEMS_PER_PAGE = 12;
   currentSkipCount = signal(0);
   hasMoreItems = signal(true);
   loadingMore = signal(false);
   totalCount = signal(0);
   private scrollThreshold = 300;
   
   // Filtres avancés
   showAdvancedFilters = signal(false);
   filters = signal<AdvancedSearchFilters>({
      searchTerm: '',
      type: 'all',
      category: '',
      condition: '',
      dateFrom: null,
      dateTo: null,
      location: '',
      sortBy: 'date',
      sortOrder: 'desc'
   });

   // Catégories disponibles
   categories = DEFAULT_CATEGORIES;

   // Options pour l'état de l'objet
   ObjectCondition = ObjectCondition;
   conditionOptions = [
      { value: '', label: 'Tous les états' },
      { value: ObjectCondition.EXCELLENT, label: 'Excellent', icon: '⭐' },
      { value: ObjectCondition.GOOD, label: 'Bon', icon: '👍' },
      { value: ObjectCondition.FAIR, label: 'Correct', icon: '👌' },
      { value: ObjectCondition.POOR, label: 'Mauvais', icon: '👎' },
      { value: ObjectCondition.UNKNOWN, label: 'Inconnu', icon: '❓' },
   ];

   // Résultats filtrés (tri côté client uniquement, les filtres sont côté Firestore)
   filteredItems = computed(() => {
      const items = this.loadedItems();
      const f = this.filters();

      let result = [...items];

      // Tri côté client (le tri par date est déjà fait côté Firestore, mais on peut trier par autre chose)
      if (f.sortBy !== 'date' || f.sortOrder === 'asc') {
         result.sort((a, b) => {
            let comparison = 0;
            switch (f.sortBy) {
               case 'date':
                  comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
                  break;
               case 'title':
                  comparison = a.title.localeCompare(b.title);
                  break;
               case 'category':
                  comparison = a.category.localeCompare(b.category);
                  break;
            }
            return f.sortOrder === 'asc' ? comparison : -comparison;
         });
      }

      return result;
   });

   // Compteurs basés sur les éléments chargés
   lossCount = computed(() => this.loadedItems().filter(i => i.type === 'loss').length);
   foundCount = computed(() => this.loadedItems().filter(i => i.type === 'found').length);
   
   // Filtres actifs
   activeFiltersCount = computed(() => {
      const f = this.filters();
      let count = 0;
      if (f.type !== 'all') count++;
      if (f.category) count++;
      if (f.condition) count++;
      if (f.dateFrom) count++;
      if (f.dateTo) count++;
      if (f.location) count++;
      return count;
   });

   // Écouter le scroll pour le chargement infini
   @HostListener('window:scroll')
   onScroll(): void {
      if (this.loadingMore() || !this.hasMoreItems() || this.loading()) return;
      
      const scrollPosition = window.innerHeight + window.scrollY;
      const documentHeight = document.documentElement.scrollHeight;
      
      if (documentHeight - scrollPosition < this.scrollThreshold) {
         this.loadMoreItems();
      }
   }

   ngOnInit(): void {
      this.loadMoreItems();
      this.loadTotalCount();
   }

   ngOnDestroy(): void {
      // Cleanup si nécessaire
   }

   /**
    * Construit l'objet de filtres pour Firestore
    */
   private buildFiltersForFirestore() {
      const f = this.filters();
      return {
         type: f.type,
         searchTerm: f.searchTerm || undefined,
         category: f.category || undefined,
         condition: f.condition || undefined,
         dateFrom: f.dateFrom,
         dateTo: f.dateTo,
         location: f.location || undefined
      };
   }

   /**
    * Charge les données initiales avec pagination Firestore
    */
   private loadInitialData(): void {
      this.loading.set(true);
      this.loadedItems.set([]);
      this.currentSkipCount.set(0);
      this.hasMoreItems.set(true);
      
      this.declarationService.getActiveDeclarationsPaginated(
         this.ITEMS_PER_PAGE,
         0,
         this.buildFiltersForFirestore(),
         this.userId||undefined
      ).subscribe({
         next: (result) => {
            this.loadedItems.set(result.items);
            this.hasMoreItems.set(result.hasMore);
            this.currentSkipCount.set(this.ITEMS_PER_PAGE);
            this.loading.set(false);
         },
         error: (error) => {
            console.error('Erreur lors de la récupération des déclarations :', error);
            this.loading.set(false);
         },
      });
   }

   /**
    * Charge le nombre total de déclarations
    */
   private loadTotalCount(): void {
      const f = this.filters();
      this.declarationService.getActiveDeclarationsCount({ 
         type: f.type,
         category: f.category || undefined,
         dateFrom: f.dateFrom,
         dateTo: f.dateTo
      }).subscribe({
         next: (count) => {
            this.totalCount.set(count);
         },
         error: (error) => {
            console.error('Erreur lors du comptage des déclarations :', error);
         },
      });
   }

   /**
    * Charge plus d'éléments (pagination offset)
    */
   loadMoreItems(): void {
      if (this.loadingMore() || !this.hasMoreItems()) return;
      
      this.loadingMore.set(true);

      this.declarationService.getActiveDeclarationsPaginated(
         this.ITEMS_PER_PAGE,
         this.currentSkipCount(),
         this.buildFiltersForFirestore(),
         this.userId||undefined
      ).subscribe({
         next: (result) => {
            // Ajouter les nouveaux éléments aux existants
            this.loadedItems.update(items => [...items, ...result.items]);
            this.currentSkipCount.update(count => count + this.ITEMS_PER_PAGE);
            this.hasMoreItems.set(result.hasMore);
            this.loadingMore.set(false);
         },
         error: (error) => {
            console.error('Erreur lors du chargement supplémentaire :', error);
            this.loadingMore.set(false);
         },
      });
   }

   /**
    * Filtre par terme de recherche
    */
   filterItems(searchTerm: string | null) {
      this.updateFilter('searchTerm', searchTerm || '');
      this.loadInitialData();
      this.loadTotalCount();
   }

   toggleAdvancedFilters() {
      this.showAdvancedFilters.set(!this.showAdvancedFilters());
   }

   // Filtres qui déclenchent une requête Firestore
   private readonly firestoreFilters: (keyof AdvancedSearchFilters)[] = [
      'type', 'category', 'dateFrom', 'dateTo', 'location'
   ];

   updateFilter<K extends keyof AdvancedSearchFilters>(key: K, value: AdvancedSearchFilters[K]) {
      this.filters.update(f => ({ ...f, [key]: value }));
      
      // Recharger les données si c'est un filtre Firestore
      if (this.firestoreFilters.includes(key)) {
         this.loadInitialData();
         this.loadTotalCount();
      }
   }

   setTypeFilter(type: 'all' | 'loss' | 'found') {
      this.updateFilter('type', type);
   }

   clearFilters() {
      this.filters.set({
         searchTerm: '',
         type: 'all',
         category: '',
         condition: '',
         dateFrom: null,
         dateTo: null,
         location: '',
         sortBy: 'date',
         sortOrder: 'desc'
      });
      this.loadInitialData();
      this.loadTotalCount();
   }

   removeFilter(filterName: keyof AdvancedSearchFilters) {
      switch (filterName) {
         case 'type':
            this.updateFilter('type', 'all');
            break;
         case 'category':
            this.updateFilter('category', '');
            break;
         case 'condition':
            this.updateFilter('condition', '');
            break;
         case 'dateFrom':
            this.updateFilter('dateFrom', null);
            break;
         case 'dateTo':
            this.updateFilter('dateTo', null);
            break;
         case 'location':
            this.updateFilter('location', '');
            break;
      }
   }

   openDeclarationModal(declaration: DeclarationData) {
      this.dialog.open(DeclarationDetailsModalComponent, {
         data: declaration,
         width: '90vw',
         maxWidth: '800px',
         height: '90vh',
         maxHeight: '800px',
         panelClass: 'declaration-details-modal'
      });
   }
}
