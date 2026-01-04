

import {
   Component,
   OnInit,
   signal,
   TemplateRef,
   ViewChild,
   inject,
} from '@angular/core';
import { AuthService } from '@/services/auth.service';
import { ThemeService } from '@/services/theme.service';
import { SubscriptionService } from '@/services/subscription.service';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { DropdownComponent } from '../dropdown/dropdown.component';

import { UserProfile } from '@/types/user';
import { Pages } from "@/config/constant";
import { NotificationPanelComponent } from '../notification-panel.component';

export type LinkType = {
   id: string;
   title: string;
   url: string;
   icon?: string;
};

@Component({
   selector: 'app-header',
   templateUrl: './header.component.html',
   styleUrl: './header.component.css',
   imports: [
    MatInputModule,
    MatIconModule,
    RouterLink,
    RouterLinkActive,
    MatButtonModule,
    DropdownComponent,
    NotificationPanelComponent
],
   standalone: true,
})
export class HeaderComponent implements OnInit {
   @ViewChild(TemplateRef) button: TemplateRef<unknown> | undefined;
   dropdownOpen = signal<boolean>(false);
   authUser = signal<UserProfile | undefined>(undefined);
   mobileMenuOpen = signal<boolean>(false);
   
   readonly themeService = inject(ThemeService);
   readonly subscriptionService = inject(SubscriptionService);

   constructor(
      private readonly authService: AuthService,
      public readonly router: Router,
   ) {}

   toggleTheme() {
      this.themeService.toggleTheme();
   }

   ngOnInit(): void {
      this.authService.getCurrentUserProfile().subscribe({
         next: (value) => this.authUser.set(value),
         error: (error) => console.error(error),
      });
   }

   getAvatar() {
      return (
         this.authUser()?.lastname ||
         this.authUser()?.firstname ||
         this.authUser()?.email ||
         'Guest'
      )
         .at(0)
         ?.toLocaleUpperCase();
   }

   onLogout() {
      this.authService.logOut().subscribe({
         next: () => {
            // Rediriger l'utilisateur vers la page de connexion
            this.router.navigateByUrl(Pages.SIGN_IN, {
               skipLocationChange: true,
               onSameUrlNavigation: 'reload',
            });
         },
         error: (err) => {
            console.error('Erreur lors de la déconnexion :', err);
         },
      });
   }
   redirectTo(path:string){
     this.router.navigateByUrl(path, {
       onSameUrlNavigation: 'reload',
     });

   }

   public getDisplayName() {
      return (
         this.authUser()?.lastname ||
         this.authUser()?.firstname ||
         this.authUser()?.email ||
         '-'
      );
   }

   public links_: LinkType[] = [
      {
         id: 'tableau-de-bord',
         title: 'Tableau de Bord',
         url: 'tableau-de-bord',
         icon:'dashboard'
      },
      {
         id: 'déclarer-objet-trouvé',
         title: 'Déclarer un objet trouvé ',
         url: Pages.OBJECTS_FOUND_CREATE,
         icon:'check_circle'
      },
      {
         id: 'déclarer-perte',
         title: 'Déclarer une perte ',
         url: Pages.OBJECTS_LOST_CREATE,
         icon:'report_problem'
      },
      {
         id: 'rechercher',
         title: 'Rechercher un objet ',
         url:  Pages.SEARCH,
         icon:'search'
      },
   ];

   dropdownMenuItems = [
      {
         value: '1',
         label: 'Profil',
         icon: 'person',
         action: ($event: any) => {
            this.redirectTo(Pages.PROFILE);

         },
      },
      {
         value: '2',
         label: 'Mes Vérifications',
         icon: 'verified_user',
         action: ($event: any) => {
            this.redirectTo('/mes-verifications');
         },
      },
      {
         value: '3',
         label: 'Notifications',
         icon: 'notifications',
         action: ($event: any) => {
            this.redirectTo('/notifications');
         },
      },
      {
         value: '3.5',
         label: 'Premium',
         icon: 'star',
         action: ($event: any) => {
            this.redirectTo('/premium');
         },
      },
      {
         value: '4',
         label: 'Paramètres',
         icon: 'settings',
         action: ($event: any) => {
            this.redirectTo('/settings');
         },
      },
      {
         value: '5',
         label: 'Se Déconnecter',
         icon: 'logout',
         action: ($event: any) => {
            this.onLogout();
            this.redirectTo(Pages.SIGN_IN);
         },
      },
   ];

   onDropdownToggle(isOpen: boolean) {
      this.dropdownOpen.set(isOpen);
   }

   toggleMobileMenu() {
      this.mobileMenuOpen.set(!this.mobileMenuOpen());
   }

   closeMobileMenu() {
      this.mobileMenuOpen.set(false);
   }
}