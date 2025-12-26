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

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatDialogModule, FirebaseDatePipe],
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
    totalDeclarations: 0,
    foundDeclarations: 0,
    lostDeclarations: 0,
    activeDeclarations: 0,
    inactiveDeclarations: 0,
    pendingVerifications: 0,
    recentDeclarations: [],
    recentUsers: [],
    recentVerifications: [],
  });

  pendingVerifications = signal<(DeclarationWithUser & { verificationId?: string })[]>([]);
  activeTab = signal<'recent-declarations' | 'pending-verifications' | 'recent-users' | 'recent-verifications'>('recent-declarations');
  isLoading = signal(false);
  selectedUserForRoleChange = signal<UserProfile | null>(null);
  showRoleModal = signal(false);

  ngOnInit() {
    this.checkAdminAccess();
    this.loadStats();
    this.loadPendingVerifications();
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
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des statistiques:', error);
        this.isLoading.set(false);
      },
    });
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
        this.loadPendingVerifications();
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
        this.loadPendingVerifications();
      },
      error: (error) => {
        console.error('Erreur lors du rejet:', error);
        this.isLoading.set(false);
      },
    });
  }

  openRoleModal(user: UserProfile) {
    this.selectedUserForRoleChange.set(user);
    this.showRoleModal.set(true);
  }

  closeRoleModal() {
    this.showRoleModal.set(false);
    this.selectedUserForRoleChange.set(null);
  }

  updateUserRole(newRole: 'standard' | 'admin') {
    const user = this.selectedUserForRoleChange();
    if (!user) return;

    this.isLoading.set(true);
    this.adminService.updateUserRole(user.uid, newRole).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.closeRoleModal();
        this.loadStats(); // Rafraîchir les données
      },
      error: (error) => {
        console.error('Erreur lors de la mise à jour du rôle:', error);
        this.isLoading.set(false);
      },
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
          this.loadStats();
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
          this.loadStats();
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
          this.loadStats();
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
}
