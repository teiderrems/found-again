import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MapComponent } from "@/components/map/map.component";
import { MapMarker } from "@/components/map/map.component";
import { DeclarationService } from '@/services/declaration.service';
import { AuthService } from '@/services/auth.service';
import { DeclarationData, DeclarationType } from '@/types/declaration';
import { MatIconModule } from '@angular/material/icon';

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
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  centerLat = 48.8566; // Paris default
  centerLng = 2.3522;
  zoomLevel = 12;
  markers: MapMarker[] = [];
  selectedMarker: (MapMarker & { 
    declarationId: string; 
    declarationType: DeclarationType; 
    category: string; 
    images: any[];
    location: string;
    date: Date;
  }) | null = null;
  
  defaultRouteOrigin: { lat: number; lng: number } | null = null;
  defaultRouteDestination: { lat: number; lng: number } | null = null;
  showDefaultRoute = false;
  
  isLoading = signal(false);
  DeclarationType = DeclarationType;

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const originLat = parseFloat(params['originLat']);
      const originLng = parseFloat(params['originLng']);
      const destinationLat = parseFloat(params['destinationLat']);
      const destinationLng = parseFloat(params['destinationLng']);

      if (!isNaN(originLat) && !isNaN(originLng) && !isNaN(destinationLat) && !isNaN(destinationLng)) {
        // Set default route coordinates
        this.defaultRouteOrigin = { lat: originLat, lng: originLng };
        this.defaultRouteDestination = { lat: destinationLat, lng: destinationLng };
        this.showDefaultRoute = true;

        // Create markers for origin and destination
        this.markers = [
          {
            position: { lat: originLat, lng: originLng },
            title: 'Départ'
          },
          {
            position: { lat: destinationLat, lng: destinationLng },
            title: 'Arrivée'
          }
        ];

        // Center map between origin and destination
        this.centerLat = (originLat + destinationLat) / 2;
        this.centerLng = (originLng + destinationLng) / 2;
      } else {
        // Load user declarations as markers
        this.loadDeclarationsAsMarkers();
      }
    });
  }

  private loadDeclarationsAsMarkers() {
    this.isLoading.set(true);
    this.declarationService.getDeclarations().subscribe({
      next: (declarations) => {
        // Convert declarations to markers
        this.markers = declarations
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
          } as any));

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
      this.selectedMarker = this.markers[markerIndex] as any;
    }
  }

  isMarkerSelected(index: number): boolean {
    if (!this.selectedMarker || !this.markers[index]) return false;
    return (this.markers[index] as any).declarationId === this.selectedMarker.declarationId;
  }

  getMarkerColor(index: number): string {
    const marker = this.markers[index] as any;
    return marker?.icon === 'found' ? '#3b82f6' : '#ea580c';
  }

  getMarkerBgColor(index: number): string {
    const marker = this.markers[index] as any;
    return marker?.icon === 'found' ? 'bg-blue-500' : 'bg-orange-500';
  }

  getMarkerLabel(index: number): string {
    const marker = this.markers[index] as any;
    return marker?.icon === 'found' ? 'T' : 'P';
  }

  viewDetails(declarationId: string) {
    // Navigate to declaration details or open in a modal
    // This can be expanded based on your needs
    console.log('View details for declaration:', declarationId);
  }

  goBack() {
    this.router.navigate(['/tableau-de-bord']);
  }
}

