// services/notification.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../environments/environment';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

export interface MatchNotification {
  declarationId: string;
  matchedDeclarationId: string;
  confidence: number;
  similarityReasons: string[];
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/notifications`;
  
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  // Récupérer toutes les notifications
  getNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(this.apiUrl).pipe(
      // tap(notifications => {
      //   this.notificationsSubject.next(notifications);
      //   this.updateUnreadCount(notifications);
      // })
    );
  }

  // Marquer une notification comme lue
  markAsRead(notificationId: string): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${notificationId}/read`, {}).pipe(
      // tap(() => {
      //   const notifications = this.notificationsSubject.value.map(notif =>
      //     notif.id === notificationId ? { ...notif, read: true } : notif
      //   );
      //   this.notificationsSubject.next(notifications);
      //   this.updateUnreadCount(notifications);
      // })
    );
  }

  // Marquer toutes les notifications comme lues
  markAllAsRead(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/mark-all-read`, {}).pipe(
      // tap(() => {
      //   const notifications = this.notificationsSubject.value.map(notif => ({
      //     ...notif,
      //     read: true
      //   }));
      //   this.notificationsSubject.next(notifications);
      //   this.updateUnreadCount(notifications);
      // })
    );
  }

  // Supprimer une notification
  deleteNotification(notificationId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${notificationId}`).pipe(
      // tap(() => {
      //   const notifications = this.notificationsSubject.value.filter(
      //     notif => notif.id !== notificationId
      //   );
      //   this.notificationsSubject.next(notifications);
      //   this.updateUnreadCount(notifications);
      // })
    );
  }

  // Envoyer une notification de correspondance
  sendMatchNotification(matchData: MatchNotification): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/matches`, matchData);
  }

  // Mettre à jour le compteur de notifications non lues
  private updateUnreadCount(notifications: Notification[]): void {
    const unreadCount = notifications.filter(notif => !notif.read).length;
    this.unreadCountSubject.next(unreadCount);
  }

  // Notification UI (pour les toasts)
  showToast(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info'): void {
    // Implémentation pour afficher des toasts UI
    console.log(`[${type.toUpperCase()}] ${message}`);
    // Vous pouvez intégrer avec une bibliothèque de toasts comme ngx-toastr
  }
}