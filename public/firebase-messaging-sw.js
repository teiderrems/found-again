// Firebase Cloud Messaging Service Worker
// Ce fichier gère les notifications reçues en arrière-plan

// Chargement des scripts Firebase depuis CDN avec gestion d'erreur
let firebaseLoaded = false;
let messaging = null;

try {
  importScripts('https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js');
  importScripts('https://www.gstatic.com/firebasejs/11.2.0/firebase-messaging.js');
} catch (error) {
  console.error('[firebase-messaging-sw] Erreur lors du chargement des scripts Firebase:', error);
}

// Vérifier que Firebase est disponible
if (typeof firebase !== 'undefined' && firebase.initializeApp) {
  try {
    // Configuration Firebase
    const firebaseConfig = {
      apiKey: 'AIzaSyB8pX5HHUmYMCaUt3YmzD0FyWcqS7_iuEY',
      authDomain: 'found-again-4a0e0.firebaseapp.com',
      databaseURL: 'https://found-again-4a0e0-default-rtdb.firebaseio.com',
      projectId: 'found-again-4a0e0',
      storageBucket: 'found-again-4a0e0.firebasestorage.app',
      messagingSenderId: '1019330466468',
      appId: '1:1019330466468:web:9eb199fc069d945827cc31'
    };

    // Initialiser Firebase
    const app = firebase.initializeApp(firebaseConfig);
    messaging = firebase.messaging();
    firebaseLoaded = true;

    console.log('[firebase-messaging-sw] Firebase initialisé avec succès');

    // Gérer les messages reçus en arrière-plan
    messaging.onBackgroundMessage((payload) => {
      console.log('[firebase-messaging-sw] Notification reçue en arrière-plan:', payload);

      const notificationTitle = payload.notification?.title || 'Nouvelle notification';
      const notificationOptions = {
        body: payload.notification?.body || '',
        icon: payload.notification?.icon || '/images/logo/logo.png',
        badge: '/images/logo/logo.png',
        tag: 'firebase-notification',
        requireInteraction: false,
        data: payload.data || {}
      };

      // Afficher la notification
      if (self.registration) {
        self.registration.showNotification(notificationTitle, notificationOptions);
      }
    });
  } catch (error) {
    console.error('[firebase-messaging-sw] Erreur lors de l\'initialisation Firebase:', error);
    firebaseLoaded = false;
  }
} else {
  console.warn('[firebase-messaging-sw] Firebase n\'est pas disponible dans le service worker');
}

// Gérer les clics sur les notifications
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw] Notification cliquée:', event.notification);
  
  event.notification.close();

  // Ouvrir la fenêtre appropriée
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Chercher une fenêtre déjà ouverte
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }

      // Ouvrir une nouvelle fenêtre si aucune n'existe
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

if (!firebaseLoaded) {
  console.warn('[firebase-messaging-sw] Les notifications en arrière-plan ne seront pas disponibles');
}
