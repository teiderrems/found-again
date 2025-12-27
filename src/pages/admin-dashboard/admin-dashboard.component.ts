import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService, AdminStats } from '@/services/admin.service';
import { VerificationService } from '@/services/verification.service';
import { DeclarationService } from '@/services/declaration.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { AuthService } from '@/services/auth.service';
import { UserProfile } from '@/types/user';
import { DeclarationWithUser } from '@/services/admin.service';
import { FirebaseDatePipe } from '@/pipes/firebase-date.pipe';
import { ConfirmationDialogComponent } from '@/components/confirmation-dialog.component';
import { VerificationDetailsDialogComponent } from '@/components/verification-details-dialog/verification-details-dialog.component';
import { VerificationData } from '@/types/verification';
import { RoleChangeDialogComponent } from '@/components/role-change-dialog/role-change-dialog.component';
import { NgApexchartsModule } from 'ng-apexcharts';
import {
  ApexNonAxisChartSeries,
  ApexResponsive,
  ApexChart,
  ApexTheme,
  ApexTitleSubtitle,
  ApexFill,
  ApexStroke,
  ApexYAxis,
  ApexLegend,
  ApexPlotOptions
} from "ng-apexcharts";

export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  responsive: ApexResponsive[];
  labels: any;
  theme: ApexTheme;
  title: ApexTitleSubtitle;
  fill: ApexFill,
  yaxis: ApexYAxis,
  stroke: ApexStroke,
  legend: ApexLegend,
  plotOptions: ApexPlotOptions
};

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatDialogModule, FirebaseDatePipe, NgApexchartsModule],
})
export class AdminDashboardComponent implements OnInit {
  private adminService = inject(AdminService);
  private verificationService = inject(VerificationService);
  private declarationService = inject(DeclarationService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  stats = signal<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    totalDeclarations: 0,
    foundDeclarations: 0,
    lostDeclarations: 0,
    activeDeclarations: 0,
    inactiveDeclarations: 0,
    pendingVerifications: 0,
    recentDeclarations: [],
    recentUsers: [],
    recentVerifications: [],
    allDeclarations: [],
    allUsers: []
  });

  pendingVerifications = signal<(DeclarationWithUser & { verificationId?: string })[]>([]);
  activeTab = signal<'recent-declarations' | 'pending-verifications' | 'recent-users' | 'recent-verifications'>('recent-declarations');
  isLoading = signal(false);

  public userChartOptions: Partial<ChartOptions> | any;
  public declarationChartOptions: Partial<ChartOptions> | any;
  public progressionChartOptions: Partial<ChartOptions> | any;
  public timeFilter = signal<'week' | 'month' | 'year'>('month');

  ngOnInit() {
    this.checkAdminAccess();
    this.loadStats();
    this.loadPendingVerifications();
    this.initCharts();
  }

  private initCharts() {
    this.userChartOptions = {
      series: [0, 0],
      chart: {
        width: 380,
        type: "pie"
      },
      labels: ["Actifs", "Inactifs"],
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: {
              width: 200
            },
            legend: {
              position: "bottom"
            }
          }
        }
      ],
      colors: ['#06b6d4', '#ec4899'] // Cyan for Active, Pink for Inactive
    };

    this.declarationChartOptions = {
      series: [0, 0],
      chart: {
        width: 380,
        type: "donut"
      },
      labels: ["Trouvés", "Perdus"],
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: {
              width: 200
            },
            legend: {
              position: "bottom"
            }
          }
        }
      ],
      colors: ['#f97316', '#ef4444'] // Orange for Found, Red for Lost
    };

    this.progressionChartOptions = {
      series: [],
      chart: {
        height: 350,
        type: "area",
        fontFamily: 'inherit',
        toolbar: {
          show: false
        }
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: "smooth",
        width: 2
      },
      fill: {
        type: 'gradient',
        gradient: {
          opacityFrom: 0.6,
          opacityTo: 0.1
        }
      },
      xaxis: {
        type: "datetime",
        categories: []
      },
      tooltip: {
        x: {
          format: "dd/MM/yy HH:mm"
        },
      },
      yaxis: {
        title: {
          text: 'Nombre'
        },
        labels: {
          formatter: (value: number) => {
            return Math.floor(value).toString();
          }
        }
      },
      colors: ['#3b82f6', '#10b981'] // Blue for Declarations, Green for Users
    };
  }

  private checkAdminAccess() {
    this.authService.getCurrentUserProfile().subscribe({
      next: (user) => {
        if (user?.role !== 'admin') {
          this.router.navigateByUrl('/');
        }
      },
      error: () => {
        this.router.navigateByUrl('/connexion');
      },
    });
  }

  private loadStats() {
    this.isLoading.set(true);
    this.adminService.getAdminStats().subscribe({
      next: (stats) => {
        this.stats.set(stats);
        
        // Update charts
        this.userChartOptions.series = [stats.activeUsers, stats.inactiveUsers];
        this.declarationChartOptions.series = [stats.foundDeclarations, stats.lostDeclarations];
        
        this.updateProgressionChart();

        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des statistiques:', error);
        this.isLoading.set(false);
      },
    });
  }

  setFilter(filter: 'week' | 'month' | 'year') {
    this.timeFilter.set(filter);
    this.updateProgressionChart();
  }

  private updateProgressionChart() {
    const stats = this.stats();
    if (!stats.allDeclarations || !stats.allUsers) return;

    const filter = this.timeFilter();
    const now = new Date();
    let startDate: Date;
    let dateFormat: string;

    switch (filter) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFormat = 'dd MMM';
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        dateFormat = 'dd MMM';
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
        dateFormat = 'MMM yyyy';
        break;
    }

    // Helper to group data
    const getCumulativeData = (items: any[], dateField: string) => {
      const dataPoints: number[] = [];
      const categories: string[] = [];
      
      const getDate = (item: any): Date => {
        const val = item[dateField];
        if (!val) return new Date(); // Fallback
        if (val instanceof Date) return val;
        if (typeof val.toDate === 'function') return val.toDate();
        return new Date(val);
      };

      // 1. Calculate initial count (before start date)
      let runningTotal = items.filter(item => {
        const date = getDate(item);
        return date < startDate;
      }).length;

      // 2. Iterate through periods
      if (filter === 'year') {
        for (let i = 0; i < 12; i++) {
          const d = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
          const nextMonth = new Date(startDate.getFullYear(), startDate.getMonth() + i + 1, 1);
          
          const countInMonth = items.filter(item => {
            const date = getDate(item);
            return date >= d && date < nextMonth;
          }).length;
          
          runningTotal += countInMonth;
          dataPoints.push(runningTotal);
          categories.push(d.toISOString().slice(0, 7));
        }
      } else {
        const days = filter === 'week' ? 7 : 30;
        for (let i = 0; i <= days; i++) {
          const d = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
          const nextDay = new Date(startDate.getTime() + (i + 1) * 24 * 60 * 60 * 1000);
          
          const countInDay = items.filter(item => {
            const date = getDate(item);
            return date >= d && date < nextDay;
          }).length;

          runningTotal += countInDay;
          dataPoints.push(runningTotal);
          categories.push(d.toISOString().slice(0, 10));
        }
      }
      
      return { data: dataPoints, categories };
    };

    const declarationsData = getCumulativeData(stats.allDeclarations, 'createdAt');
    const usersData = getCumulativeData(stats.allUsers, 'createdAt');

    this.progressionChartOptions.series = [
      {
        name: "Total Déclarations",
        data: declarationsData.data
      },
      {
        name: "Total Utilisateurs",
        data: usersData.data
      }
    ];

    this.progressionChartOptions.xaxis = {
      type: 'datetime',
      categories: declarationsData.categories
    };
    
    // Force chart update if needed (sometimes required with ng-apexcharts)
    this.progressionChartOptions = { ...this.progressionChartOptions };
  }

  private loadPendingVerifications() {
    this.verificationService.getPendingVerifications().subscribe({
      next: (verifications) => {
        // Mapper les vérifications avec les déclarations
        const mappedVerifications = verifications.map(v => ({
          id: v.declarationId,
          title: `Vérification pour déclaration ${v.declarationId.substring(0, 8)}...`,
          verificationId: v.id,
          userDetails: {
            uid: v.userId,
            email: '',
            firstname: '',
            lastname: '',
            createdAt: new Date(),
            role: 'standard' as const,
            preferences: { theme: 'light' as const, notifications: true }
          }
        } as DeclarationWithUser & { verificationId?: string }));
        
        this.pendingVerifications.set(mappedVerifications);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des vérifications en attente:', error);
      },
    });
  }

  approveVerification(verificationId: string) {
    const verification = this.pendingVerifications().find(v => v.verificationId === verificationId);
    if (!verification) return;

    this.isLoading.set(true);
    this.verificationService.approveVerification(
      verification.id,
      verificationId,
      'Approuvé par l\'administrateur'
    ).subscribe({
      next: () => {
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Erreur lors de l\'approbation:', error);
        this.isLoading.set(false);
      },
    });
  }

  rejectVerification(verificationId: string) {
    const verification = this.pendingVerifications().find(v => v.verificationId === verificationId);
    if (!verification) return;

    const rejectionReason = prompt('Raison du rejet:');
    if (!rejectionReason) return;

    this.isLoading.set(true);
    this.verificationService.rejectVerification(
      verification.id,
      verificationId,
      rejectionReason,
      'Rejeté par l\'administrateur'
    ).subscribe({
      next: () => {
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Erreur lors du rejet:', error);
        this.isLoading.set(false);
      },
    });
  }

  openRoleModal(user: UserProfile) {
    const dialogRef = this.dialog.open(RoleChangeDialogComponent, {
      width: '400px',
      data: { user }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadStats();
      }
    });
  }

  toggleUserStatus(user: UserProfile) {
    const newStatus = !(user.isActive ?? true); // Default to true if undefined
    const action = newStatus ? 'activer' : 'désactiver';

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: `${newStatus ? 'Activer' : 'Désactiver'} l'utilisateur`,
        message: `Êtes-vous sûr de vouloir ${action} l'utilisateur "${user.firstname} ${user.lastname}" ? ${!newStatus ? 'Il ne pourra plus se connecter.' : ''}`,
        confirmText: action.charAt(0).toUpperCase() + action.slice(1),
        cancelText: 'Annuler',
        type: newStatus ? 'info' : 'warning'
      }
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;

      this.isLoading.set(true);
      this.adminService.toggleUserStatus(user.uid, newStatus).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.snackBar.open(`Utilisateur ${newStatus ? 'activé' : 'désactivé'} avec succès`, 'Fermer', {
            duration: 3000
          });
          // Refresh stats/list is handled by real-time subscription in loadStats usually, 
          // but here loadStats() is a single fetch. So we reload.
          this.loadStats(); 
        },
        error: (error) => {
          console.error('Erreur lors du changement de statut:', error);
          this.isLoading.set(false);
          this.snackBar.open('Erreur lors du changement de statut', 'Fermer', {
            duration: 3000
          });
        }
      });
    });
  }

  /**
   * Supprime une déclaration après confirmation
   */
  deleteDeclaration(declarationId: string, declarationTitle: string) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      disableClose: false,
      data: {
        title: 'Supprimer la déclaration',
        message: `Êtes-vous sûr de vouloir supprimer la déclaration "${declarationTitle}" ? Cette action est irréversible.`,
        confirmText: 'Supprimer',
        cancelText: 'Annuler',
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.isLoading.set(true);
      this.declarationService.deleteDeclarationAsAdmin(declarationId).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.snackBar.open('Déclaration supprimée avec succès', 'Fermer', {
            duration: 3000
          });
        },
        error: (error) => {
          console.error('Erreur lors de la suppression:', error);
          this.isLoading.set(false);
          this.snackBar.open('Erreur lors de la suppression de la déclaration', 'Fermer', {
            duration: 3000
          });
        },
      });
    });
  }

  /**
   * Toggle declaration active status
   */
  toggleDeclarationActive(declarationId: string, currentActive: boolean, declarationTitle: string) {
    const newStatus = !currentActive;
    const action = newStatus ? 'activer' : 'désactiver';
    
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      disableClose: false,
      data: {
        title: `${newStatus ? 'Activer' : 'Désactiver'} la déclaration`,
        message: `Êtes-vous sûr de vouloir ${action} la déclaration "${declarationTitle}" ?`,
        confirmText: action.charAt(0).toUpperCase() + action.slice(1),
        cancelText: 'Annuler',
        type: 'warning'
      }
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.isLoading.set(true);
      this.declarationService.toggleDeclarationActive(declarationId, newStatus).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.snackBar.open(`Déclaration ${action}e avec succès`, 'Fermer', {
            duration: 3000
          });
        },
        error: (error) => {
          console.error('Erreur lors de la modification:', error);
          this.isLoading.set(false);
          this.snackBar.open('Erreur lors de la modification de la déclaration', 'Fermer', {
            duration: 3000
          });
        },
      });
    });
  }

  /**
   * Deactivate loss declarations (when owner found their item)
   */
  markLossAsResolved(declarationId: string, declarationTitle: string) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      disableClose: false,
      data: {
        title: 'Marquer comme résolu',
        message: `La déclaration de perte "${declarationTitle}" a-t-elle retrouvé son propriétaire ? Cette déclaration sera désactivée.`,
        confirmText: 'Marquer comme résolu',
        cancelText: 'Annuler',
        type: 'info'
      }
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.isLoading.set(true);
      this.declarationService.deactivateLossDeclaration(declarationId).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.snackBar.open('Déclaration de perte marquée comme résolue', 'Fermer', {
            duration: 3000
          });
        },
        error: (error) => {
          console.error('Erreur lors de la modification:', error);
          this.isLoading.set(false);
          this.snackBar.open('Erreur lors de la modification de la déclaration', 'Fermer', {
            duration: 3000
          });
        },
      });
    });
  }

  /**
   * View declaration details
   */
  viewDeclaration(declarationId: string) {
    this.router.navigate(['/verifier-identite', declarationId]);
  }

  /**
   * View verification details
   */
  viewVerification(verification: VerificationData) {
    const dialogRef = this.dialog.open(VerificationDetailsDialogComponent, {
      width: '800px',
      maxWidth: '95vw',
      data: verification
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'approve') {
        this.approveVerification(verification.id);
      } else if (result === 'reject') {
        this.rejectVerification(verification.id);
      }
    });
  }
}
