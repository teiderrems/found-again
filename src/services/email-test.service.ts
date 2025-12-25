import { Injectable, inject } from '@angular/core';
import { take } from 'rxjs';
import { AuthService } from './auth.service';
import { EmailNotificationService } from './email-notification.service';
import { MatSnackBar } from '@angular/material/snack-bar';

/**
 * Service de test pour les notifications par email
 * Utile pour tester tous les scénarios d'envoi d'email
 */
@Injectable({
  providedIn: 'root'
})
export class EmailTestService {
  private authService = inject(AuthService);
  private emailService = inject(EmailNotificationService);
  private snackBar = inject(MatSnackBar);

  /**
   * Lance tous les tests d'email
   */
  async runAllTests(): Promise<void> {
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      this.showError('Utilisateur non authentifié');
      return;
    }

    let userEmail = '';
    this.authService.currentUser$.pipe(take(1)).subscribe(user => {
      userEmail = user?.email || '';
    });

    if (!userEmail) {
      this.showError('Email utilisateur non disponible');
      return;
    }

    console.log('🚀 Démarrage des tests d\'email...\n');

    await this.testEmail(userId, userEmail);
    await this.testMatchNotification(userId, userEmail);
    await this.testDeclarationUpdate(userId, userEmail);
    await this.testSecurityAlert(userId, userEmail);
    await this.testStatistics(userId);

