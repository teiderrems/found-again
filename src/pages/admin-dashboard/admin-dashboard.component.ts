import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService, AdminStats } from '@/services/admin.service';
import { VerificationService } from '@/services/verification.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { AuthService } from '@/services/auth.service';
import { UserProfile } from '@/types/user';
import { DeclarationWithUser } from '@/services/admin.service';
import { VerificationData } from '@/types/verification';
import { FirebaseDatePipe } from '@/pipes/firebase-date.pipe';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, FirebaseDatePipe],
})
export class AdminDashboardComponent implements OnInit {
  private adminService = inject(AdminService);
  private verificationService = inject(VerificationService);
  private authService = inject(AuthService);
  private router = inject(Router);

  stats = signal<AdminStats>({
    totalUsers: 0,
    totalDeclarations: 0,
    foundDeclarations: 0,
    lostDeclarations: 0,
    pendingVerifications: 0,
    recentDeclarations: [],
    recentUsers: [],
  });

  pendingVerifications = signal<(DeclarationWithUser & { verificationId?: string })[]>([]);
  activeTab = signal<'recent-declarations' | 'pending-verifications' | 'recent-users'>('recent-declarations');
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
}
