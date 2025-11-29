// environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  appName: 'Objets Trouvés',
  version: '1.0.0',
  mapbox: {
    accessToken: 'your_mapbox_token_here'
  },
  features: {
    enableNotifications: true,
    enableGeolocation: true,
    enableImageRecognition: false
  }
};