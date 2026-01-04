import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NotificationService, Notification } from '../../services/notification.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from '@/components/confirmation-dialog.component';
import { FirebaseDatePipe } from '../../pipes/firebase-date.pipe';

@Component({
  selector: 'app-notification-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    FirebaseDatePipe
  ],
  templateUrl: './notification-detail.component.html'
})
export class NotificationDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private notificationService = inject(NotificationService);
  private dialog = inject(MatDialog);

  notification = signal<Notification | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadNotification(id);
    } else {
      this.error.set('ID de notification manquant');
      this.isLoading.set(false);
    }
  }

  private loadNotification(id: string) {
    this.isLoading.set(true);
    
    this.notificationService.notifications$.subscribe({
      next: (notifications) => {
        const found = notifications.find(n => n.id === id);
        if (found) {
          this.notification.set(found);
          // Marquer comme lu si pas encore lu
          if (!found.read && found.id) {
            this.notificationService.markAsRead(found.id).subscribe();
          }
        } else {
          this.error.set('Notification introuvable');
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Erreur lors du chargement de la notification:', err);
        this.error.set('Erreur lors du chargement de la notification');
        this.isLoading.set(false);
      }
    });
  }

  goBack() {
    this.router.navigate(['/notifications']);
  }

  goToAction() {
    const notif = this.notification();
    if (notif?.actionUrl) {
      this.router.navigateByUrl(notif.actionUrl);
    }
  }

  deleteNotification() {
    const notif = this.notification();
    const notifId = notif?.id;
    if (!notifId) return;
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Supprimer la notification',
        message: 'Êtes-vous sûr de vouloir supprimer cette notification ? Cette action est irréversible.',
        confirmText: 'Supprimer',
        cancelText: 'Annuler',
        type: 'danger'
      }
    });
    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.notificationService.deleteNotification(notifId).subscribe({
          next: () => {
            this.router.navigate(['/notifications']);
          },
          error: (err) => {
            console.error('Erreur lors de la suppression:', err);
          }
        });
      }
    });
  }

  getIcon(type: string): string {
    switch (type) {
      case 'match': return 'lightbulb';
      case 'verification': return 'verified_user';
      case 'success': return 'check_circle';
      case 'error': return 'error';
      case 'warning': return 'warning';
      default: return 'info';
    }
  }

  getIconClasses(type: string): string {
    const baseClasses = 'flex items-center justify-center w-16 h-16 rounded-full text-2xl';
    switch (type) {
      case 'match': return `${baseClasses} bg-yellow-100 dark:bg-yellow-900/50 text-yellow-600 dark:text-yellow-400`;
      case 'verification': return `${baseClasses} bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400`;
      case 'success': return `${baseClasses} bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400`;
      case 'error': return `${baseClasses} bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400`;
      case 'warning': return `${baseClasses} bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400`;
      default: return `${baseClasses} bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400`;
    }
  }

  getTypeLabel(type: string): string {
    switch (type) {
      case 'match': return 'Correspondance';
      case 'verification': return 'Vérification';
      case 'success': return 'Succès';
      case 'error': return 'Erreur';
      case 'warning': return 'Avertissement';
      default: return 'Information';
    }
  }

  getTypeBadgeClasses(type: string): string {
    const baseClasses = 'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium';
    switch (type) {
      case 'match': return `${baseClasses} bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300`;
      case 'verification': return `${baseClasses} bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300`;
      case 'success': return `${baseClasses} bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300`;
      case 'error': return `${baseClasses} bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300`;
      case 'warning': return `${baseClasses} bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-300`;
      default: return `${baseClasses} bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300`;
    }
  }
}
