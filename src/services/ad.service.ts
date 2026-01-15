import { Injectable, inject, Injector, runInInjectionContext } from '@angular/core';
import {Observable, from, map, tap} from 'rxjs';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  docData,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  increment, limit,
} from '@angular/fire/firestore';
import { Ad, CreateAdData, UpdateAdData } from '@/types/ad';
import {log} from "firebase-functions/logger";

@Injectable({
  providedIn: 'root',
})
export class AdService {
  private firestore: Firestore = inject(Firestore);
  private injector = inject(Injector);
  private readonly collectionName = 'ads';

  /**
   * Récupère toutes les publicités
   */
  getAllAds(): Observable<Ad[]> {
    const adsRef = collection(this.firestore, this.collectionName);
    const q = query(adsRef, orderBy('priority', 'desc'));
    return runInInjectionContext(this.injector, () => collectionData(q, { idField: 'id' }) as Observable<Ad[]>);
  }

  /**
   * Récupère les publicités actives
   */
  getActiveAds(): Observable<Ad[]> {
    const adsRef = collection(this.firestore, this.collectionName);
    const now = new Date();
    const q = query(
      adsRef,
      where('isActive', '==', true),
      orderBy('priority', 'desc'),
      limit(20)
    );
    return runInInjectionContext(this.injector, () => (collectionData(q, { idField: 'id' }) as Observable<Ad[]>)).pipe(
      map(ads => {
        const filteredAds = ads.filter(ad => {
          const startDate = this.toDate(ad?.startDate as Timestamp);
          const endDate = this.toDate(ad?.endDate as Timestamp);
          return startDate <= now && now <= endDate;
        });
        return filteredAds.length>0?filteredAds: ads;
      })
    );
  }

  /**
   * Récupère une publicité par son ID
   */
  getAdById(id: string): Observable<Ad | undefined> {
    const adRef = doc(this.firestore, `${this.collectionName}/${id}`);
    return docData(adRef, { idField: 'id' }) as Observable<Ad | undefined>;
  }

  /**
   * Crée une nouvelle publicité
   */
  createAd(adData: CreateAdData): Observable<string> {
    console.log('📢 Creating new ad:', adData.title);
    const adsRef = collection(this.firestore, this.collectionName);
    const newAd = {
      ...adData,
      createdAt: Timestamp.now(),
      impressions: 0,
      clicks: 0,
    };
    return from(addDoc(adsRef, newAd).then(docRef => {
      console.log('✅ Ad created with ID:', docRef.id);
      return docRef.id;
    }));
  }

  /**
   * Met à jour une publicité
   */
  updateAd(id: string, data: UpdateAdData): Observable<void> {
    console.log('📢 Updating ad:', id);
    const adRef = doc(this.firestore, `${this.collectionName}/${id}`);
    return from(updateDoc(adRef, {
      ...data,
      updatedAt: Timestamp.now(),
    }).then(() => console.log('✅ Ad updated:', id)));
  }

  /**
   * Supprime une publicité
   */
  deleteAd(id: string): Observable<void> {
    console.log('📢 Deleting ad:', id);
    const adRef = doc(this.firestore, `${this.collectionName}/${id}`);
    return from(deleteDoc(adRef).then(() => console.log('✅ Ad deleted:', id)));
  }

  /**
   * Incrémente le compteur d'impressions
   */
  recordImpression(id: string): Observable<void> {
    console.log('📊 Recording impression for ad ID:', id);
    const adRef = doc(this.firestore, `${this.collectionName}/${id}`);
    return from(updateDoc(adRef, {
      impressions: increment(1),
    }).then(() => console.log('✅ Impression recorded for ad:', id)));
  }

  /**
   * Incrémente le compteur de clics
   */
  recordClick(id: string): Observable<void> {
    console.log('👆 Recording click for ad ID:', id);
    const adRef = doc(this.firestore, `${this.collectionName}/${id}`);
    return from(updateDoc(adRef, {
      clicks: increment(1),
    }).then(() => console.log('✅ Click recorded for ad:', id)));
  }

  /**
   * Récupère une publicité aléatoire parmi les actives
   */
  getRandomAd(): Observable<Ad | null> {
    return this.getActiveAds().pipe(
      map(ads => {
        if (ads.length === 0) return null;
        // Sélection pondérée par priorité
        const totalWeight = ads.reduce((sum, ad) => sum + ad.priority, 0);
        let random = Math.random() * totalWeight;
        for (const ad of ads) {
          random -= ad.priority;
          if (random <= 0) return ad;
        }
        return ads[0];
      })
    );
  }

  /**
   * Convertit un Timestamp Firestore en Date
   */
  private toDate(value: Date | Timestamp): Date {
    if (value instanceof Timestamp) {
      return value.toDate();
    }
    return value;
  }
}
