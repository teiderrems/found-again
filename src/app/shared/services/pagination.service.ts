import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalItems: number;
}

@Injectable({
  providedIn: 'root'
})
export class PaginationService {
  private paginationStates = new Map<string, BehaviorSubject<PaginationState>>();

  constructor() {}

  /**
   * Initialise l'état de pagination pour un composant
   * @param componentId Identifiant unique du composant
   * @param totalItems Nombre total d'éléments
   * @param pageSize Nombre d'éléments par page (par défaut 10)
   */
  initPagination(
    componentId: string,
    totalItems: number,
    pageSize: number = 10
  ): Observable<PaginationState> {
    if (!this.paginationStates.has(componentId)) {
      this.paginationStates.set(
        componentId,
        new BehaviorSubject<PaginationState>({
          currentPage: 1,
          pageSize,
          totalItems,
        })
      );
    } else {
      const state = this.paginationStates.get(componentId)!.value;
      this.paginationStates.get(componentId)!.next({
        ...state,
        totalItems,
      });
    }
    return this.paginationStates.get(componentId)!.asObservable();
  }

  /**
   * Change la page actuelle
   * @param componentId Identifiant du composant
   * @param page Numéro de la page
   */
  setCurrentPage(componentId: string, page: number): void {
    const state = this.paginationStates.get(componentId);
    if (state) {
      const currentState = state.value;
      const totalPages = Math.ceil(currentState.totalItems / currentState.pageSize);
      if (page >= 1 && page <= totalPages) {
        state.next({
          ...currentState,
          currentPage: page,
        });
      }
    }
  }

  /**
   * Change le nombre d'éléments par page
   * @param componentId Identifiant du composant
   * @param pageSize Nouveau nombre d'éléments par page
   */
  setPageSize(componentId: string, pageSize: number): void {
    const state = this.paginationStates.get(componentId);
    if (state) {
      const currentState = state.value;
      state.next({
        ...currentState,
        pageSize,
        currentPage: 1, // Réinitialiser à la première page
      });
    }
  }

  /**
   * Calcule les éléments à afficher pour la page actuelle
   * @param items Tous les éléments
   * @param componentId Identifiant du composant
   */
  getPaginatedItems<T>(items: T[], componentId: string): T[] {
    const state = this.paginationStates.get(componentId)?.value;
    if (!state) return items;

    const startIndex = (state.currentPage - 1) * state.pageSize;
    const endIndex = startIndex + state.pageSize;
    return items.slice(startIndex, endIndex);
  }

  /**
   * Obtient l'état actuel de la pagination
   * @param componentId Identifiant du composant
   */
  getState(componentId: string): PaginationState | undefined {
    return this.paginationStates.get(componentId)?.value;
  }

  /**
   * Calcule le nombre total de pages
   * @param componentId Identifiant du composant
   */
  getTotalPages(componentId: string): number {
    const state = this.getState(componentId);
    if (!state) return 0;
    return Math.ceil(state.totalItems / state.pageSize);
  }

  /**
   * Nettoie l'état de pagination pour un composant
   * @param componentId Identifiant du composant
   */
  clearPagination(componentId: string): void {
    this.paginationStates.delete(componentId);
  }
}
