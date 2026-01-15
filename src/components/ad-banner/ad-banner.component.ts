import { Component, OnInit, OnDestroy, inject, signal, computed, Input, ElementRef, ViewChild, effect } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { AdService } from '@/services/ad.service';
import { SubscriptionService } from '@/services/subscription.service';
import { AuthService } from '@/services/auth.service';
import { Ad } from '@/types/ad';
import { interval, Subscription } from 'rxjs';
import { take } from 'rxjs';

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
    <div *ngIf="shouldShow()" #banner
      class="max-w-7xl mx-auto mb-4 sm:mb-6 rounded-2xl sm:rounded-3xl overflow-hidden transition-all duration-500 ease-out origin-center outline-none
             focus-within:shadow-2xl focus-within:rounded-3xl focus-within:ring-2 focus-within:ring-blue-500/20
             pointer-events-auto
             bg-gradient-to-br from-white via-slate-50 to-blue-50/30 border border-slate-200/50 backdrop-blur-sm"
      [class.fixed-bottom]="position === 'bottom' && !isHidden()"
      [class.fixed-top]="position === 'top' && !isHidden()"
      [class.visible]="!isHidden() && position !== 'sidebar'"
      role="region"
      aria-label="Bannière publicitaire"
      [attr.data-position]="position"
      aria-live="polite"
      tabindex="0"
      (mouseenter)="pauseRotation(true)"
      (mouseleave)="pauseRotation(false)"
      (focusin)="pauseRotation(true)"
      (focusout)="pauseRotation(false)"
      (keydown.escape)="onEscape($event)">

      <!-- Indicateurs de rotation -->
      <div *ngIf="totalAds() > 1" class="absolute top-2 sm:top-3 left-1/2 -translate-x-1/2 flex gap-1 sm:gap-1.5 z-10">
        <div *ngFor="let indicator of getAdIndicators(); let i = index"
             class="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all duration-300"
             [class]="i === currentIndex() ? 'bg-blue-500 scale-125' : 'bg-slate-300 hover:bg-slate-400'">
        </div>
      </div>

      <div class="ad-inner relative flex flex-col sm:flex-row sm:items-center min-h-32 sm:min-h-35 gap-3 sm:gap-4 lg:gap-6 px-3 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-5 bg-linear-to-r from-transparent via-white/80 to-blue-50/50">

        <!-- Badge Publicité - Masqué sur mobile -->
        <div class="ad-badge shrink-0 hidden sm:block">
          <div class="inline-flex items-center gap-2 bg-linear-to-r from-blue-600 to-indigo-600 text-white px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs sm:text-sm font-semibold shadow-lg">
            <svg class="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"/>
            </svg>
            <span class="hidden lg:inline">Publicité</span>
            <span class="lg:hidden">Pub</span>
          </div>
        </div>

        <!-- Contenu principal -->
        <div class="ad-content flex-1 min-w-0 pointer-events-auto order-2 sm:order-1">
          <ng-container *ngIf="currentAd() as ad; else emptyState">
            <a class="ad-body group flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 lg:gap-5 p-3 sm:p-4 -m-3 sm:-m-4 rounded-xl sm:rounded-2xl transition-all duration-300 hover:bg-white/60 hover:shadow-lg hover:scale-[1.01] sm:hover:scale-[1.02]"
               [href]="ad?.linkUrl || null"
               target="_blank"
               rel="noopener noreferrer"
               (click)="onAdClick($event)">

              <!-- Média (image/vidéo) -->
              <div class="media flex-shrink-0 relative self-start sm:self-center">
                <div class="relative overflow-hidden rounded-lg sm:rounded-xl shadow-md group-hover:shadow-xl transition-shadow duration-300">
                  <img *ngIf="ad?.imageUrl; else maybeVideo"
                       [src]="ad?.imageUrl"
                       [alt]="ad?.title"
                       class="ad-image w-16 h-12 sm:w-20 sm:h-14 lg:w-24 lg:h-16 object-cover transition-transform duration-300 group-hover:scale-105"
                       loading="lazy" />
                  <ng-template #maybeVideo>
                    <iframe *ngIf="ad?.videoUrl; else placeholder"
                            [src]="getSafeVideoUrl(ad?.videoUrl)"
                            class="ad-iframe w-16 h-12 sm:w-20 sm:h-14 lg:w-24 lg:h-16 rounded-lg sm:rounded-xl border-0"
                            title="Vidéo publicitaire"
                            loading="lazy"></iframe>
                  </ng-template>
                  <ng-template #placeholder>
                    <div class="ad-placeholder w-16 h-12 sm:w-20 sm:h-14 lg:w-24 lg:h-16 flex items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 text-2xl sm:text-3xl shadow-inner">
                      📢
                    </div>
                  </ng-template>

                  <!-- Overlay de clic -->
                  <div class="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg sm:rounded-xl"></div>
                </div>
              </div>

              <!-- Texte -->
              <div class="text flex-1 min-w-0">
                <div class="title text-base sm:text-lg font-bold text-slate-900 group-hover:text-blue-900 transition-colors duration-300 leading-tight mb-1">
                  {{ ad?.title || 'Contenu sponsorisé' }}
                </div>
                <div class="desc text-xs sm:text-sm text-slate-600 group-hover:text-slate-700 transition-colors duration-300 leading-relaxed line-clamp-2 sm:line-clamp-1">
                  {{ ad?.description }}
                </div>

                <!-- Indicateur de lien - Masqué sur mobile pour économiser l'espace -->
                <div class="flex items-center gap-1 mt-1.5 sm:mt-2 text-xs text-blue-600 font-medium hidden sm:flex">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                  </svg>
                  <span>En savoir plus</span>
                </div>
              </div>
            </a>
          </ng-container>

          <ng-template #emptyState>
            <div class="ad-empty flex items-center justify-center py-6 sm:py-8">
              <div class="flex items-center gap-2 sm:gap-3 text-slate-500">
                <div class="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-slate-300 border-t-slate-500"></div>
                <span class="text-xs sm:text-sm font-medium">Chargement...</span>
              </div>
            </div>
          </ng-template>
        </div>

        <!-- Actions - Réorganisées pour mobile -->
        <div class="ad-actions flex items-center justify-between sm:justify-end gap-2 sm:gap-3 shrink-0 order-1 sm:order-2">
          <!-- Badge mobile compact -->
          <div class="sm:hidden">
            <div class="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
              <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"/>
              </svg>
              <span>Pub</span>
            </div>
          </div>

          <a href="/premium"
             class="cta-upgrade group inline-flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg hover:shadow-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 transform hover:scale-105 no-underline"
             title="Supprimer les pubs">
            <svg class="w-3 h-3 sm:w-4 sm:h-4 transition-transform group-hover:rotate-12" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
            <span class="hidden sm:inline">Premium</span>
            <span class="sm:hidden">⭐</span>
          </a>

          <button type="button"
                  aria-label="Fermer la publicité"
                  (click)="hideAd()"
                  class="close-btn w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 transition-all duration-200 hover:scale-110 shadow-sm hover:shadow-md border-none bg-transparent cursor-pointer flex items-center justify-center">
            <svg class="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Effet de brillance animé -->
      <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer pointer-events-none"></div>
    </div>
  `,
  styles: [`
    @keyframes shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }

    .animate-shimmer {
      animation: shimmer 3s infinite;
    }

    /* Styles pour les indicateurs */
    .ad-indicators {
      position: absolute;
      top: 12px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 6px;
      z-index: 10;
    }

    .indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      transition: all 0.3s ease;
    }

    .indicator.active {
      background-color: #3b82f6;
      transform: scale(1.25);
    }

    .indicator.inactive {
      background-color: #cbd5e1;
    }

    .indicator.inactive:hover {
      background-color: #94a3b8;
    }

    /* Utilitaires de troncature de ligne */
    .line-clamp-1 {
      overflow: hidden;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 1;
    }

    .line-clamp-2 {
      overflow: hidden;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
    }

    /* Positionnement fixe */
    .fixed-bottom {
      position: fixed;
      bottom: 1.5rem;
      left: 50%;
      transform: translateX(-50%) translateY(1rem);
      z-index: 50;
      width: calc(100% - 3rem);
      opacity: 0;
    }

    .fixed-top {
      position: fixed;
      top: 1.5rem;
      left: 50%;
      transform: translateX(-50%) translateY(-1rem);
      z-index: 50;
      width: calc(100% - 3rem);
      opacity: 0;
    }

    .visible {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }

    /* Styles responsive pour mobile */
    @media (max-width: 640px) {
      .ad-inner {
        padding: 12px !important;
      }

      .ad-body {
        padding: 12px !important;
        margin: -12px !important;
      }
    }
  `]
})
export class AdBannerComponent implements OnInit, OnDestroy {
  @Input() position: 'top' | 'bottom' | 'sidebar' = 'top';
  @Input() rotationInterval = 30000; // 30 secondes par défaut

  private adService = inject(AdService);
  private subscriptionService = inject(SubscriptionService);
  private authService = inject(AuthService);
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

  currentAd = signal<Ad>({
            id: 'default-ad',
            title: 'Bienvenue sur FoundAgain !',
            description: 'La plateforme pour retrouver vos objets perdus et aider les autres.',
            imageUrl: 'https://via.placeholder.com/300x100/3B82F6/FFFFFF?text=FoundAgain',
            linkUrl: 'https://found-again-4a0e0.firebaseapp.com',
            isActive: true,
            priority: 0,
            createdAt: new Date(),
            impressions: 0,
            clicks: 0
          });
  currentIndex = signal(0);
  totalAds = signal(0);
  isPremium = this.subscriptionService.isPremium;
  isHidden = signal(false);
  // Paused when user hovers / focuses the banner
  isPaused = signal(false);

  // Permet de masquer définitivement
  private permanentHideKey = 'found:adBanner:hide';
  // permanence tracked as a signal so computed reacts
  private _permanentHidden = signal<boolean>(localStorage.getItem('found:adBanner:hide') === '1');

  // computed to decide whether to show banner (uses new signals)
  shouldShow = computed(() => !this.isHidden() && !this._permanentHidden() && !this.isPremium());

  private ads = signal<Ad[]>([]);
  private rotationSubscription?: Subscription;
  private adsSubscription?: Subscription;


  constructor() {
    effect(() => {
      this.isHidden.set(this._permanentHidden());
    });
  }

  ngOnInit(): void {
    this.loadPersistentHide();

    // Charger uniquement si l'utilisateur est standard (non-admin) et non premium
    this.authService.getCurrentUserProfile().pipe(take(1)).subscribe(profile => {
      this.loadAds();
    });
  }

  ngOnDestroy(): void {
    this.rotationSubscription?.unsubscribe();
    this.adsSubscription?.unsubscribe();
  }

  private loadAds(): void {
    this.adsSubscription = this.adService.getActiveAds().subscribe({
      next: (ads) => {
        if (ads.length === 0) {
          this.totalAds.set(1);
        } else {
          this.ads.set(ads);
          this.totalAds.set(ads.length);
        }

        this.currentIndex.set(0);

        if (this.totalAds() > 0 && !this.isPermanentlyHidden()) {
          this.showRandomAd();
          this.startRotation();
        }
      },
      error: (error) => console.error('Erreur lors du chargement des publicités:', error)
    });
  }

  @ViewChild('banner', { static: false }) bannerEl?: ElementRef<HTMLElement>;

  // Utility: logs current banner element state

  private showRandomAd(): void {
    if (this.ads().length === 0) return;

    // Sélection pondérée par priorité
    const totalWeight = this.ads().reduce((sum, ad) => sum + ad.priority, 0);
    this.currentAd.set(this.ads()[0]);
    setTimeout(() => {
      this.currentAd.set(this.ads()[this.currentIndex()]);
      // Safely increment index (avoid prev++ bug and modulo by zero)
      if (this.ads().length > 0) {
        this.currentIndex.update(prev => (prev + 1) % this.ads().length);
      }
    }, 1000);
    this.recordImpression();
  }

  goToAd(index: number): void {
    if (index < 0 || index >= this.ads().length) return;
    this.currentIndex.set(index);
    this.currentAd.set(this.ads()[index]);
    this.recordImpression();
  }

  // Contrôle la mise en pause (survol / focus)
  pauseRotation(paused: boolean) {
    this.isPaused.set(paused);
  }

  hideAd(event?: Event | string): void {
    const reason = typeof event === 'string' ? event : (event ? event.type : 'programmatic');
    console.debug(`AdBanner: hideAd invoked - hiding banner (reason: ${reason})`, { time: new Date().toISOString(), stack: new Error().stack });
    this.isHidden.set(true);
  }

  hidePermanently(event?: Event | string): void {
    const reason = typeof event === 'string' ? event : (event ? event.type : 'programmatic');
    console.debug(`AdBanner: hidePermanently invoked - hiding permanently (reason: ${reason})`, { time: new Date().toISOString(), stack: new Error().stack });
    localStorage.setItem(this.permanentHideKey, '1');
    this._permanentHidden.set(true);
    this.isHidden.set(true);
  }

  onEscape(event: Event) {
    // Only respond to Escape when the banner itself has focus (prevents global Esc from closing banner)
    if (this.bannerEl && document.activeElement === this.bannerEl.nativeElement) {
      this.hideAd(event);
    }
  }

  isPermanentlyHidden(): boolean {
    return this._permanentHidden();
  }

  private loadPersistentHide(): void {
    if (this._permanentHidden()) {
      this.isHidden.set(true);
    }
  }

  private recordImpression(): void {
    // Temporairement désactivé pour déboguer les écritures infinies
    // const ad = this.currentAd();
    // if (ad?.id && !this.isPermanentlyHidden() && this.authService.getCurrentUserId()) {
    //   console.log('👁️ Recording impression for ad:', ad.id);
    //   // protection: non bloquant
    //   this.adService.recordImpression(ad.id).subscribe({ error: (e) => console.debug('Impression record failed', e) });
    // }
  }

  private startRotation(): void {
    // Éviter les subscriptions multiples
    if (this.rotationSubscription) {
      return;
    }
    
    if (this.ads().length <= 1) return;

    this.rotationSubscription = interval(this.rotationInterval).subscribe(() => {
      // Ne pas changer d'annonce si l'utilisateur a masqué temporairement ou si on est en pause (survol/focus)
      if (!this.isHidden() && !this.isPaused()) {
        this.nextAd();
      }
    });
  }

  private nextAd(): void {
    if (this.ads().length === 0) return;

    const nextIndex = (this.currentIndex() + 1) % this.ads().length;
    this.currentIndex.set(nextIndex);
    this.currentAd.set(this.ads()[nextIndex]);
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