    console.log('\n✅ Tous les tests sont terminés!');
    this.snackBar.open('✅ Tous les tests sont terminés!', 'Fermer', { duration: 5000 });
  }

  /**
   * Test: Email de test simple
   */
  private async testEmail(userId: string, email: string): Promise<void> {
    console.log('📧 Test 1: Email de test');
    try {
      const success = await this.emailService.sendTestEmail(userId, email);
      if (success) {
        console.log('✅ Email de test envoyé avec succès\n');
      } else {
        console.log('❌ Erreur lors de l\'envoi de l\'email de test\n');
      }
    } catch (error) {
      console.error('❌ Erreur:', error);
    }
  }

  /**
   * Test: Notification de correspondance
   */
  private async testMatchNotification(userId: string, email: string): Promise<void> {
    console.log('🎯 Test 2: Notification de correspondance');
    try {
      const success = await this.emailService.sendMatchNotificationEmail(
        userId,
        email,
        {
          objectName: 'iPhone 14 Pro',
          matchedObjectName: 'Téléphone Apple gris',
          confidence: 0.92,
          declarationId: 'test-dec-' + Date.now()
        }
      );
      if (success) {
        console.log('✅ Email de correspondance envoyé avec succès\n');
      } else {
        console.log('❌ Erreur lors de l\'envoi de l\'email de correspondance\n');
      }
    } catch (error) {
      console.error('❌ Erreur:', error);
    }
  }

  /**
   * Test: Mise à jour de déclaration
   */
  private async testDeclarationUpdate(userId: string, email: string): Promise<void> {
    console.log('✅ Test 3: Email de mise à jour de déclaration');
    try {
      const success = await this.emailService.sendDeclarationUpdateEmail(
        userId,
        email,
        {
          declarationId: 'test-dec-' + Date.now(),
          objectName: 'Portefeuille noir',
          updateType: 'status_changed',
          updateMessage: 'Votre déclaration a été marquée comme résolue'
        }
      );
      if (success) {
        console.log('✅ Email de mise à jour envoyé avec succès\n');
      } else {
        console.log('❌ Erreur lors de l\'envoi de l\'email de mise à jour\n');
      }
    } catch (error) {
      console.error('❌ Erreur:', error);
    }
  }

  /**
   * Test: Alerte de sécurité
   */
  private async testSecurityAlert(userId: string, email: string): Promise<void> {
    console.log('🔒 Test 4: Alerte de sécurité');
    try {
      const success = await this.emailService.sendSecurityAlertEmail(
        userId,
        email,
        {
          title: 'Nouvelle tentative de connexion détectée',
          message: 'Une nouvelle connexion a été détectée depuis votre navigateur de test.',
          actionUrl: '/profile?tab=security'
        }
      );
      if (success) {
        console.log('✅ Email d\'alerte de sécurité envoyé avec succès\n');
      } else {
        console.log('❌ Erreur lors de l\'envoi de l\'alerte de sécurité\n');
      }
    } catch (error) {
      console.error('❌ Erreur:', error);
    }
  }

  /**
   * Test: Vérification des statistiques
   */
  private testStatistics(userId: string): Promise<void> {
    return new Promise((resolve) => {
      console.log('📊 Test 5: Statistiques d\'email');
      
      this.emailService.getEmailStatistics(userId).subscribe({
        next: (stats) => {
          console.log('Statistiques reçues:');
          console.log(`  📋 Total: ${stats.total}`);
          console.log(`  ✅ Envoyés: ${stats.sent}`);
          console.log(`  ❌ Échoués: ${stats.failed}`);
          console.log(`  ⏳ En attente: ${stats.pending}\n`);
          resolve();
        },
        error: (error) => {
          console.error('❌ Erreur lors de la récupération des statistiques:', error);
          resolve();
        }
      });
    });
  }

  /**
   * Test: Relancer les emails échoués
   */
  async retryFailedEmails(userId: string): Promise<void> {
    console.log('🔄 Test: Relancer les emails échoués');
    try {
      this.emailService.getPendingEmails(userId).subscribe(async (pending) => {
        if (pending.length === 0) {
          console.log('✅ Aucun email en attente');
          this.snackBar.open('✅ Aucun email en attente', 'Fermer', { duration: 5000 });
          return;
        }

        let successCount = 0;
        for (const email of pending) {
          if (email.id && await this.emailService.retryFailedEmail(email.id)) {
            successCount++;
          }
        }

        console.log(`✅ ${successCount}/${pending.length} emails relancés`);
        this.snackBar.open(
          `✅ ${successCount}/${pending.length} emails relancés`,
          'Fermer',
          { duration: 5000 }
        );
      });
    } catch (error) {
      console.error('❌ Erreur:', error);
    }
  }

  /**
   * Test: Afficher les logs d'email
   */
  showEmailLogs(userId: string): void {
    console.log('📜 Récupération des logs d\'email...');
    
    this.emailService.getEmailLogs(userId).subscribe({
      next: (logs) => {
        console.table(logs.map(log => ({
          Date: this.formatDate(log.sentAt),
          Destinataire: log.recipient,
          Sujet: log.subject,
          Type: log.type,
          Statut: log.status,
          Raison: log.failureReason || '-'
        })));
        
        console.log(`\n📊 Total: ${logs.length} logs`);
      },
      error: (error) => {
        console.error('❌ Erreur:', error);
      }
    });
  }

  /**
   * Test personnalisé
   */
  async sendCustomEmail(
    userId: string,
    email: string,
    subject: string,
    message: string
  ): Promise<void> {
    console.log(`📧 Envoi d'email personnalisé: ${subject}`);
    try {
      const success = await this.emailService.sendNotificationEmail({
        userId,
        recipientEmail: email,
        subject,
        type: 'notification',
        templateData: {
          title: subject,
          message
        }
      });

      if (success) {
        console.log('✅ Email envoyé avec succès');
        this.snackBar.open('✅ Email envoyé avec succès!', 'Fermer', { duration: 5000 });
      } else {
        console.log('❌ Erreur lors de l\'envoi');
        this.snackBar.open('❌ Erreur lors de l\'envoi', 'Fermer', { duration: 5000 });
      }
    } catch (error) {
      console.error('❌ Erreur:', error);
      this.snackBar.open('❌ Erreur lors de l\'envoi', 'Fermer', { duration: 5000 });
    }
  }

  /**
   * Utilitaires
   */
  private formatDate(date: any): string {
    if (!date) return '-';
    const d = date instanceof Date ? date : new Date((date.seconds || 0) * 1000);
    return d.toLocaleString('fr-FR');
  }

  private showError(message: string): void {
    console.error('❌ ' + message);
    this.snackBar.open('❌ ' + message, 'Fermer', { duration: 5000 });
  }

  /**
   * Aide pour l'utilisation
   */
  showHelp(): void {
    const help = `
╔════════════════════════════════════════════════════════════════╗
║          AIDE - SERVICE DE TEST D'EMAIL                        ║
╚════════════════════════════════════════════════════════════════╝

Utilisation dans la console du navigateur (F12):

1. Importer le service:
   const testService = ng.probe(document.querySelector('app-root'))
     .injector.get(EmailTestService);

2. Lancer tous les tests:
   testService.runAllTests();

3. Tests individuels:
   testService.testEmail(userId, email);
   testService.testMatchNotification(userId, email);
   testService.testDeclarationUpdate(userId, email);
   testService.testSecurityAlert(userId, email);
   testService.testStatistics(userId);

4. Relancer les emails échoués:
   testService.retryFailedEmails(userId);

5. Afficher les logs:
   testService.showEmailLogs(userId);

6. Envoyer un email personnalisé:
   testService.sendCustomEmail(userId, email, 'Sujet', 'Message');

7. Voir cette aide:
   testService.showHelp();

╔════════════════════════════════════════════════════════════════╗
║  Vérifier la console (F12) pour les messages de progression   ║
╚════════════════════════════════════════════════════════════════╝
    `;
    console.log(help);
  }
}
