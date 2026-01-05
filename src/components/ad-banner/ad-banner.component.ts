import { Component, OnInit, OnDestroy, inject, signal, Input, ElementRef, ViewChild } from '@angular/core';
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
    @if (!isPremium() && currentAd() && !isPermanentlyHidden()) {
      <div #banner class="ad-banner relative bg-linear-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-lg overflow-hidden shadow-md mb-4" role="region" aria-label="Bannière publicitaire" [attr.data-position]="position" [class.visible]="!isHidden()">
           role="region" aria-label="Bannière publicitaire" [attr.data-position]="position">

        <!-- Badge Publicité -->
        <div class="absolute top-2 left-2 z-20">
          <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-black/60 text-white">
            Publicité
          </span>
        </div>

        <!-- Boutons d'action (masquer & supprimer définitivement) -->
        <div class="absolute top-2 right-2 z-20 flex items-center gap-2">
          <button 
            mat-icon-button
            aria-label="Masquer la publicité temporairement"
            class="text-gray-600 dark:text-gray-300 hover:bg-black/5 p-1 rounded"
            (click)="hideAd()"
            title="Masquer cette publicité">
            <mat-icon style="font-size: 18px;">close</mat-icon>
          </button>
          <button
            mat-button
            aria-label="Ne plus afficher cette publicité"
            class="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
            (click)="hidePermanently()">
            Ne plus afficher
          </button>
        </div>

        <!-- Lien vers premium -->
        <a 
          routerLink="/premium"
          class="absolute top-2 right-36 z-10 text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
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
              <div class="shrink-0 w-full sm:w-56 h-36 sm:h-36 flex items-center justify-center overflow-hidden rounded">
                <iframe
                  [src]="getSafeVideoUrl(currentAd()?.videoUrl)"
                  width="300"
                  height="170"
                  frameborder="0"
                  allowfullscreen
                  loading="lazy"
                  class="rounded w-full h-full object-cover bg-black"
                  title="Vidéo publicitaire"
                  origin="anonymous"
                ></iframe>
              </div>
            } @else if (currentAd()?.imageUrl) {
              <div class="shrink-0 w-full sm:w-40 h-28 overflow-hidden rounded">
                <img 
                  [src]="currentAd()?.imageUrl" 
                  [alt]="currentAd()?.title"
                  class="w-full h-full object-cover"
                  loading="lazy">
              </div>
            }
            <div class="flex-1 text-center sm:text-left">
              <h3 class="font-semibold text-gray-800 dark:text-white text-base sm:text-lg">
                {{ currentAd()?.title }}
              </h3>
              <p class="text-gray-600 dark:text-gray-300 text-sm mt-1 line-clamp-2">
                {{ currentAd()?.description }}
              </p>
            </div>
            @if (currentAd()?.linkUrl) {
              <div class="shrink-0">
                <button class="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                  En savoir plus
                  <mat-icon class="ml-2" style="font-size: 16px; width: 16px; height: 16px;">arrow_forward</mat-icon>
                </button>
              </div>
            }
          </div>
        </a>

        <!-- Indicateur de rotation (si plusieurs pubs) -->
        @if (totalAds() > 1) {
          <div class="flex justify-center gap-2 pb-2">
            @for (i of getAdIndicators(); track i) {
              <button 
                aria-label="Afficher la publicité {{ i + 1 }}"
                class="w-2.5 h-2.5 rounded-full transition-colors opacity-80"
                [class.bg-blue-600]="i === currentIndex()"
                [class.bg-gray-400]="i !== currentIndex()"
                (click)="goToAd(i)">
              </button>
            }
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .ad-banner {
      transition: transform 320ms cubic-bezier(.2,.9,.2,1), opacity 260ms ease, box-shadow 200ms ease;
      will-change: transform, opacity;
      max-width: 720px;
      margin-left: auto;
      margin-right: auto;
      border-radius: 12px;
      overflow: hidden;
    }

    /* Fixed positioning when used as bottom/top banner */
    .ad-banner[data-position="bottom"] {
      position: fixed;
      bottom: 1rem;
      left: 50%;
      transform: translateX(-50%) translateY(12px);
      z-index: 60;
      width: calc(100% - 2rem);
      max-width: 720px;
      box-shadow: 0 10px 30px rgba(2,6,23,0.08);
      opacity: 0; pointer-events: none;
    }

    .ad-banner[data-position="top"] {
      position: fixed;
      top: 1rem;
      left: 50%;
      transform: translateX(-50%) translateY(-12px);
      z-index: 60;
      width: calc(100% - 2rem);
      max-width: 720px;
      box-shadow: 0 10px 30px rgba(2,6,23,0.08);
      opacity: 0; pointer-events: none;
    }

    /* When visible */
    .ad-banner[data-position="bottom"].visible,
    .ad-banner[data-position="top"].visible {
      transform: translateX(-50%) translateY(0);
      opacity: 1; pointer-events: auto;
    }

    /* Media responsiveness */
    @media (min-width: 1024px) {
      .ad-banner[data-position="sidebar"] {
        position: sticky;
        top: 6rem;
        width: 320px;
        margin-left: 0;
        margin-right: 0;
      }
    }

    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    /* Small helpers */
    .ad-banner .shrink-0 img { display: block; }
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

  // Permet de masquer définitivement
  private permanentHideKey = 'found:adBanner:hide';

  private ads: Ad[] = [];
  private rotationSubscription?: Subscription;
  private adsSubscription?: Subscription;

  ngOnInit(): void {
    // Debug
    console.debug('AdBanner: init, position=', this.position);
    
    this.loadPersistentHide();
    this.loadAds();

    // Slight delay to log view state (ViewChild may not be ready immediately)
    setTimeout(() => console.debug('AdBanner: view init, isPremium=', this.isPremium(), 'permanentlyHidden=', this.isPermanentlyHidden(), 'isHidden=', this.isHidden()), 150);
  }

  ngOnDestroy(): void {
    this.rotationSubscription?.unsubscribe();
    this.adsSubscription?.unsubscribe();
  }

  private loadAds(): void {
    this.adsSubscription = this.adService.getActiveAds().subscribe({
      next: (ads) => {
        console.debug('AdBanner: loaded ads count=', ads.length, 'isPremium=', this.isPremium(), 'permanentlyHidden=', this.isPermanentlyHidden(), 'isHidden=', this.isHidden());
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

  @ViewChild('banner', { static: false }) bannerEl?: ElementRef<HTMLElement>;

  // Utility: logs current banner element state
  private debugBannerEl(): void {
    const present = !!this.bannerEl || !!document.querySelector('app-ad-banner .ad-banner');
    console.debug('AdBanner: bannerEl present=', present, 'position=', this.position);
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
        console.debug('AdBanner: showRandomAd -> index=', i, 'id=', this.ads[i]?.id);
        this.recordImpression();
        return;
      }
    }

    this.currentAd.set(this.ads[0]);
    this.currentIndex.set(0);
    this.recordImpression();
  }

  goToAd(index: number): void {
    if (index < 0 || index >= this.ads.length) return;
    this.currentIndex.set(index);
    this.currentAd.set(this.ads[index]);
    this.recordImpression();
  }

  hideAd(): void {
    console.debug('AdBanner: hideAd invoked');
    this.isHidden.set(true);

    // Réafficher après 5 minutes
    setTimeout(() => {
      this.isHidden.set(false);
    }, 5 * 60 * 1000);
  }

  hidePermanently(): void {
    console.debug('AdBanner: hidePermanently invoked');
    localStorage.setItem(this.permanentHideKey, '1');
    this.isHidden.set(true);
  }

  isPermanentlyHidden(): boolean {
    return localStorage.getItem(this.permanentHideKey) === '1';
  }

  private loadPersistentHide(): void {
    if (this.isPermanentlyHidden()) {
      this.isHidden.set(true);
    }
  }

  private recordImpression(): void {
    const ad = this.currentAd();
    if (ad?.id) {
      // protection: non bloquant
      this.adService.recordImpression(ad.id).subscribe({ error: (e) => console.debug('Impression record failed', e) });
    }
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

  getAdIndicators(): number[] {
    return Array.from({ length: this.totalAds() }, (_, i) => i);
  }
}
