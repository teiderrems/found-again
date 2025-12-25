// services/notification.service.ts
// services/notification.service.ts
import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject, from, map, switchMap } from 'rxjs';
import { User } from '@angular/fire/auth';
import { 
  Firestore, 
  collection, 
  query, 
  where, 
  collectionData, 
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  orderBy,
  limit,
  DocumentData
} from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { FirebaseMessagingService } from './firebase-messaging.service';

export interface Notification {
  id?: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'match' | 'verification';
  read: boolean;
  createdAt: Date | string;
  actionUrl?: string;
  data?: any;
}

export interface MatchNotification {
  declarationId: string;
  matchedDeclarationId: string;
  confidence: number;
  similarityReasons: string[];
}

export interface NotificationCreate {
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'match' | 'verification';
  actionUrl?: string;
  data?: any;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);
  private fcmService = inject(FirebaseMessagingService);
  
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor() {
    // S'abonner aux changements d'authentification
    this.authService.currentUser$.subscribe((user: User | null) => {
      if (user) {
        this.loadUserNotifications(user.uid);
        this.fcmService.saveTokenToFirestore(user.uid);
      } else {
        this.notificationsSubject.next([]);
        this.unreadCountSubject.next(0);
      }
    });

    // Écouter les nouveaux messages FCM
    this.fcmService.message$.subscribe((message: any) => {
      if (message) {
        this.handleIncomingMessage(message);
      }
    });
  }

  /**
   * Charge les notifications de l'utilisateur depuis Firestore
   */
  private loadUserNotifications(userId: string) {
    const notificationsRef = collection(this.firestore, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    collectionData(q, { idField: 'id' }).subscribe({
      next: (data: any[]) => {
        const notifications: Notification[] = data.map(doc => ({
          id: doc['id'] as string,
          userId: doc['userId'] as string || '',
          title: doc['title'] as string || '',
          message: doc['message'] as string || '',
          type: (doc['type'] as string || 'info') as Notification['type'],
          read: doc['read'] as boolean || false,
          createdAt: doc['createdAt'] || new Date(),
          actionUrl: doc['actionUrl'] as string | undefined,
          data: doc['data'] as any
        }));
        
        this.notificationsSubject.next(notifications);
        this.updateUnreadCount(notifications);
      },
      error: (error: any) => {
        // Vérifier si l'erreur est due à un index manquant
        if (error?.code === 'failed-precondition' && error?.message?.includes('index')) {
          console.warn('Index Firestore manquant pour la collection notifications');
          console.warn('Créez l\'index à: https://console.firebase.google.com/v1/r/project/found-again-4a0e0/firestore/indexes');
          console.warn('L\'index requis: userId (Ascending), createdAt (Descending)');
          // Retourner une liste vide pour ne pas bloquer l'application
          this.notificationsSubject.next([]);
        } else {
          console.error('Erreur lors du chargement des notifications:', error);
          // Retourner une liste vide en cas d'erreur
          this.notificationsSubject.next([]);
        }
      }
    });
  }

  /**
   * Récupère toutes les notifications de l'utilisateur courant
   */
  getUserNotifications(): Observable<Notification[]> {
    return this.notifications$;
  }

  /**
   * Crée une nouvelle notification
   */
  createNotification(notification: NotificationCreate): Observable<string> {
    const notificationsRef = collection(this.firestore, 'notifications');
    
    const notificationData = {
      ...notification,
      read: false,
      createdAt: new Date()
    };

    return from(addDoc(notificationsRef, notificationData)).pipe(
      map(docRef => docRef.id),
      switchMap(async (notificationId) => {
        // Envoyer la notification push si l'utilisateur a activé les notifications
        await this.sendPushNotification(notification);
        return notificationId;
      })
    );
  }

  /**
   * Marque une notification comme lue
   */
  markAsRead(notificationId: string): Observable<void> {
    const notificationRef = doc(this.firestore, 'notifications', notificationId);
    return from(updateDoc(notificationRef, { read: true }));
  }

  /**
   * Marque toutes les notifications comme lues
   */
  markAllAsRead(userId: string): Observable<void> {
    const notifications = this.notificationsSubject.value;
    const unreadNotifications = notifications.filter(n => !n.read);
    
    const promises = unreadNotifications.map(notification => {
      if (notification.id) {
        const notificationRef = doc(this.firestore, 'notifications', notification.id);
        return updateDoc(notificationRef, { read: true });
      }
      return Promise.resolve();
    });

    return from(Promise.all(promises)).pipe(
      map(() => void 0)
    );
  }

  /**
   * Supprime une notification
   */
  deleteNotification(notificationId: string): Observable<void> {
    const notificationRef = doc(this.firestore, 'notifications', notificationId);
    return from(deleteDoc(notificationRef));
  }

  /**
   * Envoie une notification de correspondance entre objets
   */
  async sendMatchNotification(matchData: MatchNotification, targetUserId: string): Promise<void> {
    const notification: NotificationCreate = {
      userId: targetUserId,
      title: 'Correspondance trouvée !',
      message: `Un objet pourrait correspondre à votre déclaration (${matchData.confidence}% de similarité)`,
      type: 'match',
      actionUrl: `/declaration/${matchData.matchedDeclarationId}`,
      data: matchData
    };

    this.createNotification(notification).subscribe({
      next: () => console.log('Notification de correspondance envoyée'),
      error: (error) => console.error('Erreur lors de l\'envoi de la notification:', error)
    });
  }

  /**
   * Envoie une notification de vérification d'identité
   */
  async sendVerificationNotification(
    declarationId: string, 
    targetUserId: string, 
    status: 'approved' | 'rejected',
    message?: string
  ): Promise<void> {
    const notification: NotificationCreate = {
      userId: targetUserId,
      title: status === 'approved' ? 'Vérification approuvée' : 'Vérification rejetée',
      message: message || (status === 'approved' 
        ? 'Votre vérification d\'identité a été approuvée'
        : 'Votre vérification d\'identité a été rejetée'),
      type: 'verification',
      actionUrl: `/mes-verifications`,
      data: { declarationId, status }
    };

    this.createNotification(notification).subscribe({
      next: () => console.log('Notification de vérification envoyée'),
      error: (error) => console.error('Erreur lors de l\'envoi de la notification:', error)
    });
  }

  /**
   * Envoie une notification push via FCM
   */
  private async sendPushNotification(notification: NotificationCreate): Promise<void> {
    try {
      console.log('Notification push à envoyer:', {
        title: notification.title,
        body: notification.message,
        userId: notification.userId
      });

      // Afficher une notification locale immédiatement
      this.showBrowserNotification(notification.message, notification.type);

    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification push:', error);
    }
  }

  /**
   * Gère les messages FCM entrants
   */
  private handleIncomingMessage(message: any) {
    console.log('Nouveau message FCM reçu:', message);
    
    // Actualiser les notifications si nécessaire
    const currentUser = this.authService.getCurrentUserId();
    if (currentUser) {
      this.loadUserNotifications(currentUser);
    }
    
    // Afficher une notification toast
    this.showToast(message.notification?.body || 'Nouvelle notification', 'info');
  }

  /**
   * Met à jour le compteur de notifications non lues
   */
  private updateUnreadCount(notifications: Notification[]): void {
    const unreadCount = notifications.filter(notif => !notif.read).length;
    this.unreadCountSubject.next(unreadCount);
  }

  /**
   * Notification UI (pour les toasts)
   */
  showToast(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info'): void {
    console.log(`[${type.toUpperCase()}] ${message}`);
    this.showBrowserNotification(message, type);
  }

  /**
   * Affiche une notification dans le navigateur
   */
  private showBrowserNotification(message: string, type: string): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification('Found Again', {
        body: message,
        icon: '/images/logo/logo.png',
        tag: 'found-again-toast'
      });

      // Auto-fermer après 5 secondes
      setTimeout(() => {
        notification.close();
      }, 5000);
    }
  }

  /**
   * Demande la permission pour les notifications
   */
  async requestNotificationPermission(): Promise<boolean> {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }
}