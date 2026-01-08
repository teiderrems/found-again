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
import { VerificationService } from '@/services/verification.service';
import { VerificationData, VerificationStatus } from '@/types/verification';
import { ConfirmationService } from '@/services/confirmation.service';
import { VerificationDetailsDialogComponent } from '@/components/verification-details-dialog/verification-details-dialog.component';
import { FirebaseDatePipe } from '@/pipes/firebase-date.pipe';
import { SettingsService } from '@/services/settings.service';
import { AdminService } from '@/services/admin.service';
import { take } from 'rxjs';

export interface VerificationWithDetails extends VerificationData {
  userName?: string;
  userEmail?: string;
  declarationTitle?: string;
}

@Component({
  selector: 'app-admin-verifications',
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
  templateUrl: './admin-verifications.component.html',
  styleUrl: './admin-verifications.component.css',
})
export class AdminVerificationsComponent implements OnInit {
  private verificationService = inject(VerificationService);
  private adminService = inject(AdminService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private settingsService = inject(SettingsService);
  private confirmationService = inject(ConfirmationService);

  verifications = signal<VerificationWithDetails[]>([]);
  filteredVerifications = signal<VerificationWithDetails[]>([]);
  pageSize = signal(10);
  pageIndex = signal(0);
  
  constructor() {
    effect(() => {
      this.pageSize.set(this.settingsService.itemsPerPage());
    });
  }
  
  // Sorting
  sortColumn = signal<string>('');
  sortDirection = signal<'asc' | 'desc'>('asc');

  sortedVerifications = computed(() => {
    const verifications = this.filteredVerifications();
    const column = this.sortColumn();
    const direction = this.sortDirection();

    if (!column) return verifications;

    return [...verifications].sort((a, b) => {
      const valueA = (a as any)[column];
      const valueB = (b as any)[column];
      
      if (valueA == null && valueB == null) return 0;
      if (valueA == null) return 1;
      if (valueB == null) return -1;

      const comparison = valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
      return direction === 'asc' ? comparison : -comparison;
    });
  });

  pagedVerifications = computed(() => {
    const startIndex = this.pageIndex() * this.pageSize();
    return this.sortedVerifications().slice(startIndex, startIndex + this.pageSize());
  });

  ngOnInit(): void {
    this.loadVerifications();
  }

  loadVerifications() {
    // Use AdminService to get users and declarations along with verifications
    this.adminService.getAdminStats().pipe(take(1)).subscribe({
      next: (stats) => {
        const users = stats.allUsers;
        const declarations = stats.allDeclarations;
        
        this.verificationService.getAllVerifications().subscribe({
          next: (verifications) => {
            const enrichedVerifications: VerificationWithDetails[] = verifications.map(v => {
              const user = users.find((u: any) => u.uid === v.userId);
              const declaration = declarations.find((d: any) => d.id === v.declarationId);
              return {
                ...v,
                userName: user ? `${user.firstname} ${user.lastname}` : 'Utilisateur inconnu',
                userEmail: user?.email || '',
                declarationTitle: declaration?.title || 'Déclaration inconnue'
              };
            });
            this.verifications.set(enrichedVerifications);
            this.filteredVerifications.set(enrichedVerifications);
          },
          error: (error) => console.error('Error loading verifications:', error)
        });
      },
      error: (error) => console.error('Error loading admin stats:', error)
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredVerifications.set(
      this.verifications().filter(v => 
        v.userId.toLowerCase().includes(filterValue) || 
        v.declarationId.toLowerCase().includes(filterValue) ||
        (v.userName?.toLowerCase().includes(filterValue) ?? false) ||
        (v.userEmail?.toLowerCase().includes(filterValue) ?? false) ||
        (v.declarationTitle?.toLowerCase().includes(filterValue) ?? false)
      )
    );
    this.pageIndex.set(0);
  }

  filterByStatus(event: Event) {
    const status = (event.target as HTMLSelectElement).value;
    if (!status) {
      this.filteredVerifications.set(this.verifications());
    } else {
      this.filteredVerifications.set(
        this.verifications().filter(v => v.status === status)
      );
    }
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

  viewVerification(verification: VerificationData): void {
    const dialogRef = this.dialog.open(VerificationDetailsDialogComponent, {
      width: '800px',
      maxWidth: '95vw',
      data: verification
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'approve') {
        this.approveVerification(verification);
      } else if (result === 'reject') {
        this.rejectVerification(verification);
      }
    });
  }

  approveVerification(verification: VerificationData): void {
    this.confirmationService.confirm({
      title: 'Approuver la vérification',
      message: 'Êtes-vous sûr de vouloir approuver cette vérification ?',
      confirmText: 'Approuver',
      cancelText: 'Annuler',
      type: 'info'
    }).subscribe(result => {
      if (result) {
        // Récupérer l'ID de la déclaration correspondante si disponible dans les données de vérification
        // Supposons que verification.matchingDeclarationId existe ou est passé dans les données
        // Si ce n'est pas le cas, il faudrait peut-être le récupérer autrement
        const matchingDeclarationId = (verification as any).matchingDeclarationId;

        this.verificationService.approveVerification(
          verification.declarationId,
          verification.id,
          'Approuvé par l\'administrateur',
          matchingDeclarationId
        ).subscribe({
          next: () => {
            this.snackBar.open('Vérification approuvée et déclarations mises à jour', 'Fermer', { duration: 3000 });
            // Plus besoin de recharger manuellement, le flux est en temps réel
          },
          error: (error) => {
            console.error('Error approving verification:', error);
            this.snackBar.open('Erreur lors de l\'approbation', 'Fermer', { duration: 3000 });
          }
        });
      }
    });
  }

  rejectVerification(verification: VerificationData): void {
    const reason = prompt('Raison du rejet :');
    if (reason === null) return; // Cancelled

    this.verificationService.rejectVerification(
      verification.declarationId,
      verification.id,
      reason || 'Aucune raison fournie',
      'Rejeté par l\'administrateur'
    ).subscribe({
      next: () => {
        this.snackBar.open('Vérification rejetée', 'Fermer', { duration: 3000 });
        // Plus besoin de recharger manuellement
      },
      error: (error) => {
        console.error('Error rejecting verification:', error);
        this.snackBar.open('Erreur lors du rejet', 'Fermer', { duration: 3000 });
      }
    });
  }

  deleteVerification(verification: VerificationData): void {
    this.confirmationService.confirmDelete({
      title: 'Supprimer la vérification',
      message: 'Êtes-vous sûr de vouloir supprimer cette vérification ?'
    }).subscribe(result => {
      if (result) {
        this.verificationService.deleteVerification(
          verification.declarationId,
          verification.id
        ).subscribe({
          next: () => {
            this.snackBar.open('Vérification supprimée', 'Fermer', { duration: 3000 });
            // Plus besoin de recharger manuellement
          },
          error: (error) => {
            console.error('Error deleting verification:', error);
            this.snackBar.open('Erreur lors de la suppression', 'Fermer', { duration: 3000 });
          }
        });
      }
    });
  }
}
