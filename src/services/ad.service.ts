import { Injectable, inject } from '@angular/core';
import { Observable, from, map } from 'rxjs';
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
  increment,
} from '@angular/fire/firestore';
import { Ad, CreateAdData, UpdateAdData } from '@/types/ad';

@Injectable({
  providedIn: 'root',
})
export class AdService {
  private firestore: Firestore = inject(Firestore);
  private readonly collectionName = 'ads';

  /**
   * Récupère toutes les publicités
   */
  getAllAds(): Observable<Ad[]> {
    const adsRef = collection(this.firestore, this.collectionName);
    const q = query(adsRef, orderBy('priority', 'desc'));
    return collectionData(q, { idField: 'id' }) as Observable<Ad[]>;
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
      orderBy('priority', 'desc')
    );
    return (collectionData(q, { idField: 'id' }) as Observable<Ad[]>).pipe(
      map(ads => ads.filter(ad => {
        const startDate = ad.startDate ? this.toDate(ad.startDate) : null;
        const endDate = ad.endDate ? this.toDate(ad.endDate) : null;
        
        if (startDate && now < startDate) return false;
        if (endDate && now > endDate) return false;
        return true;
      }))
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
    const adsRef = collection(this.firestore, this.collectionName);
    const newAd = {
      ...adData,
      createdAt: Timestamp.now(),
      impressions: 0,
      clicks: 0,
    };
    return from(addDoc(adsRef, newAd).then(docRef => docRef.id));
  }

  /**
   * Met à jour une publicité
   */
  updateAd(id: string, data: UpdateAdData): Observable<void> {
    const adRef = doc(this.firestore, `${this.collectionName}/${id}`);
    return from(updateDoc(adRef, {
      ...data,
      updatedAt: Timestamp.now(),
    }));
  }

  /**
   * Supprime une publicité
   */
  deleteAd(id: string): Observable<void> {
    const adRef = doc(this.firestore, `${this.collectionName}/${id}`);
    return from(deleteDoc(adRef));
  }

  /**
   * Incrémente le compteur d'impressions
   */
  recordImpression(id: string): Observable<void> {
    const adRef = doc(this.firestore, `${this.collectionName}/${id}`);
    return from(updateDoc(adRef, {
      impressions: increment(1),
    }));
  }

  /**
   * Incrémente le compteur de clics
   */
  recordClick(id: string): Observable<void> {
    const adRef = doc(this.firestore, `${this.collectionName}/${id}`);
    return from(updateDoc(adRef, {
      clicks: increment(1),
    }));
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
