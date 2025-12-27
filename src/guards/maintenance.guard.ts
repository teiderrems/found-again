import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, UrlTree, RouterStateSnapshot, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, combineLatest, of } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';
import { SettingsService } from '@/services/settings.service';
import { Auth, user } from '@angular/fire/auth';
import { Firestore, doc, docData } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class MaintenanceGuard implements CanActivate {
  private settingsService = inject(SettingsService);
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private router = inject(Router);

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> {
    const user$ = user(this.auth).pipe(take(1));
    const settings$ = this.settingsService.getSettings().pipe(take(1));

    return combineLatest([settings$, user$]).pipe(
      switchMap(([settings, currentUser]) => {
        // If maintenance mode is off, allow access
        if (!settings.maintenanceMode) {
          return of(true);
        }

        // If maintenance mode is on
        
        // Allow access to maintenance page
        if (state.url === '/maintenance') {
           return of(true);
        }

        // Allow access to login page so admins can log in
        if (state.url.includes('connexion')) {
            return of(true);
        }

        // If no user logged in, redirect to maintenance
        if (!currentUser) {
           return of(this.router.createUrlTree(['/maintenance']));
        }

        // Check if user is admin
        const userDoc = doc(this.firestore, `users/${currentUser.uid}`);
        return docData(userDoc).pipe(
           take(1),
           map((userData: any) => {
              if (userData?.role === 'admin') {
                 return true;
              }
              return this.router.createUrlTree(['/maintenance']);
           })
        );
      })
    );
  }
}
