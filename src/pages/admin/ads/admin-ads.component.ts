import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AdService } from '@/services/ad.service';
import { Ad, CreateAdData } from '@/types/ad';
import { ConfirmationService } from '@/services/confirmation.service';
import { AdFormDialogComponent, AdFormDialogData, AdFormDialogResult } from '@/components/ad-form-dialog/ad-form-dialog.component';
import { SettingsService } from '@/services/settings.service';

@Component({
  selector: 'app-admin-ads',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatPaginatorModule,
    MatTooltipModule,
  ],
  templateUrl: './admin-ads.component.html',
  styleUrl: './admin-ads.component.css',
})
export class AdminAdsComponent implements OnInit {
  private adService = inject(AdService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private settingsService = inject(SettingsService);
  private confirmationService = inject(ConfirmationService);

  ads = signal<Ad[]>([]);
  filteredAds = signal<Ad[]>([]);
  pageSize = signal(10);
  pageIndex = signal(0);
  isLoading = signal(false);

  constructor() {
    effect(() => {
      this.pageSize.set(this.settingsService.itemsPerPage());
    });
  }

  // Sorting
  sortColumn = signal<string>('');
  sortDirection = signal<'asc' | 'desc'>('asc');

  sortedAds = computed(() => {
    const ads = this.filteredAds();
    const column = this.sortColumn();
    const direction = this.sortDirection();

    if (!column) return ads;

    return [...ads].sort((a, b) => {
      const valueA = (a as any)[column];
      const valueB = (b as any)[column];

      if (valueA == null && valueB == null) return 0;
      if (valueA == null) return 1;
      if (valueB == null) return -1;

      const comparison = valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
      return direction === 'asc' ? comparison : -comparison;
    });
  });

  pagedAds = computed(() => {
    const startIndex = this.pageIndex() * this.pageSize();
    return this.sortedAds().slice(startIndex, startIndex + this.pageSize());
  });

  // Stats computed
  activeAdsCount = computed(() => this.ads().filter(a => a.isActive).length);
  totalImpressions = computed(() => this.ads().reduce((sum, a) => sum + a.impressions, 0));
  totalClicks = computed(() => this.ads().reduce((sum, a) => sum + a.clicks, 0));

  ngOnInit(): void {
    this.loadAds();
  }

  loadAds() {
    this.adService.getAllAds().subscribe({
      next: (ads) => {
        this.ads.set(ads);
        this.filteredAds.set(ads);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des publicités:', error);
        this.snackBar.open('Erreur lors du chargement des publicités', 'Fermer', { duration: 3000 });
      }
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredAds.set(
      this.ads().filter(ad =>
        ad.title.toLowerCase().includes(filterValue) ||
        ad.description.toLowerCase().includes(filterValue)
      )
    );
    this.pageIndex.set(0);
  }

  onSort(column: string) {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
  }

  onPageChange(event: PageEvent) {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  openAddForm() {
    const dialogRef = this.dialog.open(AdFormDialogComponent, {
      width: '900px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'ad-form-dialog-container',
      data: { mode: 'create' } as AdFormDialogData
    });

    dialogRef.afterClosed().subscribe((result: AdFormDialogResult) => {
      if (result?.success && result.data) {
        this.createAd(result.data);
      }
    });
  }

  openEditForm(ad: Ad) {
    const dialogRef = this.dialog.open(AdFormDialogComponent, {
      width: '900px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'ad-form-dialog-container',
      data: { mode: 'edit', ad } as AdFormDialogData
    });

    dialogRef.afterClosed().subscribe((result: AdFormDialogResult) => {
      if (result?.success && result.data && ad.id) {
        this.updateAd(ad.id, result.data);
      }
    });
  }

  private createAd(adData: CreateAdData) {
    this.isLoading.set(true);
    this.adService.createAd(adData).subscribe({
      next: () => {
        this.snackBar.open('Publicité créée avec succès', 'Fermer', { duration: 3000 });
        this.loadAds();
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Erreur lors de la création:', error);
        this.snackBar.open('Erreur lors de la création', 'Fermer', { duration: 3000 });
        this.isLoading.set(false);
      }
    });
  }

  private updateAd(id: string, adData: CreateAdData) {
    this.isLoading.set(true);
    this.adService.updateAd(id, adData).subscribe({
      next: () => {
        this.snackBar.open('Publicité mise à jour avec succès', 'Fermer', { duration: 3000 });
        this.loadAds();
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Erreur lors de la mise à jour:', error);
        this.snackBar.open('Erreur lors de la mise à jour', 'Fermer', { duration: 3000 });
        this.isLoading.set(false);
      }
    });
  }

  toggleAdStatus(ad: Ad) {
    if (!ad.id) return;

    this.adService.updateAd(ad.id, { isActive: !ad.isActive }).subscribe({
      next: () => {
        this.snackBar.open(
          ad.isActive ? 'Publicité désactivée' : 'Publicité activée',
          'Fermer',
          { duration: 3000 }
        );
        this.loadAds();
      },
      error: (error) => {
        console.error('Erreur lors du changement de statut:', error);
        this.snackBar.open('Erreur lors du changement de statut', 'Fermer', { duration: 3000 });
      }
    });
  }

  confirmDelete(ad: Ad) {
    this.confirmationService.confirmDelete({
      title: 'Confirmer la suppression',
      message: `Êtes-vous sûr de vouloir supprimer la publicité "${ad.title}" ?`
    }).subscribe(result => {
      if (result && ad.id) {
        this.deleteAd(ad.id);
      }
    });
  }

  deleteAd(id: string) {
    this.adService.deleteAd(id).subscribe({
      next: () => {
        this.snackBar.open('Publicité supprimée avec succès', 'Fermer', { duration: 3000 });
        this.loadAds();
      },
      error: (error) => {
        console.error('Erreur lors de la suppression:', error);
        this.snackBar.open('Erreur lors de la suppression', 'Fermer', { duration: 3000 });
      }
    });
  }

  private toDate(value: any): Date {
    if (value?.toDate) {
      return value.toDate();
    }
    return new Date(value);
  }
}
