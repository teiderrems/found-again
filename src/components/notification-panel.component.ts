import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { RouterModule } from '@angular/router';
import { NotificationService, Notification } from '../services/notification.service';
import { FirebaseDatePipe } from '../pipes/firebase-date.pipe';
import { DropdownComponent } from './dropdown/dropdown.component';

@Component({
  selector: 'app-notification-panel',
  standalone: true,
  imports: [
    MatIconModule,
    MatButtonModule,
    MatBadgeModule,
    RouterModule,
    FirebaseDatePipe,
    DropdownComponent
],
  template: `
    <div class="relative">
      <app-dropdown [options]="[]" [placement]="'bottom-right'" [closeOnSelect]="false">
        <!-- Trigger personnalisé : bouton notification -->
        <ng-template #dropdownTrigger let-context>
          <button
            (click)="context.toggleDropdown()"
            class="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer">
            <mat-icon
              [matBadge]="unreadCount()"
              [matBadgeHidden]="unreadCount() === 0"
              matBadgeColor="warn"
              matBadgeSize="small"
              class="text-gray-700 dark:text-gray-200">
              notifications
            </mat-icon>
          </button>
        </ng-template>

        <!-- Contenu personnalisé du dropdown -->
        <ng-template #dropdownContent let-context let-closeDropdown="closeDropdown">
          <div class="w-80 max-h-96 overflow-hidden">
            <!-- En-tête -->
            <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 class="font-semibold text-gray-900 dark:text-white">Notifications</h3>
              @if (unreadCount() > 0) {
                <button
                  (click)="markAllAsRead(); $event.stopPropagation()"
                  class="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 cursor-pointer">
                  Tout marquer comme lu
                </button>
              }
            </div>

            <!-- Liste des notifications -->
            <div class="overflow-y-auto max-h-80">
              @if (notifications().length === 0) {
                <div class="p-4 text-center text-gray-500 dark:text-gray-400">
                  <mat-icon class="text-4xl mb-2">notifications_none</mat-icon>
                  <p>Aucune notification</p>
                </div>
              }

              @for (notification of notifications(); track notification.id) {
                <div
                  class="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                  (click)="onNotificationClick(notification); closeDropdown()">
                  <div class="p-4" [class.bg-blue-50]="!notification.read" [class.dark:bg-blue-900/30]="!notification.read">
                    <div class="flex items-start space-x-3">
                      <!-- Icône du type -->
                      <div [class]="getIconClasses(notification.type)">
                        <mat-icon>{{ getIcon(notification.type) }}</mat-icon>
                      </div>
                      <!-- Contenu -->
                      <div class="flex-1 min-w-0">
                        <h4 class="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {{ notification.title }}
                        </h4>
                        <p class="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                          {{ notification.message }}
                        </p>
                        <p class="text-xs text-gray-400 dark:text-gray-500 mt-2">
                          {{ notification.createdAt | firebaseDate:'full' }}
                        </p>
                      </div>
                      <!-- Indicateur non lu -->
                      @if (!notification.read) {
                        <div class="w-2 h-2 bg-blue-500 rounded-full mt-2 shrink-0"></div>
                      }
                    </div>
                  </div>
                </div>
              }
            </div>

            <!-- Pied du menu -->
            <div class="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <button
                (click)="goToAllNotifications(); closeDropdown()"
                class="w-full text-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer">
                Voir toutes les notifications
              </button>
            </div>
          </div>
        </ng-template>
      </app-dropdown>
    </div>
    `,
  styles: [`
    :host {
      display: block;
    }
    
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `]
})
export class NotificationPanelComponent implements OnInit {
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  
  notifications = signal<Notification[]>([]);
  unreadCount = signal<number>(0);

  ngOnInit() {
    // S'abonner aux notifications
    this.notificationService.notifications$.subscribe(notifications => {
      this.notifications.set(notifications.slice(0, 10)); // Limiter à 10 pour le menu
    });

    // S'abonner au compteur
    this.notificationService.unreadCount$.subscribe(count => {
      this.unreadCount.set(count);
    });
  }

  onNotificationClick(notification: Notification) {
    // Marquer comme lu si pas encore lu
    if (!notification.read && notification.id) {
      this.notificationService.markAsRead(notification.id).subscribe();
    }

    // Naviguer vers la page de détail de la notification
    if (notification.id) {
      this.router.navigate(['/notifications', notification.id]);
    }
  }

  goToAllNotifications() {
    this.router.navigate(['/notifications']);
  }

  markAllAsRead() {
    const userId = this.notificationService['authService'].getCurrentUserId();
    if (userId) {
      this.notificationService.markAllAsRead(userId).subscribe();
    }
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
    const baseClasses = 'flex items-center justify-center w-8 h-8 rounded-full text-sm';
    switch (type) {
      case 'match': return `${baseClasses} bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400`;
      case 'verification': return `${baseClasses} bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400`;
      case 'success': return `${baseClasses} bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400`;
      case 'error': return `${baseClasses} bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400`;
      case 'warning': return `${baseClasses} bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400`;
      default: return `${baseClasses} bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400`;
    }
  }
}