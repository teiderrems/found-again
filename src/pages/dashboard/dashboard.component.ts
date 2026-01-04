import { Component, OnInit, inject, signal, computed, ViewChild, ElementRef, AfterViewInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { DeclarationService } from '@/services/declaration.service';
import { AuthService } from '@/services/auth.service';
import { DeclarationData, DeclarationType } from '@/types/declaration';
import { ConfirmationDialogComponent } from '@/components/confirmation-dialog.component';
import ApexCharts from 'apexcharts';
import { SettingsService } from '@/services/settings.service';
import { AdBannerComponent } from '@/components/ad-banner/ad-banner.component';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, MatButtonModule, MatDialogModule, MatPaginatorModule, AdBannerComponent]
})
export class DashboardComponent implements OnInit, AfterViewInit {
  private declarationService = inject(DeclarationService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private settingsService = inject(SettingsService);
  private userId = this.authService.getCurrentUserId();

  @ViewChild('typeChart') typeChart!: ElementRef;
  @ViewChild('timelineChart') timelineChart!: ElementRef;

  userDeclarations = signal<DeclarationData[]>([]);
  isLoading = signal(false);
  stats = signal({
    total: 0,
    found: 0,
    lost: 0,
    pending: 0
  });

  // Pagination
  pageSize = signal(5);
  pageIndex = signal(0);

  constructor() {
    effect(() => {
      this.pageSize.set(this.settingsService.itemsPerPage());
    });
  }

  // Sorting
  sortColumn = signal<string>('');
  sortDirection = signal<'asc' | 'desc'>('asc');

  sortedDeclarations = computed(() => {
    const declarations = this.userDeclarations();
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
    const declarations = this.sortedDeclarations();
    const startIndex = this.pageIndex() * this.pageSize();
    return declarations.slice(startIndex, startIndex + this.pageSize());
  });

  chartsReady = signal(false);
  DeclarationType = DeclarationType;

  ngOnInit() {
    if (this.userId) {
      this.loadUserDeclarations(this.userId);
    }
  }

  ngAfterViewInit() {
    if (this.userDeclarations().length > 0) {
      this.initializeCharts();
    }
  }

  handlePageEvent(event: PageEvent) {
    this.pageSize.set(event.pageSize);
    this.pageIndex.set(event.pageIndex);
  }

  sortData(column: string) {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
  }

  private loadUserDeclarations(userId?: string) {
    const uid = userId || this.userId;
    if (!uid) return;

    this.isLoading.set(true);
    this.declarationService.getDeclarationsByUserId(uid).subscribe({
      next: (declarations) => {
        this.userDeclarations.set(declarations);
        this.calculateStats(declarations);
        this.isLoading.set(false);
        setTimeout(() => this.initializeCharts(), 500);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des déclarations:', error);
        this.isLoading.set(false);
      }
    });
  }

  private calculateStats(declarations: DeclarationData[]) {
    const stats = {
      total: declarations.length,
      found: declarations.filter(d => d.type === DeclarationType.FOUND).length,
      lost: declarations.filter(d => d.type === DeclarationType.LOSS).length,
      pending: 0
    };
    this.stats.set(stats);
  }

  private initializeCharts() {
    if (!this.userDeclarations().length) return;

    // Chart de distribution par type
    this.initializeTypeChart();
    
    // Chart timeline par mois
    this.initializeTimelineChart();
    
    this.chartsReady.set(true);
  }

  private initializeTypeChart() {
    const declarations = this.userDeclarations();
    const foundCount = declarations.filter(d => d.type === DeclarationType.FOUND).length;
    const lostCount = declarations.filter(d => d.type === DeclarationType.LOSS).length;

    const options: ApexCharts.ApexOptions = {
      chart: {
        type: 'pie',
        height: 300,
        fontFamily: 'inherit',
        toolbar: {
          show: false
        }
      },
      colors: ['#3b82f6', '#ea580c'],
      labels: [`Trouvés (${foundCount})`, `Perdus (${lostCount})`],
      plotOptions: {
        pie: {
          dataLabels: {
            formatter: (val: string) => val + '%'
          }
        }
      } as any,
      legend: {
        position: 'bottom' as any,
        fontSize: '12px'
      },
      responsive: [{
        breakpoint: 480,
        options: {
          chart: {
            height: 250
          }
        }
      }]
    };

    const series = [foundCount, lostCount];
    
    if (this.typeChart?.nativeElement) {
      const chart = new ApexCharts(this.typeChart.nativeElement, { ...options, series } as any);
      chart.render();
    }
  }

  private initializeTimelineChart() {
    const declarations = this.userDeclarations();
    
    // Grouper par mois
    const monthData: { [key: string]: number } = {};
    const now = new Date();
    
    // Initialiser les 6 derniers mois
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleString('fr-FR', { month: 'short', year: '2-digit' });
      monthData[key] = 0;
    }

    // Remplir avec les déclarations
    declarations.forEach(decl => {
      const declDate = new Date(decl.createdAt);
      const key = declDate.toLocaleString('fr-FR', { month: 'short', year: '2-digit' });
      if (monthData.hasOwnProperty(key)) {
        monthData[key]++;
      }
    });

    const options: ApexCharts.ApexOptions = {
      chart: {
        type: 'area',
        height: 300,
        fontFamily: 'inherit',
        toolbar: {
          show: false
        },
        sparkline: {
          enabled: false
        }
      },
      colors: ['#0ea5e9'],
      stroke: {
        curve: 'smooth' as any,
        width: 2
      },
      fill: {
        type: 'gradient',
        gradient: {
          opacityFrom: 0.6,
          opacityTo: 0.1
        }
      } as any,
      dataLabels: {
        enabled: false
      },
      xaxis: {
        categories: Object.keys(monthData),
        type: 'category' as any,
        labels: {
          style: {
            fontSize: '12px'
          }
        }
      },
      yaxis: {
        labels: {
          formatter: (val: number) => Math.round(val).toString()
        }
      },
      tooltip: {
        enabled: true,
        theme: 'light',
        x: {
          show: true
        },
        y: {
          formatter: (val: number) => Math.round(val) + ' déclaration(s)'
        }
      } as any,
      responsive: [{
        breakpoint: 480,
        options: {
          chart: {
            height: 250
          }
        }
      }]
    };

    const series = [{
      name: 'Déclarations',
      data: Object.values(monthData)
    }];

    if (this.timelineChart?.nativeElement) {
      const chart = new ApexCharts(this.timelineChart.nativeElement, { ...options, series } as any);
      chart.render();
    }
  }

