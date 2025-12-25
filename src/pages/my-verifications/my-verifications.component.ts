import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VerificationService } from '@/services/verification.service';
import { AuthService } from '@/services/auth.service';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { VerificationData, VerificationStatus } from '@/types/verification';

@Component({
  selector: 'app-my-verifications',
  templateUrl: './my-verifications.component.html',
  styleUrl: './my-verifications.component.css',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
})
export class MyVerificationsComponent implements OnInit {
  private verificationService = inject(VerificationService);
  private authService = inject(AuthService);
  private router = inject(Router);

  verifications = signal<VerificationData[]>([]);
  isLoading = signal(false);

  ngOnInit() {
    this.loadVerifications();
  }

  private loadVerifications() {
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      this.router.navigateByUrl('/connexion');
      return;
    }

    this.isLoading.set(true);
    this.verificationService.getUserVerifications(userId).subscribe({
      next: (verifications) => {
        this.verifications.set(verifications);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des vérifications:', error);
        this.isLoading.set(false);
      },
    });
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case VerificationStatus.PENDING:
        return 'En attente';
      case VerificationStatus.VERIFIED:
        return 'Vérifié';
      case VerificationStatus.REJECTED:
        return 'Rejeté';
      default:
        return status;
    }
  }

  getStatusClasses(status: string): string {
    switch (status) {
      case VerificationStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case VerificationStatus.VERIFIED:
        return 'bg-green-100 text-green-800';
      case VerificationStatus.REJECTED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  retryVerification(declarationId: string) {
    this.router.navigate(['/verifier-identite', declarationId]);
  }
}
