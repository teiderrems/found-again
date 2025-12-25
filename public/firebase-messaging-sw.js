// Firebase Cloud Messaging Service Worker
// Ce fichier gère les notifications reçues en arrière-plan

// Chargement des scripts Firebase depuis CDN avec gestion d'erreur
let firebaseLoaded = false;

importScripts('https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/11.2.0/firebase-messaging.js');

// Vérifier que Firebase est disponible
if (typeof firebase !== 'undefined' && firebase.initializeApp) {
  firebaseLoaded = true;
  
  // Configuration Firebase
  const firebaseConfig = {
    apiKey: 'AIzaSyCn0RLGIb75n4LKVg_Aq9LSJxDMiI5bI_E',
    authDomain: 'found-again-b0e9a.firebaseapp.com',
    projectId: 'found-again-b0e9a',
    storageBucket: 'found-again-b0e9a.appspot.com',
    messagingSenderId: '851154405255',
    appId: '1:851154405255:web:5f7b7b8f5e9c7a8b9c0d1e',
    measurementId: 'G-ABC123XYZ'
  };

  try {
    // Initialiser Firebase
    firebase.initializeApp(firebaseConfig);

    // Initialiser Cloud Messaging
    const messaging = firebase.messaging();

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
  self.registration.showNotification(notificationTitle, notificationOptions);
});

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

    console.log('[firebase-messaging-sw] Firebase Cloud Messaging initialisé avec succès');
  } catch (error) {
    console.error('[firebase-messaging-sw] Erreur lors de l\'initialisation Firebase:', error);
  }
} else {
  console.warn('[firebase-messaging-sw] Firebase n\'a pas pu être chargé depuis le CDN');
  console.warn('[firebase-messaging-sw] Les notifications en arrière-plan ne seront pas disponibles');
}
