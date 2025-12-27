import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MapComponent } from "@/components/map/map.component";
import { MapMarker } from "@/components/map/map.component";
import { DeclarationService } from '@/services/declaration.service';
import { AuthService } from '@/services/auth.service';
import { LocationService, Coordinates } from '@/services/location.service';
import { DeclarationData, DeclarationType } from '@/types/declaration';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { DeclarationDetailsDialogComponent } from '@/components/declaration-details-dialog/declaration-details-dialog.component';

interface ExtendedMapMarker extends MapMarker {
  declarationId?: string;
  declarationType?: DeclarationType;
  category?: string;
  location?: string;
  date?: Date;
  images?: any[];
  icon?: string;
  id?: number;
}

@Component({
  selector: 'app-map-view',
  standalone: true,
  imports: [CommonModule, MapComponent, MatIconModule],
  templateUrl: './map-view.component.html',
  styles: [`
    :host {
      display: block;
      height: 100vh;
      width: 100%;
    }
  `]
})
export class MapViewComponent implements OnInit {
  private declarationService = inject(DeclarationService);
  private authService = inject(AuthService);
  private locationService = inject(LocationService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  centerLat = 48.8566; // Paris default
  centerLng = 2.3522;
  userLocation: Coordinates | null = null;
  zoomLevel = 12;
  allMarkers: ExtendedMapMarker[] = [];
  markers: ExtendedMapMarker[] = [];
  selectedMarker: ExtendedMapMarker | null = null;
  
  defaultRouteOrigin: { lat: number; lng: number } | null = null;
  defaultRouteDestination: { lat: number; lng: number } | null = null;
  showDefaultRoute = false;
  
  isLoading = signal(false);
  DeclarationType = DeclarationType;

  ngOnInit(): void {
    // Get user location
    this.locationService.getCurrentPosition().subscribe({
      next: (coords) => {
        this.userLocation = coords;
      },
      error: (err) => console.error('Error getting location:', err)
    });

    this.route.queryParams.subscribe(params => {
      const originLat = parseFloat(params['originLat']);
      const originLng = parseFloat(params['originLng']);
      const destinationLat = parseFloat(params['destinationLat']);
      const destinationLng = parseFloat(params['destinationLng']);
      
      // Check for single point coordinates
      const lat = parseFloat(params['lat']);
      const lng = parseFloat(params['lng']);

      if (!isNaN(originLat) && !isNaN(originLng) && !isNaN(destinationLat) && !isNaN(destinationLng)) {
        // Set default route coordinates
        this.defaultRouteOrigin = { lat: originLat, lng: originLng };
        this.defaultRouteDestination = { lat: destinationLat, lng: destinationLng };
        this.showDefaultRoute = true;

        // Create markers for origin and destination
        this.allMarkers = [
          {
            position: { lat: originLat, lng: originLng },
            title: 'Départ'
          },
          {
            position: { lat: destinationLat, lng: destinationLng },
            title: 'Arrivée'
          }
        ];
        this.markers = [...this.allMarkers];

        // Center map between origin and destination
        this.centerLat = (originLat + destinationLat) / 2;
        this.centerLng = (originLng + destinationLng) / 2;
      } else if (!isNaN(lat) && !isNaN(lng)) {
        // Center map on specific point
        this.centerLat = lat;
        this.centerLng = lng;
        this.zoomLevel = 15; // Zoom in closer for specific point
        
        // We still load declarations, but maybe we should highlight the one at this location?
        // For now, just centering is good.
        this.loadDeclarationsAsMarkers();
      } else {
        // Load user declarations as markers
        this.loadDeclarationsAsMarkers();
      }
    });
  }

  private loadDeclarationsAsMarkers() {
    this.isLoading.set(true);
    this.declarationService.getActiveDeclarations().subscribe({
      next: (declarations) => {
        // Convert declarations to markers
        this.allMarkers = declarations
          .filter(decl => decl.coordinates?.lat && decl.coordinates?.lng)
          .map((decl, index) => ({
            position: { lat: decl.coordinates!.lat, lng: decl.coordinates!.lng },
            title: decl.title,
            description: decl.description,
            category: decl.category,
            declarationId: decl.id!,
            declarationType: decl.type,
            location: decl.location,
            date: new Date(decl.date),
            images: decl.images || [],
            icon: decl.type === DeclarationType.FOUND ? 'found' : 'lost',
            id: index // Ajouter un ID pour l'identification
          }));
        
        this.markers = [...this.allMarkers];

        // Calculate center if markers exist
        if (this.markers.length > 0) {
          const avgLat = this.markers.reduce((sum, m) => sum + m.position.lat, 0) / this.markers.length;
          const avgLng = this.markers.reduce((sum, m) => sum + m.position.lng, 0) / this.markers.length;
          this.centerLat = avgLat;
          this.centerLng = avgLng;
          this.zoomLevel = 13;
        }

        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des déclarations:', err);
        this.isLoading.set(false);
      }
    });
  }

  selectMarker(markerIndex: number) {
    if (markerIndex >= 0 && markerIndex < this.markers.length) {
      this.selectedMarker = this.markers[markerIndex];
      // Center map on selected marker
      this.centerLat = this.selectedMarker.position.lat;
      this.centerLng = this.selectedMarker.position.lng;
      this.zoomLevel = 15;
    }
  }

  onSearch(event: Event) {
    const query = (event.target as HTMLInputElement).value.toLowerCase();
    
    if (!query) {
      this.markers = [...this.allMarkers];
      return;
    }

    this.markers = this.allMarkers.filter(marker => 
      marker.title.toLowerCase().includes(query) ||
      marker.category?.toLowerCase().includes(query) ||
      marker.location?.toLowerCase().includes(query) ||
      marker.description?.toLowerCase().includes(query)
    );
  }

  isMarkerSelected(index: number): boolean {
    if (!this.selectedMarker || !this.markers[index]) return false;
    return this.markers[index].declarationId === this.selectedMarker.declarationId;
  }

  getMarkerColor(index: number): string {
    const marker = this.markers[index];
    return marker?.icon === 'found' ? '#009245' : '#ea580c';
  }

  getMarkerBgColor(index: number): string {
    const marker = this.markers[index];
    return marker?.icon === 'found' ? 'bg-[#009245]' : 'bg-orange-500';
  }

  getMarkerLabel(index: number): string {
    const marker = this.markers[index];
    return marker?.icon === 'found' ? 'T' : 'P';
  }

  viewDetails(declarationId: string) {
    this.isLoading.set(true);
    this.declarationService.getDeclarationById(declarationId).subscribe({
      next: (declaration) => {
        this.isLoading.set(false);
        this.dialog.open(DeclarationDetailsDialogComponent, {
          data: {
            declaration,
            userLocation: this.userLocation
          },
          width: '800px',
          maxWidth: '95vw',
          maxHeight: '90vh',
          panelClass: 'rounded-2xl'
        });
      },
      error: (err) => {
        console.error('Erreur lors du chargement de la déclaration:', err);
        this.isLoading.set(false);
      }
    });
  }

  goBack() {
    this.router.navigate(['/tableau-de-bord']);
  }
}

