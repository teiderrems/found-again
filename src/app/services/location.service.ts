// services/location.service.ts
import { Inject, Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface LocationSuggestion {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
  address: {
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    county?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private http = inject(HttpClient);
  constructor(@Inject('openStreetMapUrl') private readonly nominatimUrl:string){}

  // Obtenir la position actuelle de l'utilisateur
  getCurrentPosition(): Observable<Coordinates> {
    return new Observable(observer => {
      if (!navigator.geolocation) {
        observer.error('Geolocation is not supported by this browser.');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          observer.next({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          observer.complete();
        },
        (error) => {
          observer.error(error);
        }
      );
    });
  }

  // Rechercher des suggestions de lieu
  searchLocations(query: string): Observable<LocationSuggestion[]> {
    if (!query || query.length < 3) {
      return of([]);
    }

    const params = {
      q: query,
      format: 'json',
      addressdetails: '1',
      limit: '10',
      countrycodes: 'fr' // Limiter à la France, ajuster selon les besoins
    };

    return this.http.get<LocationSuggestion[]>(`${this.nominatimUrl}/search`, { params }).pipe(
      catchError(() => of([])) // Retourner un tableau vide en cas d'erreur
    );
  }

  // Obtenir l'adresse à partir de coordonnées (reverse geocoding)
  getAddressFromCoordinates(lat: number, lon: number): Observable<string> {
    const params = {
      lat: lat.toString(),
      lon: lon.toString(),
      format: 'json',
      addressdetails: '1'
    };

    return this.http.get<any>(`${this.nominatimUrl}/reverse`, { params }).pipe(
      map(response => response.display_name),
      catchError(() => of('Adresse non disponible'))
    );
  }

  // Calculer la distance entre deux points (formule de Haversine)
  calculateDistance(
    lat1: number, 
    lon1: number, 
    lat2: number, 
    lon2: number
  ): number {
    const R = 6371; // Rayon de la Terre en km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance en km
    
    return distance;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  // Vérifier si deux locations sont proches (dans un rayon donné)
  areLocationsClose(
    lat1: number, 
    lon1: number, 
    lat2: number, 
    lon2: number, 
    maxDistanceKm: number = 5
  ): boolean {
    const distance = this.calculateDistance(lat1, lon1, lat2, lon2);
    return distance <= maxDistanceKm;
  }
}