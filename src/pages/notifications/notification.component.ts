import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterModule } from '@angular/router';
import { NotificationService, Notification } from '../../services/notification.service';
import { FirebaseDatePipe } from '../../pipes/firebase-date.pipe';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    RouterModule,
    FirebaseDatePipe
  ],
  templateUrl: './notification.component.html',
  styleUrl: './notification.component.css'
})
export class NotificationComponent implements OnInit {
  private notificationService = inject(NotificationService);
  
  notifications = signal<Notification[]>([]);
  filteredNotifications = signal<Notification[]>([]);
  selectedFilter = signal<'all' | 'unread' | 'match' | 'verification'>('all');
  isLoading = signal(false);

  // Computed signals pour les compteurs
  totalCount = computed(() => this.notifications().length);
  unreadCount = computed(() => this.notifications().filter(n => !n.read).length);
  matchCount = computed(() => this.notifications().filter(n => n.type === 'match').length);
  verificationCount = computed(() => this.notifications().filter(n => n.type === 'verification').length);

  ngOnInit() {
    this.loadNotifications();
  }

  private loadNotifications() {
    this.isLoading.set(true);
    
    this.notificationService.notifications$.subscribe({
      next: (notifications) => {
        this.notifications.set(notifications);
        this.applyFilter();
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  applyFilter() {
    const filter = this.selectedFilter();
    const all = this.notifications();
    
    let filtered: Notification[];
    
    switch (filter) {
      case 'unread':
        filtered = all.filter(n => !n.read);
        break;
      case 'match':
        filtered = all.filter(n => n.type === 'match');
        break;
      case 'verification':
        filtered = all.filter(n => n.type === 'verification');
        break;
      default:
        filtered = all;
    }
    
    this.filteredNotifications.set(filtered);
  }

  setFilter(filter: 'all' | 'unread' | 'match' | 'verification') {
    this.selectedFilter.set(filter);
    this.applyFilter();
  }

  markAsRead(notification: Notification) {
    if (!notification.read && notification.id) {
      this.notificationService.markAsRead(notification.id).subscribe();
    }
  }

  markAllAsRead() {
    const userId = this.notificationService['authService'].getCurrentUserId();
    if (userId) {
      this.notificationService.markAllAsRead(userId).subscribe();
    }
  }

  deleteNotification(notification: Notification) {
    if (notification.id && confirm('Êtes-vous sûr de vouloir supprimer cette notification ?')) {
      this.notificationService.deleteNotification(notification.id).subscribe();
    }
  }

  onNotificationClick(notification: Notification) {
    this.markAsRead(notification);
    
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
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
    const baseClasses = 'flex items-center justify-center w-12 h-12 rounded-full text-lg';
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