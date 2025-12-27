import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { DeclarationService } from '@/services/declaration.service';
import { DeclarationData } from '@/types/declaration';
import { ConfirmationDialogComponent } from '@/components/confirmation-dialog.component';
import { FirebaseDatePipe } from '@/pipes/firebase-date.pipe';
import { SettingsService } from '@/services/settings.service';

@Component({
  selector: 'app-admin-declarations',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatDialogModule,
    MatPaginatorModule,
    FirebaseDatePipe
  ],
  templateUrl: './admin-declarations.component.html',
  styleUrl: './admin-declarations.component.css',
})
export class AdminDeclarationsComponent implements OnInit {
  private declarationService = inject(DeclarationService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private settingsService = inject(SettingsService);

  declarations = signal<DeclarationData[]>([]);
  filteredDeclarations = signal<DeclarationData[]>([]);
  pageSize = signal(10);
  pageIndex = signal(0);
  
  constructor() {
    effect(() => {
      this.pageSize.set(this.settingsService.itemsPerPage());
    }, { allowSignalWrites: true });
  }
  
  // Sorting
  sortColumn = signal<string>('');
  sortDirection = signal<'asc' | 'desc'>('asc');

  sortedDeclarations = computed(() => {
    const declarations = this.filteredDeclarations();
    const column = this.sortColumn();
    const direction = this.sortDirection();

    if (!column) return declarations;

    return [...declarations].sort((a, b) => {
      const valueA = (a as any)[column];
      const valueB = (b as any)[column];
      
      if (valueA == null && valueB == null) return 0;
      if (valueA == null) return 1;
      if (valueB == null) return -1;

      const comparison = valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
      return direction === 'asc' ? comparison : -comparison;
    });
  });

  pagedDeclarations = computed(() => {
    const startIndex = this.pageIndex() * this.pageSize();
    return this.sortedDeclarations().slice(startIndex, startIndex + this.pageSize());
  });

  ngOnInit(): void {
    this.loadDeclarations();
  }

  loadDeclarations() {
    this.declarationService.getDeclarations().subscribe({
      next: (declarations) => {
        this.declarations.set(declarations);
        this.filteredDeclarations.set(declarations);
      },
      error: (error) => console.error('Error loading declarations:', error)
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredDeclarations.set(
      this.declarations().filter(decl => 
        decl.title.toLowerCase().includes(filterValue) || 
        decl.category.toLowerCase().includes(filterValue) ||
        (decl.location && decl.location.toLowerCase().includes(filterValue))
      )
    );
    this.pageIndex.set(0);
  }

  sortData(column: string) {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
  }

  handlePageEvent(e: PageEvent) {
    this.pageSize.set(e.pageSize);
    this.pageIndex.set(e.pageIndex);
  }

  viewDeclaration(id: string): void {
    this.router.navigate(['/verifier-identite', id]);
  }

  deleteDeclaration(id: string): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      disableClose: false,
      data: {
        title: 'Supprimer la déclaration',
        message: 'Êtes-vous sûr de vouloir supprimer cette déclaration ? Cette action est irréversible.',
        confirmText: 'Supprimer',
        cancelText: 'Annuler',
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.declarationService.deleteDeclarationAsAdmin(id).subscribe({
          next: () => {
            this.snackBar.open('Déclaration supprimée avec succès', 'Fermer', {
              duration: 3000
            });
          },
          error: (error) => {
            console.error('Erreur lors de la suppression:', error);
            this.snackBar.open('Erreur lors de la suppression', 'Fermer', {
              duration: 3000
            });
          }
        });
      }
    });
  }

  toggleDeclarationActive(declaration: DeclarationData) {
    const newStatus = !(declaration.active ?? true);
    const action = newStatus ? 'activer' : 'désactiver';
    
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      disableClose: false,
      data: {
        title: `${newStatus ? 'Activer' : 'Désactiver'} la déclaration`,
        message: `Êtes-vous sûr de vouloir ${action} la déclaration "${declaration.title}" ?`,
        confirmText: action.charAt(0).toUpperCase() + action.slice(1),
        cancelText: 'Annuler',
        type: 'warning'
      }
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.declarationService.toggleDeclarationActive(declaration.id, newStatus).subscribe({
          next: () => {
            this.snackBar.open(`Déclaration ${action}e avec succès`, 'Fermer', {
              duration: 3000
            });
          },
          error: (error) => {
            console.error('Erreur lors de la modification:', error);
            this.snackBar.open('Erreur lors de la modification', 'Fermer', {
              duration: 3000
            });
          }
        });
      }
    });
  }
}
