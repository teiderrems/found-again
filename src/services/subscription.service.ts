import { Injectable, inject, signal, Injector, runInInjectionContext } from '@angular/core';
import { Observable, from, map, switchMap, of } from 'rxjs';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  limit,
} from '@angular/fire/firestore';
import {
  Subscription,
  CreateSubscriptionData,
  UpdateSubscriptionData,
  SubscriptionPlan,
  SUBSCRIPTION_PLANS,
  SubscriptionPlanDetails
} from '@/types/subscription';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class SubscriptionService {
  private firestore: Firestore = inject(Firestore);
  private authService = inject(AuthService);
  private injector = inject(Injector);
  private readonly collectionName = 'subscriptions';

  // Signal pour le statut premium de l'utilisateur courant
  private _isPremium = signal<boolean>(false);
  public readonly isPremium = this._isPremium.asReadonly();

  // Signal pour l'abonnement actuel
  private _currentSubscription = signal<Subscription | null>(null);
  public readonly currentSubscription = this._currentSubscription.asReadonly();

  constructor() {
    // Écouter les changements d'utilisateur
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.loadUserSubscription(user.uid);
      } else {
        this._isPremium.set(false);
        this._currentSubscription.set(null);
      }
    });
  }

  /**
   * Charge l'abonnement de l'utilisateur
   */
  private loadUserSubscription(userId: string): void {
    this.getCurrentSubscription(userId).subscribe(subscription => {
      this._currentSubscription.set(subscription);
      this._isPremium.set(this.isSubscriptionActive(subscription));
    });
  }

  /**
   * Récupère l'abonnement actuel de l'utilisateur
   */
  getCurrentSubscription(userId: string): Observable<Subscription | null> {
    const subsRef = collection(this.firestore, this.collectionName);
    const q = query(
      subsRef,
      where('userId', '==', userId),
      where('status', '==', 'active'),
      orderBy('endDate', 'desc'),
      limit(1)
    );
    const data$ = runInInjectionContext(this.injector, () => collectionData(q, { idField: 'id' }) as Observable<Subscription[]>);
    return data$.pipe(
      map(subs => subs.length > 0 ? subs[0] : null)
    );
  }

  /**
   * Récupère tous les abonnements d'un utilisateur
   */
  getUserSubscriptions(userId: string): Observable<Subscription[]> {
    const subsRef = collection(this.firestore, this.collectionName);
    const q = query(
      subsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    return runInInjectionContext(this.injector, () => collectionData(q, { idField: 'id' }) as Observable<Subscription[]>);
  }

  /**
   * Récupère tous les abonnements (pour admin)
   */
  getAllSubscriptions(): Observable<Subscription[]> {
    const subsRef = collection(this.firestore, this.collectionName);
    const q = query(subsRef, orderBy('createdAt', 'desc'));
    return runInInjectionContext(this.injector, () => collectionData(q, { idField: 'id' }) as Observable<Subscription[]>);
  }

  /**
   * Crée un nouvel abonnement
   */
  createSubscription(data: CreateSubscriptionData): Observable<string> {
    const subsRef = collection(this.firestore, this.collectionName);
    const newSub = {
      ...data,
      createdAt: Timestamp.now(),
    };
    return from(addDoc(subsRef, newSub).then(docRef => {
      // Mettre à jour les signaux locaux
      this._currentSubscription.set({ ...newSub, id: docRef.id } as Subscription);
      this._isPremium.set(data.plan !== 'free' && data.status === 'active');
      return docRef.id;
    }));
  }

  /**
   * Souscrit à un abonnement premium
   */
  subscribeToPremium(userId: string, plan: SubscriptionPlan): Observable<string> {
    const planDetails = this.getPlanDetails(plan);
    if (!planDetails || plan === 'free') {
      throw new Error('Plan invalide');
    }

    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + planDetails.duration);

    const subscriptionData: CreateSubscriptionData = {
      userId,
      plan,
      status: 'active',
      startDate: Timestamp.fromDate(now),
      endDate: Timestamp.fromDate(endDate),
      autoRenew: true,
      amount: planDetails.price,
      currency: planDetails.currency,
    };

    return this.createSubscription(subscriptionData);
  }

  /**
   * Annule un abonnement
   */
  cancelSubscription(subscriptionId: string): Observable<void> {
    const subRef = doc(this.firestore, `${this.collectionName}/${subscriptionId}`);
    return from(updateDoc(subRef, {
      status: 'cancelled',
      autoRenew: false,
      updatedAt: Timestamp.now(),
    })).pipe(
      switchMap(() => {
        this._isPremium.set(false);
        this._currentSubscription.set(null);
        return of(undefined);
      })
    );
  }

  /**
   * Met à jour un abonnement
   */
  updateSubscription(id: string, data: UpdateSubscriptionData): Observable<void> {
    const subRef = doc(this.firestore, `${this.collectionName}/${id}`);
    return from(updateDoc(subRef, {
      ...data,
      updatedAt: Timestamp.now(),
    }));
  }

  /**
   * Vérifie si un abonnement est actif
   */
  isSubscriptionActive(subscription: Subscription | null): boolean {
    if (!subscription) return false;
    if (subscription.status !== 'active') return false;
    if (subscription.plan === 'free') return false;

    const endDate = subscription.endDate instanceof Timestamp
      ? subscription.endDate.toDate()
      : subscription.endDate;

    return new Date() < endDate;
  }

  /**
   * Récupère les détails d'un plan
   */
  getPlanDetails(plan: SubscriptionPlan): SubscriptionPlanDetails | undefined {
    return SUBSCRIPTION_PLANS.find(p => p.id === plan);
  }

  /**
   * Récupère tous les plans disponibles
   */
  getAvailablePlans(): SubscriptionPlanDetails[] {
    return SUBSCRIPTION_PLANS;
  }

  /**
   * Rafraîchit le statut de l'abonnement
   */
  refreshSubscriptionStatus(): void {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.loadUserSubscription(user.uid);
      }
    });
  }
}