  getTypeLabel(type: DeclarationType): string {
    return type === DeclarationType.FOUND ? 'Trouvé' : 'Perdu';
  }

  getTypeColor(type: DeclarationType): string {
    return type === DeclarationType.FOUND ? 'text-blue-600' : 'text-orange-600';
  }

  getTypeBackground(type: DeclarationType): string {
    return type === DeclarationType.FOUND ? 'bg-blue-50' : 'bg-orange-50';
  }

  deleteDeclaration(id: string, type: DeclarationType, images: any[]) {
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
        this.declarationService.deleteDeclaration(id, type, images).subscribe({
          next: () => {
            this.snackBar.open('Déclaration supprimée avec succès', 'Fermer', {
              duration: 3000
            });
            this.loadUserDeclarations();
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

  /**
   * Toggle declaration active/inactive status
   */
  toggleDeclarationActive(id: string, currentActive: boolean) {
    const newStatus = !currentActive;
    const action = newStatus ? 'activer' : 'désactiver';
    
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      disableClose: false,
      data: {
        title: `${newStatus ? 'Activer' : 'Désactiver'} la déclaration`,
        message: `Êtes-vous sûr de vouloir ${action} cette déclaration ?`,
        confirmText: action.charAt(0).toUpperCase() + action.slice(1),
        cancelText: 'Annuler',
        type: 'warning'
      }
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.declarationService.toggleDeclarationActive(id, newStatus).subscribe({
          next: () => {
            this.snackBar.open(`Déclaration ${action}e avec succès`, 'Fermer', {
              duration: 3000
            });
            this.loadUserDeclarations();
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

  /**
   * Mark loss declaration as resolved
   */
  markLossAsResolved(id: string) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      disableClose: false,
      data: {
        title: 'Objet retrouvé',
        message: 'Vous avez retrouvé votre objet perdu ? Cette déclaration sera désactivée.',
        confirmText: 'Confirmer',
        cancelText: 'Annuler',
        type: 'info'
      }
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.declarationService.deactivateLossDeclaration(id).subscribe({
          next: () => {
            this.snackBar.open('Déclaration marquée comme résolue', 'Fermer', {
              duration: 3000
            });
            this.loadUserDeclarations();
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
