import { Injectable, inject, Injector, runInInjectionContext } from '@angular/core';
import { Messaging, getToken, onMessage } from '@angular/fire/messaging';
import { Firestore, doc, updateDoc, setDoc, arrayUnion, arrayRemove } from '@angular/fire/firestore';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface FCMNotification {
  title?: string;
  body?: string;
  icon?: string;
  click_action?: string;
  data?: any;
}

@Injectable({
  providedIn: 'root'
})
export class FirebaseMessagingService {
  private messaging = inject(Messaging);
  private firestore = inject(Firestore);
  private injector = inject(Injector);
  
  private messageSubject = new BehaviorSubject<any>(null);
  public message$ = this.messageSubject.asObservable();
  
  private tokenSubject = new BehaviorSubject<string | null>(null);
  public token$ = this.tokenSubject.asObservable();

  constructor() {
    // Vérifier si l'environnement supporte les notifications
    if (!('Notification' in window) || !navigator.serviceWorker) {
      console.warn('Les notifications ne sont pas supportées sur cet appareil/navigateur');
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window) || !navigator.serviceWorker) {
      return false;
    }

    try {
      // Vérifier la permission de notification
      const permission = Notification.permission;
      
      if (permission === 'granted') {
        const token = await this.getMessagingToken();
        if (token) {
          this.listenForMessages();
          return true;
        }
      } else if (permission !== 'denied') {
        // Demander la permission seulement si elle n'a pas déjà été refusée
        const result = await Notification.requestPermission();
        if (result === 'granted') {
          const token = await this.getMessagingToken();
          if (token) {
            this.listenForMessages();
            return true;
          }
        }
      }
      return false;
    } catch (error) {
      console.warn('Erreur lors de l\'initialisation des notifications:', error);
      return false;
    }
  }

  /**
   * Récupère le token FCM pour cet appareil
   */
  async getMessagingToken(): Promise<string | null> {
    try {
      // La clé VAPID (Web Push Certificate) est nécessaire pour les notifications Web
      const vapidKey = environment.vapidKey;
      
      if (!vapidKey || vapidKey === 'REMPLACER_PAR_VOTRE_CLE_VAPID_ICI') {
         console.warn('Clé VAPID non configurée dans environment.ts');
         return null;
      }
      
      // Exécuter getToken dans le contexte d'injection Angular
      const token = await runInInjectionContext(this.injector, () => 
        getToken(this.messaging, { vapidKey: vapidKey })
      );
      
      if (token) {
        this.tokenSubject.next(token);
        return token;
      } else {
        console.warn('Impossible de récupérer le token FCM');
        return null;
      }
    } catch (error: any) {
      if (error?.code === 'messaging/permission-blocked') {
        console.log('Permission de notification refusée par l\'utilisateur.');
        return null;
      }
      console.warn('Erreur lors de la récupération du token FCM:', error);
      // Retourner null au lieu de lever une erreur pour ne pas bloquer l'app
      return null;
    }
  }

  /**
   * Écoute les messages entrants
   */
  private listenForMessages() {
    try {
      runInInjectionContext(this.injector, () => {
        onMessage(this.messaging, async (payload:any) => {
          this.messageSubject.next(payload);
          
          // Afficher une notification personnalisée
          await this.showNotification(payload.notification);
        });
      });
    } catch (error) {
      console.error('Erreur lors de l\'écoute des messages:', error);
    }
  }

  /**
   * Affiche une notification dans le navigateur
   */
  private async showNotification(notification?: FCMNotification) {
    if (!notification) return;

    const title = notification.title || 'Nouvelle notification';
    const options = {
      body: notification.body || '',
      icon: notification.icon || '/images/logo/logo.png',
      badge: '/images/logo/logo.png',
      tag: 'found-again-notification',
      requireInteraction: true,
      actions: [
        {
          action: 'view',
          title: 'Voir',
          icon: '/images/icons/view.png'
        },
        {
          action: 'dismiss',
          title: 'Fermer',
          icon: '/images/icons/close.png'
        }
      ]
    };

    if ('serviceWorker' in navigator && 'showNotification' in ServiceWorkerRegistration.prototype) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, options);
    } else {
      // Fallback pour les navigateurs qui ne supportent pas les service workers
      new Notification(title, options);
    }
  }

  /**
   * Enregistre le token FCM pour l'utilisateur courant dans Firestore
   */
  async saveTokenToFirestore(userId: string): Promise<void> {
    try {
      const token = await this.getMessagingToken();
      if (token && userId) {
        
        const userRef = doc(this.firestore, 'users', userId);
        // Utiliser setDoc avec merge:true pour créer le document s'il n'existe pas
        await setDoc(userRef, {
          fcmTokens: arrayUnion(token)
        }, { merge: true });
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du token:', error);
    }
  }

  /**
   * Supprime le token FCM de Firestore
   */
  async removeTokenFromFirestore(userId: string): Promise<void> {
    try {
      const token = this.tokenSubject.value;
      if (token && userId) {
        console.log('Token à supprimer pour l\'utilisateur', userId, ':', token);
        
        const userRef = doc(this.firestore, 'users', userId);
        // Utiliser setDoc avec merge:true pour éviter l'erreur si le document n'existe pas
        await setDoc(userRef, {
          fcmTokens: arrayRemove(token)
        }, { merge: true });
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du token:', error);
    }
  }
}