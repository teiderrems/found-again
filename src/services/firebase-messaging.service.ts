import { Injectable, inject } from '@angular/core';
import { Messaging, getToken, onMessage } from '@angular/fire/messaging';
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
  
  private messageSubject = new BehaviorSubject<any>(null);
  public message$ = this.messageSubject.asObservable();
  
  private tokenSubject = new BehaviorSubject<string | null>(null);
  public token$ = this.tokenSubject.asObservable();

  constructor() {
    // Vérifier si l'environnement supporte les notifications
    if ('Notification' in window && navigator.serviceWorker) {
      this.initializeMessaging();
    } else {
      console.warn('Les notifications ne sont pas supportées sur cet appareil/navigateur');
    }
  }

  private async initializeMessaging() {
    try {
      // Vérifier la permission de notification
      const permission = Notification.permission;
      
      if (permission === 'granted') {
        console.log('Permission de notification accordée');
        await this.getMessagingToken();
        this.listenForMessages();
      } else if (permission !== 'denied') {
        // Demander la permission seulement si elle n'a pas déjà été refusée
        const result = await Notification.requestPermission();
        if (result === 'granted') {
          console.log('Permission de notification accordée');
          await this.getMessagingToken();
          this.listenForMessages();
        }
      }
    } catch (error) {
      console.warn('Erreur lors de l\'initialisation des notifications:', error);
      // Ne pas bloquer l'application si les notifications échouent
    }
  }

  /**
   * Récupère le token FCM pour cet appareil
   */
  async getMessagingToken(): Promise<string | null> {
    try {
      const vapidKey = environment.firebaseConfig.apiKey || 'BKxmyZqfZ5ZN3Mj7W4zJGzFXs6LsUw9-_0x3dBzTHlL8jKqYhc2pNvO4wE1dTfGhS5lP7zX9bV3aK2qR6uH8vQc';
      
      const token = await getToken(this.messaging, { 
        vapidKey: vapidKey 
      });
      
      if (token) {
        console.log('Token FCM récupéré:', token);
        this.tokenSubject.next(token);
        return token;
      } else {
        console.warn('Impossible de récupérer le token FCM');
        return null;
      }
    } catch (error) {
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
      onMessage(this.messaging, (payload:any) => {
        console.log('Message reçu en foreground:', payload);
        this.messageSubject.next(payload);
        
        // Afficher une notification personnalisée
        this.showNotification(payload.notification);
      });
    } catch (error) {
      console.error('Erreur lors de l\'écoute des messages:', error);
    }
  }

  /**
   * Affiche une notification dans le navigateur
   */
  private showNotification(notification?: FCMNotification) {
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
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, options);
      });
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
        // Vous pouvez utiliser votre service Firestore existant ici
        console.log('Token à sauvegarder pour l\'utilisateur', userId, ':', token);
        
        // Exemple d'implémentation :
        // await this.firestore.collection('users').doc(userId).update({
        //   fcmTokens: firebase.firestore.FieldValue.arrayUnion(token)
        // });
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
        
        // Exemple d'implémentation :
        // await this.firestore.collection('users').doc(userId).update({
        //   fcmTokens: firebase.firestore.FieldValue.arrayRemove(token)
        // });
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du token:', error);
    }
  }
}