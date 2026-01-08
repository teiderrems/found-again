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
      class=" max-w-190 mx-auto mb-4 rounded-2xl overflow-visible transition-all duration-700 ease-out origin-center outline-none
             focus-within:shadow-lg focus-within:rounded-2xl
             {{ position === 'bottom' ? 'fixed bottom-4 left-1/2 -translate-x-1/2 translate-y-3 z-60 w-[calc(100%-2rem)] pointer-events-none opacity-0' : '' }}
             {{ position === 'top' ? 'fixed top-4 left-1/2 -translate-x-1/2 -translate-y-3 z-60 w-[calc(100%-2rem)] pointer-events-none opacity-0' : '' }}
             {{ (!isHidden() && position !== 'sidebar') ? 'translate-x-[-50%] translate-y-0 opacity-100 pointer-events-auto shadow-xl' : '' }}"
      role="region"
      aria-label="Bannière publicitaire"
      [attr.data-position]="position"
      [class.visible]="!isHidden()"
      aria-live="polite"
      tabindex="0"
      (mouseenter)="pauseRotation(true)"
      (mouseleave)="pauseRotation(false)"
      (focusin)="pauseRotation(true)"
      (focusout)="pauseRotation(false)"
      (keydown.escape)="hideAd()">

      <div class="ad-inner flex items-center gap-4 px-4 py-3 sm:px-2 sm:py-2 sm:gap-2.5 bg-slate-50 border border-slate-200/6 rounded-xl shadow-lg transition-all duration-300 ease-out hover:shadow-2xl hover:-translate-y-1">

        <div class="ad-badge hidden sm:block">
          <span class="badge inline-block bg-slate-800/85 text-white px-2 py-1 rounded-lg text-xs font-semibold tracking-wide">Publicité</span>
        </div>

        <div class="ad-content flex-1 min-w-0">
          <ng-container *ngIf="currentAd() as ad; else emptyState">
            <a class="ad-body flex items-center gap-4 text-slate-900 hover:text-slate-700 transition-colors"
               [href]="ad?.linkUrl || null"
               target="_blank"
               rel="noopener noreferrer"
               (click)="onAdClick($event)">
                 <div class="media shrink-0">
                   <img *ngIf="ad?.imageUrl; else maybeVideo"
                        [src]="ad?.imageUrl"
                        [alt]="ad?.title"
                        class="ad-image w-21 h-14 sm:w-16 sm:h-11 object-cover rounded-lg"
                        loading="lazy" />
                   <ng-template #maybeVideo>
                     <iframe *ngIf="ad?.videoUrl; else placeholder"
                             [src]="getSafeVideoUrl(ad?.videoUrl)"
                             class="ad-iframe w-30 h-17.5 sm:w-22.5 sm:h-13.5 rounded-lg border-0"
                             title="Vidéo publicitaire"
                             loading="lazy"></iframe>
                   </ng-template>
                   <ng-template #placeholder>
                     <div class="ad-placeholder-icon w-16 h-12 flex items-center justify-center rounded-lg bg-black/4 text-2xl">📣</div>
                   </ng-template>
                 </div>

                 <div class="text min-w-0">
                   <div class="title truncate font-medium text-slate-900">{{ ad?.title || 'Contenu sponsorisé' }}</div>
                   <div class="desc truncate text-sm text-slate-600 dark:text-slate-300">{{ ad?.description }}</div>
                 </div>
            </a>
           </ng-container>

          <ng-template #emptyState>
            <div class="ad-empty text-sm text-slate-700 dark:text-slate-300 text-center truncate">Chargement des publicités...</div>
          </ng-template>
        </div>

        <div class="ad-actions ml-auto flex items-center gap-3">
          <a routerLink="/premium"
             class="cta-upgrade inline-flex items-center gap-2 px-2.5 py-1.5 sm:px-2.5 sm:py-1.5 rounded-md text-sm sm:text-xs font-semibold bg-linear-to-r from-green-500 to-emerald-600 text-white shadow-md hover:shadow-lg transition-all duration-200 pointer-events-auto"
             title="Supprimer les pubs">
            <mat-icon class="star text-base sm:text-sm">star</mat-icon>
            <span class="sm:hidden">Supprimer les pubs</span>
            <span class="hidden sm:inline">Premium</span>
          </a>

          <button class="btn-hide text-sm text-blue-600 hover:text-blue-800 underline decoration-blue-600 hover:decoration-blue-800 transition-colors pointer-events-auto border-none bg-transparent cursor-pointer font-semibold"
                  (click)="hidePermanently()"
                  title="Ne plus afficher">
            Ne plus afficher
          </button>

          <button mat-icon-button
                  aria-label="Fermer la publicité"
                  (click)="hideAd()"
                  class="close-btn pointer-events-auto">
            <mat-icon>close</mat-icon>
          </button>
        </div>

      </div>
    </div>
  `,
  styles: []
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
      this.currentIndex.update(prev=>(prev++)%this.ads().length);
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

  hideAd(): void {
    console.debug('AdBanner: hideAd invoked');
    this.isHidden.set(true);
  }

  hidePermanently(): void {
    console.debug('AdBanner: hidePermanently invoked');
    localStorage.setItem(this.permanentHideKey, '1');
    this._permanentHidden.set(true);
    this.isHidden.set(true);
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
    const ad = this.currentAd();
    if (ad?.id && !this.isPermanentlyHidden()) {
      // protection: non bloquant
      this.adService.recordImpression(ad.id).subscribe({ error: (e) => console.debug('Impression record failed', e) });
    }
  }

  private startRotation(): void {
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
