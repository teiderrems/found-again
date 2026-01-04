import { Component, OnInit, OnDestroy, inject, signal, Input } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { AdService } from '@/services/ad.service';
import { SubscriptionService } from '@/services/subscription.service';
import { Ad } from '@/types/ad';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-ad-banner',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    RouterModule
  ],
  template: `
    @if (!isPremium() && currentAd()) {
      <div class="ad-banner relative bg-linear-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-lg overflow-hidden shadow-md mb-4">
        <!-- Badge Publicité -->
        <div class="absolute top-2 left-2 z-10">
          <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-black/50 text-white">
            Publicité
          </span>
        </div>

        <!-- Bouton pour masquer temporairement -->
        <button 
          mat-icon-button 
          class="absolute top-1 right-1 z-10 text-gray-600 dark:text-gray-300 hover:bg-black/10"
          (click)="hideAd()"
          title="Masquer cette publicité">
          <mat-icon style="font-size: 18px;">close</mat-icon>
        </button>

        <!-- Lien vers premium -->
        <a 
          routerLink="/premium" 
          class="absolute top-2 right-10 z-10 text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
          <mat-icon style="font-size: 14px; width: 14px; height: 14px;">star</mat-icon>
          Supprimer les pubs
        </a>

        <!-- Contenu de la publicité -->
        <a 
          [href]="currentAd()?.linkUrl || '#'" 
          [target]="currentAd()?.linkUrl ? '_blank' : '_self'"
          (click)="onAdClick($event)"
          class="block">
          <div class="flex flex-col sm:flex-row items-center gap-4 p-4">
            @if (currentAd()?.videoUrl) {
              <div class="shrink-0 w-full sm:w-52 h-32 sm:h-28 flex items-center justify-center">
                <iframe
                  [src]="getSafeVideoUrl(currentAd()?.videoUrl)"
                  width="210"
                  height="110"
                  frameborder="0"
                  allowfullscreen
                  class="rounded w-full h-full object-cover bg-black"
                  title="Vidéo publicitaire"
                  origin="anonymous"
                ></iframe>
              </div>
            } @else if (currentAd()?.imageUrl) {
              <div class="shrink-0">
                <img 
                  [src]="currentAd()?.imageUrl" 
                  [alt]="currentAd()?.title"
                  class="w-full sm:w-32 h-20 object-cover rounded"
                  loading="lazy">
              </div>
            }
            <div class="flex-1 text-center sm:text-left">
              <h3 class="font-semibold text-gray-800 dark:text-white text-sm sm:text-base">
                {{ currentAd()?.title }}
              </h3>
              <p class="text-gray-600 dark:text-gray-300 text-xs sm:text-sm mt-1 line-clamp-2">
                {{ currentAd()?.description }}
              </p>
            </div>
            @if (currentAd()?.linkUrl) {
              <div class="shrink-0">
                <span class="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                  En savoir plus
                  <mat-icon class="ml-1" style="font-size: 14px; width: 14px; height: 14px;">arrow_forward</mat-icon>
                </span>
              </div>
            }
          </div>
        </a>

        <!-- Indicateur de rotation (si plusieurs pubs) -->
        @if (totalAds() > 1) {
          <div class="flex justify-center gap-1 pb-2">
            @for (i of getAdIndicators(); track i) {
              <span 
                class="w-1.5 h-1.5 rounded-full transition-colors"
                [class.bg-blue-600]="i === currentIndex()"
                [class.bg-gray-400]="i !== currentIndex()">
              </span>
            }
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .ad-banner {
      transition: opacity 0.3s ease;
    }

    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `]
})
export class AdBannerComponent implements OnInit, OnDestroy {
  @Input() position: 'top' | 'bottom' | 'sidebar' = 'top';
  @Input() rotationInterval = 30000; // 30 secondes par défaut

  private adService = inject(AdService);
  private subscriptionService = inject(SubscriptionService);
  private sanitizer = inject(DomSanitizer);
  getSafeVideoUrl(url?: string): SafeResourceUrl | null {
    if (!url) return null;
    // Gère YouTube et Vimeo
    let embedUrl = url;
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      embedUrl = `https://www.youtube.com/embed/${videoId}`;
    } else if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      embedUrl = `https://www.youtube.com/embed/${videoId}`;
    } else if (url.includes('vimeo.com/')) {
      const videoId = url.split('vimeo.com/')[1]?.split(/[?/]/)[0];
      embedUrl = `https://player.vimeo.com/video/${videoId}`;
    }
    return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  }

  currentAd = signal<Ad | null>(null);
  currentIndex = signal(0);
  totalAds = signal(0);
  isPremium = this.subscriptionService.isPremium;
  isHidden = signal(false);

  private ads: Ad[] = [];
  private rotationSubscription?: Subscription;
  private adsSubscription?: Subscription;

  ngOnInit(): void {
    this.loadAds();
  }

  ngOnDestroy(): void {
    this.rotationSubscription?.unsubscribe();
    this.adsSubscription?.unsubscribe();
  }

  private loadAds(): void {
    this.adsSubscription = this.adService.getActiveAds().subscribe({
      next: (ads) => {
        this.ads = ads;
        this.totalAds.set(ads.length);
        
        if (ads.length > 0) {
          this.showRandomAd();
          this.startRotation();
        }
      },
      error: (error) => console.error('Erreur lors du chargement des publicités:', error)
    });
  }

  private showRandomAd(): void {
    if (this.ads.length === 0) return;

    // Sélection pondérée par priorité
    const totalWeight = this.ads.reduce((sum, ad) => sum + ad.priority, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < this.ads.length; i++) {
      random -= this.ads[i].priority;
      if (random <= 0) {
        this.currentAd.set(this.ads[i]);
        this.currentIndex.set(i);
        this.recordImpression();
        return;
      }
    }

    this.currentAd.set(this.ads[0]);
    this.currentIndex.set(0);
    this.recordImpression();
  }

  private startRotation(): void {
    if (this.ads.length <= 1) return;

    this.rotationSubscription = interval(this.rotationInterval).subscribe(() => {
      if (!this.isHidden()) {
        this.nextAd();
      }
    });
  }

  private nextAd(): void {
    if (this.ads.length === 0) return;

    const nextIndex = (this.currentIndex() + 1) % this.ads.length;
    this.currentIndex.set(nextIndex);
    this.currentAd.set(this.ads[nextIndex]);
    this.recordImpression();
  }

  private recordImpression(): void {
    const ad = this.currentAd();
    if (ad?.id) {
      this.adService.recordImpression(ad.id).subscribe();
    }
  }

  onAdClick(event: Event): void {
    const ad = this.currentAd();
    if (!ad?.linkUrl) {
      event.preventDefault();
      return;
    }

    if (ad.id) {
      this.adService.recordClick(ad.id).subscribe();
    }
  }

  hideAd(): void {
    this.isHidden.set(true);
    // Réafficher après 5 minutes
    setTimeout(() => {
      this.isHidden.set(false);
    }, 5 * 60 * 1000);
  }

  getAdIndicators(): number[] {
    return Array.from({ length: this.totalAds() }, (_, i) => i);
  }
}
