import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { PaginationState } from '../../services/pagination.service';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center justify-between gap-4 mt-6 px-4 py-3 border-t border-gray-200 dark:border-white/[0.05]">
      <!-- Informations sur la pagination -->
      <div class="text-sm text-gray-600 dark:text-gray-400">
        @if (paginationState) {
          <span>
            Affichage
            <strong class="text-gray-900 dark:text-white">
              {{ (paginationState.currentPage - 1) * paginationState.pageSize + 1 }}
            </strong>
            à
            <strong class="text-gray-900 dark:text-white">
              {{ Math.min(paginationState.currentPage * paginationState.pageSize, paginationState.totalItems) }}
            </strong>
            sur
            <strong class="text-gray-900 dark:text-white">{{ paginationState.totalItems }}</strong>
            résultats
          </span>
        }
      </div>

      <!-- Sélecteur de taille de page -->
      <div class="flex items-center gap-3">
        <label for="pageSize" class="text-sm text-gray-600 dark:text-gray-400">
          Éléments par page:
        </label>
        <select
          id="pageSize"
          [value]="paginationState?.pageSize"
          (change)="onPageSizeChange($event)"
          class="px-3 py-2 border border-gray-300 rounded-lg text-sm dark:border-white/[0.05] dark:bg-white/[0.05] dark:text-white"
        >
          <option value="5">5</option>
          <option value="10">10</option>
          <option value="25">25</option>
          <option value="50">50</option>
          <option value="100">100</option>
        </select>
      </div>

      <!-- Boutons de navigation -->
      <div class="flex items-center gap-2">
        <button
          [disabled]="!canGoPrevious()"
          (click)="onPreviousPage()"
          class="px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-white/[0.05] dark:text-gray-400 dark:hover:bg-white/[0.05]"
        >
          ← Précédent
        </button>

        <!-- Numéros de pages -->
        <div class="flex items-center gap-1">
          @for (page of getPageNumbers(); track page) {
            <button
              [class.bg-blue-600]="page === paginationState?.currentPage"
              [class.text-white]="page === paginationState?.currentPage"
              [class.bg-gray-100]="page !== paginationState?.currentPage"
              [class.dark:bg-white/[0.05]]="page !== paginationState?.currentPage"
              (click)="onPageClick(page)"
              class="w-10 h-10 rounded-lg border border-gray-300 text-sm font-medium dark:border-white/[0.05]"
            >
              {{ page }}
            </button>
          }
        </div>

        <button
          [disabled]="!canGoNext()"
          (click)="onNextPage()"
          class="px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-white/[0.05] dark:text-gray-400 dark:hover:bg-white/[0.05]"
        >
          Suivant →
        </button>
      </div>
    </div>
  `,
  styles: ``
})
export class PaginationComponent {
  @Input() paginationState: PaginationState | null = null;
  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  Math = Math;

  onPreviousPage(): void {
    if (this.paginationState && this.paginationState.currentPage > 1) {
      this.pageChange.emit(this.paginationState.currentPage - 1);
    }
  }

  onNextPage(): void {
    if (this.paginationState) {
      const totalPages = Math.ceil(
        this.paginationState.totalItems / this.paginationState.pageSize
      );
      if (this.paginationState.currentPage < totalPages) {
        this.pageChange.emit(this.paginationState.currentPage + 1);
      }
    }
  }

  onPageClick(page: number): void {
    this.pageChange.emit(page);
  }

  onPageSizeChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.pageSizeChange.emit(parseInt(select.value, 10));
  }

  canGoPrevious(): boolean {
    return this.paginationState ? this.paginationState.currentPage > 1 : false;
  }

  canGoNext(): boolean {
    if (!this.paginationState) return false;
    const totalPages = Math.ceil(
      this.paginationState.totalItems / this.paginationState.pageSize
    );
    return this.paginationState.currentPage < totalPages;
  }

  getPageNumbers(): number[] {
    if (!this.paginationState) return [];

    const totalPages = Math.ceil(
      this.paginationState.totalItems / this.paginationState.pageSize
    );
    const currentPage = this.paginationState.currentPage;
    const pages: number[] = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const halfPages = Math.floor(maxPagesToShow / 2);
      let start = Math.max(1, currentPage - halfPages);
      let end = Math.min(totalPages, currentPage + halfPages);

      if (start === 1) {
        end = Math.min(totalPages, maxPagesToShow);
      } else if (end === totalPages) {
        start = Math.max(1, totalPages - maxPagesToShow + 1);
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }

    return pages;
  }
}
