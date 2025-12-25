import { Component, OnInit, inject, signal } from '@angular/core';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { RouterModule } from '@angular/router';
import { NotificationService, Notification } from '../services/notification.service';
import { FirebaseDatePipe } from '../pipes/firebase-date.pipe';

@Component({
  selector: 'app-notification-panel',
  standalone: true,
  imports: [
    MatIconModule,
    MatButtonModule,
    MatBadgeModule,
    MatMenuModule,
    RouterModule,
    FirebaseDatePipe
],
  template: `
    <div class="relative">
      <!-- Bouton de notification -->
      <button
        mat-icon-button
        [matMenuTriggerFor]="notificationMenu"
        class="relative">
        <mat-icon
          [matBadge]="unreadCount()"
          [matBadgeHidden]="unreadCount() === 0"
          matBadgeColor="warn"
          matBadgeSize="small">
          notifications
        </mat-icon>
      </button>
    
      <!-- Menu des notifications -->
      <mat-menu #notificationMenu="matMenu" class="notification-menu">
        <div class="w-80 max-h-96 overflow-hidden">
          <!-- En-tête -->
          <div class="flex items-center justify-between p-4 border-b">
            <h3 class="font-semibold text-gray-900">Notifications</h3>
            @if (unreadCount() > 0) {
              <button
                (click)="markAllAsRead()"
                class="text-sm text-blue-600 hover:text-blue-800">
                Tout marquer comme lu
              </button>
            }
          </div>
    
          <!-- Liste des notifications -->
          <div class="overflow-y-auto max-h-80">
            @if (notifications().length === 0) {
              <div class="p-4 text-center text-gray-500">
                <mat-icon class="text-4xl mb-2">notifications_none</mat-icon>
                <p>Aucune notification</p>
              </div>
            }
    
            @for (notification of notifications(); track notification) {
              <div
                class="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                (click)="onNotificationClick(notification)">
                <div class="p-4" [class.bg-blue-50]="!notification.read">
                  <div class="flex items-start space-x-3">
                    <!-- Icône du type -->
                    <div [class]="getIconClasses(notification.type)">
                      <mat-icon>{{ getIcon(notification.type) }}</mat-icon>
                    </div>
                    <!-- Contenu -->
                    <div class="flex-1 min-w-0">
                      <h4 class="text-sm font-medium text-gray-900 truncate">
                        {{ notification.title }}
                      </h4>
                      <p class="text-xs text-gray-600 mt-1 line-clamp-2">
                        {{ notification.message }}
                      </p>
                      <p class="text-xs text-gray-400 mt-2">
                        {{ notification.createdAt | firebaseDate:'full' }}
                      </p>
                    </div>
                    <!-- Indicateur non lu -->
                    @if (!notification.read) {
                      <div
                        class="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0">
                      </div>
                    }
                  </div>
                </div>
              </div>
            }
          </div>
    
          <!-- Pied du menu -->
          <div class="p-4 border-t bg-gray-50">
            <button
              routerLink="/notifications"
              class="w-full text-center text-sm text-gray-600 hover:text-gray-900">
              Voir toutes les notifications
            </button>
          </div>
        </div>
      </mat-menu>
    </div>
    `,
  styles: [`
    :host {
      display: block;
    }
    
    ::ng-deep .notification-menu {
      margin-top: 8px;
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

    // Naviguer vers l'action si définie
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
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
      case 'match': return `${baseClasses} bg-yellow-100 text-yellow-600`;
      case 'verification': return `${baseClasses} bg-purple-100 text-purple-600`;
      case 'success': return `${baseClasses} bg-green-100 text-green-600`;
      case 'error': return `${baseClasses} bg-red-100 text-red-600`;
      case 'warning': return `${baseClasses} bg-orange-100 text-orange-600`;
      default: return `${baseClasses} bg-blue-100 text-blue-600`;
    }
  }
}