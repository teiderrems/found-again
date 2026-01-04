import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { SubscriptionService } from '@/services/subscription.service';
import { AuthService } from '@/services/auth.service';
import { SubscriptionPlanDetails, SUBSCRIPTION_PLANS, SubscriptionPlan } from '@/types/subscription';
import { PaymentDialogComponent, PaymentResult } from '@/components/payment-dialog/payment-dialog.component';

@Component({
  selector: 'app-premium',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatDialogModule
  ],
  templateUrl: './premium.component.html',
  styleUrls: ['./premium.component.css'],
})
export class PremiumComponent implements OnInit {
  private subscriptionService = inject(SubscriptionService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  plans = signal<SubscriptionPlanDetails[]>([]);
  currentPlan = signal<SubscriptionPlan>('free');
  isPremium = this.subscriptionService.isPremium;
  isLoading = signal(false);
  selectedPlan = signal<SubscriptionPlan | null>(null);
  userId = signal<string | null>(null);

  ngOnInit(): void {
    this.plans.set(SUBSCRIPTION_PLANS.filter(p => p.id !== 'free'));
    
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.userId.set(user.uid);
      }
    });

    const currentSub = this.subscriptionService.currentSubscription();
    if (currentSub) {
      this.currentPlan.set(currentSub.plan);
    }
  }

  selectPlan(plan: SubscriptionPlan): void {
    this.selectedPlan.set(plan);
  }

  subscribeToPlan(planId: SubscriptionPlan): void {
    const uid = this.userId();
    if (!uid) {
      this.snackBar.open('Veuillez vous connecter pour souscrire', 'Fermer', { duration: 3000 });
      this.router.navigate(['/connexion']);
      return;
    }

    const planDetails = this.subscriptionService.getPlanDetails(planId);
    if (!planDetails) {
      this.snackBar.open('Plan non trouvé', 'Fermer', { duration: 3000 });
      return;
    }

    // Ouvrir le dialogue de paiement
    const dialogRef = this.dialog.open(PaymentDialogComponent, {
      data: { plan: planDetails },
      disableClose: false,
      panelClass: 'payment-dialog-container'
    });

    dialogRef.afterClosed().subscribe((result: PaymentResult) => {
      if (result?.success) {
        this.processSubscription(uid, planId, result.transactionId);
      } else if (result?.error !== 'cancelled') {
        this.snackBar.open('Le paiement a échoué. Veuillez réessayer.', 'Fermer', { duration: 3000 });
      }
    });
  }

  private processSubscription(uid: string, planId: SubscriptionPlan, transactionId?: string): void {
    this.isLoading.set(true);
    this.selectedPlan.set(planId);

    this.subscriptionService.subscribeToPremium(uid, planId).subscribe({
      next: () => {
        this.snackBar.open('Félicitations ! Vous êtes maintenant Premium 🎉', 'Fermer', { duration: 5000 });
        this.currentPlan.set(planId);
        this.isLoading.set(false);
        this.selectedPlan.set(null);
      },
      error: (error) => {
        console.error('Erreur lors de la souscription:', error);
        this.snackBar.open('Erreur lors de la souscription. Veuillez réessayer.', 'Fermer', { duration: 3000 });
        this.isLoading.set(false);
        this.selectedPlan.set(null);
      }
    });
  }

  cancelSubscription(): void {
    const currentSub = this.subscriptionService.currentSubscription();
    if (!currentSub?.id) {
      this.snackBar.open('Aucun abonnement actif à annuler', 'Fermer', { duration: 3000 });
      return;
    }

    this.isLoading.set(true);

    this.subscriptionService.cancelSubscription(currentSub.id).subscribe({
      next: () => {
        this.snackBar.open('Votre abonnement a été annulé', 'Fermer', { duration: 3000 });
        this.currentPlan.set('free');
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Erreur lors de l\'annulation:', error);
        this.snackBar.open('Erreur lors de l\'annulation. Veuillez réessayer.', 'Fermer', { duration: 3000 });
        this.isLoading.set(false);
      }
    });
  }

  formatPrice(price: number, currency: string): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency
    }).format(price);
  }
}
