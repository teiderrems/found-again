import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, map } from 'rxjs';
import { SettingsService } from '@/services/settings.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class RegistrationGuard implements CanActivate {
  private settingsService = inject(SettingsService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  canActivate(): Observable<boolean | UrlTree> {
    return this.settingsService.getSettings().pipe(
      map(settings => {
        if (settings.allowRegistration) {
          return true;
        }
        
        this.snackBar.open('Les inscriptions sont temporairement désactivées.', 'Fermer', {
          duration: 5000,
          panelClass: ['bg-red-500', 'text-white']
        });
        return this.router.createUrlTree(['/connexion']);
      })
    );
  }
}
