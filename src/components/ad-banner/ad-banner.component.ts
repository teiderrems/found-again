/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
import { Component, OnInit, OnDestroy, inject, signal, computed, Input, ElementRef, ViewChild } from '@angular/core';
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
    <div *ngIf="shouldShow()" #banner class="ad-banner" role="region" aria-label="Bannière publicitaire" [attr.data-position]="position" [class.visible]="!isHidden()" aria-live="polite"
      tabindex="0"
      (mouseenter)="pauseRotation(true)"
      (mouseleave)="pauseRotation(false)"
      (focusin)="pauseRotation(true)"
      (focusout)="pauseRotation(false)"
      (keydown.escape)="hideAd()">

      <div class="ad-inner flex items-center gap-4 px-4 py-3">

        <div class="ad-badge" aria-hidden="true">
          <span class="badge">Publicité</span>
        </div>

        <div class="ad-content flex-1 min-w-0">
          <ng-container *ngIf="currentAd() as ad; else emptyState">
            <a class="ad-body flex items-center gap-4" [href]="ad?.linkUrl || null" target="_blank" rel="noopener noreferrer" (click)="onAdClick($event)">
                 <div class="media shrink-0">
                   <img *ngIf="ad?.imageUrl; else maybeVideo" [src]="ad?.imageUrl" [alt]="ad?.title" class="ad-image" loading="lazy" />
                   <ng-template #maybeVideo>
                     <iframe *ngIf="ad?.videoUrl; else placeholder" [src]="getSafeVideoUrl(ad?.videoUrl)" class="ad-iframe" title="Vidéo publicitaire" loading="lazy"></iframe>
                   </ng-template>
                   <ng-template #placeholder>
                     <div class="ad-placeholder-icon" aria-hidden="true">📣</div>
                   </ng-template>
                 </div>

                 <div class="text min-w-0">
                   <div class="title truncate font-medium">{{ ad?.title || 'Contenu sponsorisé' }}</div>
                   <div class="desc truncate text-sm text-gray-600 dark:text-gray-300">{{ ad?.description }}</div>
                 </div>
            </a>
           </ng-container>

          <ng-template #emptyState>
            <div class="ad-empty text-sm text-gray-700 dark:text-gray-300 truncate">Aucune publicité configurée. Contactez un administrateur pour en ajouter.</div>
          </ng-template>
        </div>

        <div class="ad-actions flex items-center gap-3 ml-auto">
          <a routerLink="/premium" class="cta-upgrade inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold" title="Supprimer les pubs">
            <mat-icon class="star" aria-hidden="true">star</mat-icon>
            <span>Supprimer les pubs</span>
          </a>

          <button class="btn-hide text-sm text-blue-600 hover:underline" (click)="hidePermanently()" title="Ne plus afficher">Ne plus afficher</button>

          <button mat-icon-button aria-label="Fermer la publicité" (click)="hideAd()" class="close-btn">
            <mat-icon aria-hidden="true">close</mat-icon>
          </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .ad-banner {
      max-width: 760px;
      margin: 0 auto 1rem;
      border-radius: 14px;
      overflow: visible;
      transition: transform 280ms cubic-bezier(.2,.9,.2,1), opacity 220ms ease, box-shadow 200ms ease;
      transform-origin: center;
      outline: none;
    }

    /* Hover / focus visual lift */
    .ad-banner:focus-visible .ad-inner,
    .ad-banner:hover .ad-inner {
      transform: translateY(-4px);
      box-shadow: 0 12px 30px rgba(2,6,23,0.12);
    }

    .ad-banner:focus-visible { box-shadow: 0 6px 20px rgba(16,24,40,0.06); border-radius: 14px; }

    /* position déclenchée depuis l'attribut data-position (top/bottom) */
    .ad-banner[data-position="bottom"] {
      position: fixed;
      bottom: 1rem;
      left: 50%;
      transform: translateX(-50%) translateY(12px);
      z-index: 60;
      width: calc(100% - 2rem);
      pointer-events: none;
      opacity: 0;
    }
    .ad-banner[data-position="top"] {
      position: fixed;
      top: 1rem;
      left: 50%;
      transform: translateX(-50%) translateY(-12px);
      z-index: 60;
      width: calc(100% - 2rem);
      pointer-events: none;
      opacity: 0;
    }

    /* Lorsque visible : rendre interactif */
    .ad-banner.visible[data-position="bottom"], .ad-banner.visible[data-position="top"] {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
      pointer-events: auto;
      box-shadow: 0 10px 30px rgba(2,6,23,0.08);
    }

    .ad-inner {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: #f8fafc; /* subtle near-white gray */
      border: 1px solid rgba(15,23,42,0.06);
      border-radius: 12px;
      padding: 0.6rem 0.8rem;
      box-shadow: 0 6px 18px rgba(28,36,50,0.06);
      transition: transform 220ms ease, box-shadow 220ms ease;
    }

    .badge {
      display: inline-block;
      background: rgba(15,23,42,0.85);
      color: white;
      padding: 4px 8px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.2px;
    }

    .ad-image { width: 84px; height: 56px; object-fit: cover; border-radius: 8px; }
    .ad-iframe { width: 120px; height: 70px; border-radius: 8px; border: 0; }
    .ad-placeholder-icon { width: 64px; height: 48px; display:inline-flex; align-items:center; justify-content:center; border-radius:8px; background:rgba(0,0,0,0.04); }

    .ad-content .title { color: #0f172a; }
    .ad-content .desc { color: #475569; }

    .cta-upgrade {
      background: linear-gradient(90deg,#16a34a,#10b981);
      color: white;
      box-shadow: 0 4px 12px rgba(16,185,129,0.12);
      pointer-events: auto;
      padding-left: 10px;
      padding-right: 10px;
    }
    .cta-upgrade .star { font-size: 16px; color: white; }

    .ad-actions { margin-left: auto; display:flex; align-items:center; gap:0.5rem; }

    .btn-hide { background: transparent; border: none; cursor: pointer; pointer-events: auto; color: #1d4ed8; font-weight: 600; }

    .close-btn { pointer-events: auto; }

    .ad-empty { text-align: center; }

    /* Responsive */
    @media (max-width: 640px) {
      .ad-inner { padding: 0.5rem; gap: 0.6rem; }
      .ad-image { width: 64px; height: 44px; }
      .ad-iframe { width: 90px; height: 54px; }
      .cta-upgrade { padding: 6px 10px; font-size: 13px; }
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

  currentAd = signal<Ad | null>(null);
  currentIndex = signal(0);
  totalAds = signal(0);
  isPremium = this.subscriptionService.isPremium;
  isAllowedToShow = signal(false);
  isHidden = signal(false);
  // Paused when user hovers / focuses the banner
  isPaused = signal(false);

  // Permet de masquer définitivement
  private permanentHideKey = 'found:adBanner:hide';
  // permanence tracked as a signal so computed reacts
  private _permanentHidden = signal<boolean>(localStorage.getItem('found:adBanner:hide') === '1');

  // computed to decide whether to show banner (uses new signals)
  shouldShow = computed(() => this.isAllowedToShow() && !this._permanentHidden() && !this.isPremium());

  private ads = signal<Ad[]>([]);
  private rotationSubscription?: Subscription;
  private adsSubscription?: Subscription;

  ngOnInit(): void {
    // Debug
    console.debug('AdBanner: init, position=', this.position);

    this.loadPersistentHide();

    // Charger uniquement si l'utilisateur est standard (non-admin) et non premium
    this.authService.getCurrentUserProfile().pipe(take(1)).subscribe(profile => {
      const role = profile?.role || 'standard';
      if (role === 'admin') {
        console.debug('AdBanner: user is admin — not showing banner');
        this.isAllowedToShow.set(false);
        return;
      }

      if (!this.isPremium() && !this.isPermanentlyHidden()) {
        this.loadAds();
        this.isAllowedToShow.set(true);
      } else {
        this.isAllowedToShow.set(false);
      }
    });
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
        this.ads.set(ads);
        this.currentIndex.set(0);
        this.totalAds.set(ads.length);
        if (ads.length > 0 && !this.isPermanentlyHidden()) {
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

  // override hideAd to also set a short-lived collapse animation
  hideAd(): void {
    console.debug('AdBanner: hideAd invoked');
    this.isHidden.set(true);
    this._permanentHidden.set(true);
    localStorage.removeItem(this.permanentHideKey);

    // Réafficher après 5 minutes
    setTimeout(() => {
      this.isHidden.set(false);
    }, 5 * 60 * 1000);
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
