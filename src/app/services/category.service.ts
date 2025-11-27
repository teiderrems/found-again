// services/category.service.ts (version mise à jour)
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { DEFAULT_CATEGORIES, DefaultCategory } from '../../constants/categories.constants';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/categories`;
  private categoriesCache?: DefaultCategory[];

  // Récupérer toutes les catégories
  getCategories(): Observable<DefaultCategory[]> {
    // Si déjà en cache, retourner le cache
    if (this.categoriesCache) {
      return of(this.categoriesCache);
    }

    // Sinon, essayer de récupérer depuis l'API, sinon utiliser les catégories par défaut
    return this.http.get<DefaultCategory[]>(this.apiUrl).pipe(
      tap(categories => {
        this.categoriesCache = categories;
      }),
      catchError(() => {
        // En cas d'erreur, utiliser les catégories par défaut
        this.categoriesCache = DEFAULT_CATEGORIES;
        return of(DEFAULT_CATEGORIES);
      })
    );
  }

  // Récupérer une catégorie par ID
  getCategoryById(id: string): Observable<DefaultCategory | undefined> {
    return this.getCategories().pipe(
      map(categories => categories.find(cat => cat.id === id))
    );
  }

  // Rechercher des catégories par terme
  searchCategories(term: string): Observable<DefaultCategory[]> {
    if (!term.trim()) {
      return this.getCategories();
    }

    return this.getCategories().pipe(
      map(categories => 
        categories.filter(cat =>
          cat.name.toLowerCase().includes(term.toLowerCase()) ||
          cat.description.toLowerCase().includes(term.toLowerCase()) ||
          cat.tags.some(tag => tag.toLowerCase().includes(term.toLowerCase()))
        )
      )
    );
  }

  // Obtenir les catégories les plus utilisées
  getPopularCategories(limit: number = 8): Observable<DefaultCategory[]> {
    return this.getCategories().pipe(
      map(categories => 
        categories
          .sort((a, b) => a.priority - b.priority)
          .slice(0, limit)
      )
    );
  }

  // Mettre à jour le cache local (pour les mises à jour dynamiques)
  updateCategoryCache(categories: DefaultCategory[]): void {
    this.categoriesCache = categories;
  }

  // Vider le cache (pour forcer un rechargement)
  clearCache(): void {
    this.categoriesCache = undefined;
  }
}