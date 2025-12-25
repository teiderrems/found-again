import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NotificationService } from '../services/notification.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-notification-test',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <div class="bg-white rounded-lg shadow p-6 mb-6">
      <h3 class="text-lg font-semibold mb-4">Test des Notifications</h3>
      <div class="flex flex-wrap gap-2">
        <button 
          mat-raised-button 
          color="primary"
          (click)="testMatchNotification()">
          <mat-icon>lightbulb</mat-icon>
          Test Correspondance
        </button>
        
        <button 
          mat-raised-button 
          color="accent"
          (click)="testVerificationNotification()">
          <mat-icon>verified_user</mat-icon>
          Test Vérification
        </button>
        
        <button 
          mat-raised-button 
          (click)="testSuccessNotification()">
          <mat-icon>check_circle</mat-icon>
          Test Succès
        </button>
        
        <button 
          mat-raised-button 
          color="warn"
          (click)="testErrorNotification()">
          <mat-icon>error</mat-icon>
          Test Erreur
        </button>
        
        <button 
          mat-raised-button 
          (click)="requestPermission()">
          <mat-icon>notifications</mat-icon>
          Autoriser Notifications
        </button>
      </div>
    </div>
  `
})
export class NotificationTestComponent {
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);

  async testMatchNotification() {
    const userId = this.authService.getCurrentUserId();
    if (!userId) return;

    await this.notificationService.sendMatchNotification({
      declarationId: 'test-declaration-1',
      matchedDeclarationId: 'test-declaration-2',
      confidence: 85,
      similarityReasons: ['Couleur similaire', 'Même catégorie', 'Zone géographique proche']
    }, userId);
  }

  async testVerificationNotification() {
    const userId = this.authService.getCurrentUserId();
    if (!userId) return;

    await this.notificationService.sendVerificationNotification(
      'test-declaration-3',
      userId,
      'approved',
      'Votre vérification d\'identité a été approuvée avec succès!'
    );
  }

  testSuccessNotification() {
    const userId = this.authService.getCurrentUserId();
    if (!userId) return;

    this.notificationService.createNotification({
      userId: userId,
      title: 'Opération réussie!',
      message: 'Votre déclaration a été enregistrée avec succès.',
      type: 'success',
      actionUrl: '/tableau-de-bord'
    }).subscribe();
  }

  testErrorNotification() {
    const userId = this.authService.getCurrentUserId();
    if (!userId) return;

    this.notificationService.createNotification({
      userId: userId,
      title: 'Erreur détectée',
      message: 'Une erreur s\'est produite lors du traitement de votre demande.',
      type: 'error'
    }).subscribe();
  }

  async requestPermission() {
    const granted = await this.notificationService.requestNotificationPermission();
    if (granted) {
      this.notificationService.showToast('Permission accordée!', 'success');
    } else {
      this.notificationService.showToast('Permission refusée.', 'warning');
    }
  }
}