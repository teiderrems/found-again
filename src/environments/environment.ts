// environments/environment.ts
export const environment = {
   production: false,
   apiUrl: 'http://localhost:3000/api',
   appName: 'Objets Trouvés',
   version: '1.0.0',
   mapbox: {
      accessToken: 'your_mapbox_token_here',
   },
   features: {
      enableNotifications: true,
      enableGeolocation: true,
      enableImageRecognition: false,
   },
   vapidKey: 'BDcBxhfErB3z2Nd52L0zIePr66q0sjI9mcAuxmGfBB44HFlBebMXjkfZC0v8D7L4AD0uZyumlAKBHwmmh6ShdX0', // Obtenez-la dans la console Firebase > Project Settings > Cloud Messaging > Web Push certificates
   firebaseConfig: {
      apiKey: 'AIzaSyB8pX5HHUmYMCaUt3YmzD0FyWcqS7_iuEY',
      authDomain: 'found-again-4a0e0.firebaseapp.com',
      databaseURL: 'https://found-again-4a0e0-default-rtdb.firebaseio.com',
      projectId: 'found-again-4a0e0',
      storageBucket: 'found-again-4a0e0.firebasestorage.app',
      messagingSenderId: '1019330466468',
      appId: '1:1019330466468:web:9eb199fc069d945827cc31',
   },
};
