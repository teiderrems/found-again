import { Component, OnInit, Input, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

declare global {
  interface Window {
    google: any;
  }
}

export interface MapMarker {
  position: { lat: number; lng: number };
  title: string;
  description?: string;
}

export interface RouteInfo {
  distance: string;
  duration: string;
  overview_polyline: any;
  legs: any[];
}

export type TravelMode = 'DRIVING' | 'WALKING' | 'BICYCLING' | 'TRANSIT';

export type MapStyle = 'roadmap' | 'satellite' | 'terrain' | 'hybrid' | 'styled';

export const TRAVEL_MODES: TravelMode[] = ['DRIVING', 'WALKING', 'BICYCLING', 'TRANSIT'];

export const MAP_STYLES: MapStyle[] = ['roadmap', 'satellite', 'terrain', 'hybrid', 'styled'];

export const ROUTE_COLORS: string[] = [
  '#4285F4', // Bleu Google (route 1)
  '#FFC933', // Jaune doré (route 2)
  '#F23B22', // Rouge/Orange (route 3)
  '#7B68EE', // Bleu violet (route 4)
  '#00BCD4', // Cyan (route 5)
  '#4CAF50'  // Vert (route 6)
];

export const MAP_STYLE_LABELS: Record<MapStyle, string> = {
  'roadmap': 'Carte',
  'satellite': 'Satellite',
  'terrain': 'Relief',
  'hybrid': 'Hybride',
  'styled': 'Style Google'
};

export const CUSTOM_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f5f5' }] },
  { featureType: 'administrative.land_parcel', elementType: 'labels.text.fill', stylers: [{ color: '#bdbdbd' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#eeeeee' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#e5e5e5' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road.arterial', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#dadada' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
  { featureType: 'road.local', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
  { featureType: 'transit.line', elementType: 'geometry', stylers: [{ color: '#e5e5e5' }] },
  { featureType: 'transit.station', elementType: 'geometry', stylers: [{ color: '#eeeeee' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9c9c9' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] }
];

export const TRAVEL_MODE_LABELS: Record<TravelMode, string> = {
  'DRIVING': 'Voiture',
  'WALKING': 'À pied',
  'BICYCLING': 'Vélo',
  'TRANSIT': 'Transports'
};

export const TRAVEL_MODE_ICONS: Record<TravelMode, string> = {
  'DRIVING': 'directions_car',
  'WALKING': 'directions_walk',
  'BICYCLING': 'two_wheeler',
  'TRANSIT': 'transit_enterexit'
};

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrl: './map.component.css',
  standalone: true,
  imports: [CommonModule, MatIconModule]
})
export class MapComponent implements OnInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef;
  @Input() latitude: number = 48.8626;
  @Input() longitude: number = 2.3344;
  @Input() zoomLevel: number = 13;
  @Input() markers: MapMarker[] = [];
  @Input() defaultRouteOrigin: { lat: number; lng: number } | null = { lat: 48.8626, lng: 2.3344 }; // Place de l'Échelle
  @Input() defaultRouteDestination: { lat: number; lng: number } | null = { lat: 48.8809, lng: 2.3553 }; // Gare du Nord
  @Input() showDefaultRoute: boolean = true;

  map: any;
  mapMarkers: any[] = [];
  infoWindow: any;
  directionsService: any;
  directionsRenderer: any;
  polylines: any[] = [];
  selectedTravelMode: TravelMode = 'DRIVING';
  currentRouteOrigin: { lat: number; lng: number } | null = null;
  currentRouteDestination: { lat: number; lng: number } | null = null;
  travelModes = TRAVEL_MODES;
  travelModeLabels = TRAVEL_MODE_LABELS;
  travelModeIcons = TRAVEL_MODE_ICONS;
  routeDistance: string = '';
  routeDuration: string = '';
  alternativeRoutes: RouteInfo[] = [];
  selectedRouteIndex: number = 0;
  alternativeRoutePolylines: any[] = [];

  ngOnInit() {
    this.loadGoogleMapsScript();
  }

  ngOnDestroy() {
    // Nettoyer les polylines des routes alternatives
    this.alternativeRoutePolylines.forEach((polyline: any) => polyline.setMap(null));
    this.alternativeRoutePolylines = [];
    
    // Nettoyer les autres polylines
    this.polylines.forEach(polyline => polyline.setMap(null));
    this.polylines = [];
    
    // Nettoyer les marqueurs
    this.clearMarkers();
  }

  private loadGoogleMapsScript() {
    // Vérifier si l'API est déjà chargée
    if (window.google && window.google.maps) {
      this.initializeMap();
      return;
    }

    const apiKey = 'AIzaSyBgWGIzUs03FXZUjG16tlvfAZSqY3Xrp6g';
    
    if (!apiKey) {
      console.error('⚠️ Google Maps API Key est invalide! Veuillez configurer votre clé API.');
      this.showErrorMessage('Google Maps API Key invalide');
      return;
    }

    // Utiliser la méthode standard de chargement avec configuration pour éviter les requêtes de tracking
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&loading=async&libraries=geometry&callback=initGoogleMap&v=weekly`;
    script.async = true;
    script.defer = true;
    script.nonce = 'maps-nonce'; // Prévenir les requêtes CSP diagnostic

    (window as any).initGoogleMap = () => {
      this.initializeMap();
    };

    script.onerror = () => {
      console.error('Erreur: Google Maps API n\'a pas pu être chargée. Vérifiez votre clé API.');
      this.showErrorMessage('Impossible de charger Google Maps');
    };

    document.head.appendChild(script);
  }

  private showErrorMessage(message: string) {
    const mapElement = this.mapContainer?.nativeElement;
    if (mapElement) {
      mapElement.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #f0f0f0; font-family: sans-serif; color: red; text-align: center; padding: 20px;">
        <div>
          <h3>${message}</h3>
          <p>Configurez votre clé Google Maps API dans map.component.ts</p>
        </div>
      </div>`;
    }
  }

  private async initializeMap() {
    setTimeout(async () => {
      try {
        const mapElement = this.mapContainer?.nativeElement;

        if (!mapElement) {
          console.warn('Map container not found');
          return;
        }

        // Attendre que google.maps soit disponible
        let attempts = 0;
        while (!window.google?.maps?.Map && attempts < 30) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }

        if (!window.google?.maps?.Map) {
          throw new Error('Google Maps API did not load properly');
        }

        const mapOptions: any = {
          zoom: this.zoomLevel,
          center: {
            lat: this.latitude,
            lng: this.longitude
          },
          mapTypeControl: true,
          fullscreenControl: true,
          zoomControl: true,
          streetViewControl: true,
          mapTypeId: 'roadmap'
        };

        this.map = new window.google.maps.Map(mapElement, mapOptions);
        this.infoWindow = new window.google.maps.InfoWindow();
        this.directionsService = new window.google.maps.DirectionsService();
        this.directionsRenderer = new window.google.maps.DirectionsRenderer({
          map: this.map,
          polylineOptions: {
            strokeColor: '#4285F4',
            strokeWeight: 6,
            strokeOpacity: 0.85
          }
        });

        this.addMarkers();

        // Tracer l'itinéraire par défaut
        if (this.showDefaultRoute && this.defaultRouteOrigin && this.defaultRouteDestination) {
          this.showRoute(this.defaultRouteOrigin, this.defaultRouteDestination);
        }

        this.map.addListener('click', (mapsMouseEvent: any) => {
          this.addClickMarker(mapsMouseEvent.latLng);
        });
      } catch (error) {
        console.error('Erreur lors de l\'initialisation de la map:', error);
        this.showErrorMessage('Erreur lors du chargement de la carte');
      }
    }, 100);
  }

  private addMarkers() {
    this.markers.forEach(markerData => {
      this.createMarker(
        markerData.position, 
        markerData.title, 
        markerData.description,
        (markerData as any).icon
      );
    });
  }

  private createMarker(
    position: { lat: number; lng: number },
    title: string,
    description?: string,
    icon?: string
  ) {
    try {
      // Déterminer la couleur du marqueur selon le type
      let markerColor = '#3b82f6'; // Bleu par défaut
      let markerLabel = '';
      
      if (icon === 'found') {
        markerColor = '#3b82f6'; // Bleu pour les objets trouvés
        markerLabel = 'T';
      } else if (icon === 'lost') {
        markerColor = '#ea580c'; // Orange pour les objets perdus
        markerLabel = 'P';
      }

      // Créer un SVG pour un marqueur personnalisé
      const svgMarker = `
        <svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 0C9.38 0 4 5.38 4 12c0 8 12 28 12 28s12-20 12-28c0-6.62-5.38-12-12-12z" fill="${markerColor}" stroke="white" stroke-width="1"/>
          <circle cx="16" cy="12" r="5" fill="white"/>
          <text x="16" y="15" font-size="10" font-weight="bold" text-anchor="middle" fill="${markerColor}">${markerLabel}</text>
        </svg>
      `;

      const markerImage = new window.google.maps.MarkerImage(
        'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svgMarker),
        null,
        null,
        new window.google.maps.Point(16, 40)
      );

      // Utiliser les marqueurs classiques avec image personnalisée
      const marker = new window.google.maps.Marker({
        position,
        map: this.map,
        title,
        icon: markerImage
      });

      // Ajouter le listener au clic
      marker.addListener('click', () => {
        this.infoWindow.close();
        
        // Créer un contenu plus détaillé avec le type d'objet si disponible
        let content = `<div style="padding: 10px; font-family: sans-serif; max-width: 250px;">
          <h3 style="margin: 0 0 5px 0; font-weight: bold; font-size: 14px;">${title}</h3>`;
        
        if (icon) {
          const typeText = icon === 'found' ? 'Trouvé ✓' : 'Perdu ✗';
          const typeColor = icon === 'found' ? '#3b82f6' : '#ea580c';
          content += `<p style="margin: 5px 0; font-size: 11px; color: ${typeColor}; font-weight: bold;">${typeText}</p>`;
        }
        
        if (description) {
          content += `<p style="margin: 5px 0; font-size: 12px; color: #666;">${description}</p>`;
        }
        
        content += `<p style="margin: 5px 0; font-size: 11px; color: #999;">
          Lat: ${position.lat.toFixed(4)}, Lng: ${position.lng.toFixed(4)}
        </p></div>`;

        this.infoWindow.setContent(content);
        this.infoWindow.open({
          anchor: marker,
          map: this.map,
          shouldFocus: false
        });
      });

      this.mapMarkers.push(marker);
    } catch (error) {
      console.error('Erreur lors de la création du marqueur:', error);
    }
  }

  private addClickMarker(latLng: any) {
    const position = {
      lat: latLng.lat(),
      lng: latLng.lng()
    };
    this.createMarker(
      position,
      'Nouveau marqueur',
      `Cliqué à: ${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}`
    );
  }

  clearMarkers() {
    this.mapMarkers.forEach(marker => {
      if (marker && typeof marker.map === 'function') {
        marker.map(null);
      } else if (marker) {
        // Pour AdvancedMarkerElement
        marker.map = null;
      }
    });
    this.mapMarkers = [];
  }

  removeMarker(index: number) {
    if (this.mapMarkers[index]) {
      const marker = this.mapMarkers[index];
      if (marker && typeof marker.map === 'function') {
        marker.map(null);
      } else if (marker) {
        marker.map = null;
      }
      this.mapMarkers.splice(index, 1);
    }
  }

  centerMap(lat: number, lng: number) {
    if (this.map) {
      this.map.setCenter({ lat, lng });
    }
  }

  setZoom(zoom: number) {
    if (this.map) {
      this.map.setZoom(zoom);
    }
  }

  // Afficher un itinéraire entre deux positions
  showRoute(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    travelMode?: TravelMode
  ) {
    // Vérifications de sécurité
    if (!origin || !destination) {
      console.error('Origin and destination are required');
      return;
    }

    this.currentRouteOrigin = origin;
    this.currentRouteDestination = destination;
    
    const mode = travelMode || this.selectedTravelMode || 'DRIVING';
    
    if (!this.directionsService || !this.directionsRenderer) {
      console.error('Directions Service not initialized');
      return;
    }

    const travelModeValue = window.google.maps.TravelMode[mode];
    if (!travelModeValue) {
      console.error(`Invalid travel mode: ${mode}`);
      return;
    }

    const request = {
      origin: origin,
      destination: destination,
      travelMode: travelModeValue,
      provideRouteAlternatives: true
    };

    this.directionsService.route(request, (result: any, status: any) => {
      if (status === window.google.maps.DirectionsStatus.OK && result && result.routes && result.routes.length > 0) {
        this.directionsRenderer.setDirections(result);
        
        // Effacer les polylines des routes alternatives précédentes
        this.alternativeRoutePolylines.forEach(polyline => polyline.setMap(null));
        this.alternativeRoutePolylines = [];
        
        // Extraire toutes les routes alternatives
        this.alternativeRoutes = result.routes.map((route: any) => {
          const leg = route.legs && route.legs[0];
          return {
            distance: leg?.distance?.text || 'N/A',
            duration: leg?.duration?.text || 'N/A',
            overview_polyline: route.overview_polyline,
            legs: route.legs
          };
        }).filter((route: any) => route.distance !== 'N/A' && route.duration !== 'N/A');
        
        // Calculer la distance et durée totales de la route sélectionnée
        const selectedRoute = result.routes[0];
        if (selectedRoute && selectedRoute.legs && selectedRoute.legs.length > 0) {
          let totalDistance = 0;
          let totalDuration = 0;
          
          selectedRoute.legs.forEach((leg: any) => {
            if (leg.distance && leg.distance.value) totalDistance += leg.distance.value;
            if (leg.duration && leg.duration.value) totalDuration += leg.duration.value;
          });
          
          // Convertir en format lisible
          if (totalDistance > 1000) {
            this.routeDistance = `${(totalDistance / 1000).toFixed(1)} km`;
          } else {
            this.routeDistance = `${totalDistance} m`;
          }
          
          // Convertir la durée en heures et minutes
          const hours = Math.floor(totalDuration / 3600);
          const minutes = Math.floor((totalDuration % 3600) / 60);
          
          if (hours > 0) {
            this.routeDuration = `${hours}h ${minutes}min`;
          } else {
            this.routeDuration = `${minutes}min`;
          }
        }
        
        // Tracer les polylines des routes alternatives avec des couleurs différentes
        result.routes.forEach((route: any, index: number) => {
          // Ne pas tracer la première route (elle est déjà affichée par directionsRenderer)
          if (index > 0 && route.overview_polyline && route.overview_polyline.points) {
            try {
              const routeColor = ROUTE_COLORS[index % ROUTE_COLORS.length];
              const polyline = new window.google.maps.Polyline({
                path: window.google.maps.geometry.encoding.decodePath(route.overview_polyline.points),
                geodesic: true,
                strokeColor: routeColor,
                strokeOpacity: 0.85,
                strokeWeight: 6,
                map: this.map
              });
              this.alternativeRoutePolylines.push(polyline);
            } catch (error) {
              console.error('Erreur lors de la création de la polyline:', error);
            }
          }
        });
        
        this.selectedRouteIndex = 0;
        
        // Afficher la première route par défaut
        if (this.alternativeRoutes.length > 0) {
          const firstRoute = this.alternativeRoutes[0];
          console.log(`Route principale: ${firstRoute.distance}, Durée: ${firstRoute.duration}`);
        }
      } else {
        console.error(`Erreur Directions: ${status}`);
      }
    });
  }

  // Tracer une polyline personnalisée entre deux points
  drawLine(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    color: string = '#FF0000',
    weight: number = 2
  ) {
    const polyline = new window.google.maps.Polyline({
      path: [origin, destination],
      geodesic: true,
      strokeColor: color,
      strokeOpacity: 0.8,
      strokeWeight: weight,
      map: this.map
    });

    this.polylines.push(polyline);
    return polyline;
  }

  // Tracer un chemin avec plusieurs points
  drawPath(
    points: { lat: number; lng: number }[],
    color: string = '#0000FF',
    weight: number = 2
  ) {
    if (points.length < 2) {
      console.warn('Au moins 2 points sont nécessaires pour tracer un chemin');
      return;
    }

    const polyline = new window.google.maps.Polyline({
      path: points,
      geodesic: true,
      strokeColor: color,
      strokeOpacity: 0.8,
      strokeWeight: weight,
      map: this.map
    });

    this.polylines.push(polyline);
    return polyline;
  }

  // Effacer tous les itinéraires
  clearRoutes() {
    this.directionsRenderer.setDirections({ routes: [] });
    this.polylines.forEach(polyline => polyline.setMap(null));
    this.polylines = [];
  }

  // Effacer un itinéraire spécifique
  clearRoute(polyline: any) {
    polyline.setMap(null);
    const index = this.polylines.indexOf(polyline);
    if (index > -1) {
      this.polylines.splice(index, 1);
    }
  }

  // Changer le mode de déplacement et réafficher l'itinéraire
  changeTravelMode(mode: TravelMode) {
    this.selectedTravelMode = mode;
    if (this.currentRouteOrigin && this.currentRouteDestination) {
      this.showRoute(this.currentRouteOrigin, this.currentRouteDestination, mode);
    }
  }

  // Sélectionner une route alternative
  selectRoute(index: number) {
    this.selectedRouteIndex = index;
    
    // Vérifications de sécurité
    if (!this.directionsService || !this.directionsRenderer) {
      console.warn('Directions Service not initialized');
      return;
    }

    if (!this.currentRouteOrigin || !this.currentRouteDestination) {
      console.warn('Route origin or destination not set');
      return;
    }

    if (!this.selectedTravelMode) {
      console.warn('Travel mode not set');
      return;
    }

    const request = {
      origin: this.currentRouteOrigin,
      destination: this.currentRouteDestination,
      travelMode: window.google.maps.TravelMode[this.selectedTravelMode] || window.google.maps.TravelMode['DRIVING'],
      provideRouteAlternatives: true
    };

    this.directionsService.route(request, (result: any, status: any) => {
      if (status === window.google.maps.DirectionsStatus.OK && result && result.routes && result.routes.length > index) {
        // Créer une nouvelle direction avec seulement la route sélectionnée
        const selectedRouteResult = {
          routes: [result.routes[index]],
          geocoded_waypoints: result.geocoded_waypoints
        };
        this.directionsRenderer.setDirections(selectedRouteResult);
        
        // Mettre à jour la distance et durée affichées
        const selectedRoute = result.routes[index];
        if (selectedRoute && selectedRoute.legs && selectedRoute.legs.length > 0) {
          let totalDistance = 0;
          let totalDuration = 0;
          
          selectedRoute.legs.forEach((leg: any) => {
            if (leg.distance && leg.distance.value) totalDistance += leg.distance.value;
            if (leg.duration && leg.duration.value) totalDuration += leg.duration.value;
          });
          
          // Convertir en format lisible
          if (totalDistance > 1000) {
            this.routeDistance = `${(totalDistance / 1000).toFixed(1)} km`;
          } else {
            this.routeDistance = `${totalDistance} m`;
          }
          
          // Convertir la durée en heures et minutes
          const hours = Math.floor(totalDuration / 3600);
          const minutes = Math.floor((totalDuration % 3600) / 60);
          
          if (hours > 0) {
            this.routeDuration = `${hours}h ${minutes}min`;
          } else {
            this.routeDuration = `${minutes}min`;
          }
        }
        
        // Mettre à jour les polylines des routes alternatives
        this.alternativeRoutePolylines.forEach(polyline => polyline.setMap(null));
        this.alternativeRoutePolylines = [];
        
        // Tracer les polylines des routes alternatives (sauf celle sélectionnée)
        result.routes.forEach((route: any, routeIndex: number) => {
          if (routeIndex !== index && route.overview_polyline && route.overview_polyline.points) {
            try {
              const routeColor = ROUTE_COLORS[routeIndex % ROUTE_COLORS.length];
              const polyline = new window.google.maps.Polyline({
                path: window.google.maps.geometry.encoding.decodePath(route.overview_polyline.points),
                geodesic: true,
                strokeColor: routeColor,
                strokeOpacity: 0.85,
                strokeWeight: 6,
                map: this.map
              });
              this.alternativeRoutePolylines.push(polyline);
            } catch (error) {
              console.error('Erreur lors de la création de la polyline:', error);
            }
          }
        });
      } else {
        console.error(`Error selecting route: ${status}`);
      }
    });
  }

  // Changer le style de la carte
  changeMapStyle(style: MapStyle) {
    if (!this.map) {
      return;
    }

    if (style === 'styled') {
      this.map.setOptions({ styles: CUSTOM_MAP_STYLE });
    } else {
      this.map.setMapTypeId(style);
      this.map.setOptions({ styles: [] });
    }
  }
}