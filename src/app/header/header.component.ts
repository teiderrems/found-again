import { Component, inject, OnDestroy, TemplateRef, ViewChild } from '@angular/core';
import { commercial_modes as Commercial, CustomType } from '@/app/interfaces/dtos/api';
import { AuthService } from '@/app/auth/auth.service';
import { ApiServiceService } from '@/app/api-service.service';
import { Router } from '@angular/router';
import { Auth, user, User } from '@angular/fire/auth';
import { Subscription } from 'rxjs';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { LinkItemComponent } from '../components/link-item/link-item.component';
import { MatInputModule } from '@angular/material/input';

export type LinkType = {
   id: string;
   title: string;
   url: string;
   is_active: boolean;
   icon?: string;
};

@Component({
   selector: 'app-header',
   templateUrl: './header.component.html',
   styleUrl: './header.component.css',
   imports: [MatMenuModule, MatInputModule, MatIconModule, LinkItemComponent],
   standalone: true,
})
export class HeaderComponent implements OnDestroy {
   @ViewChild(TemplateRef) button: TemplateRef<unknown> | undefined;

   constructor(
      private readonly authService: AuthService,
      private readonly apiService: ApiServiceService,
      public readonly router: Router,
   ) {
      this.userSubscription = this.user$.subscribe((aUser: User | null) => {
         this.email = aUser?.email;
      });
   }
   ngOnDestroy(): void {
      this.userSubscription.unsubscribe();
   }

   public links_: LinkType[] = [
      {
         id: 'home',
         title: 'Accueil',
         url: '/',
         is_active: false,
      },
      {
         id: 'found_objet',
         title: 'Déclaré un objet trouvé ',
         url: '/found-objet',
         is_active: false,
      },
   ];
   public links_auth: LinkType[] = [
      {
         id: 'login',
         title: 'Connexion',
         url: '/login',
         is_active: false,
         icon:'login'
      },
      {
         id: 'register',
         title: 'Inscription',
         url: '/register',
         is_active: false,
         icon:'person_outline'
      },
   ];

   private auth: Auth = inject(Auth);
   user$ = user(this.auth);
   userSubscription: Subscription;

   email: string | null | undefined = 'inconnu';

   trajets2: CustomType[] = [];

   regions: Commercial[] = [];
   get getUrl(): string {
      return this.router.url;
   }

   async logOut() {
      try {
         await this.authService.logOut();
         this.router.navigateByUrl('/login');
      } catch (error) {
         console.log(error);
      }
   }
}
