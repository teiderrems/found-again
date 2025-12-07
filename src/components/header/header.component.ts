import {
   Component,
   OnInit,
   signal,
   TemplateRef,
   ViewChild,
} from '@angular/core';
import { AuthService } from '@/services/auth.service';
import { Router, RouterLink } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { LinkItemComponent } from '../link-item/link-item.component';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { DropdownComponent } from '../dropdown/dropdown.component';
import { CommonModule } from '@angular/common';
import { UserProfile } from '@/types/user';
import {Pages} from "@/config/constant";

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
      MatMenuModule,
      MatInputModule,
      MatIconModule,
      LinkItemComponent,
      RouterLink,
      MatButtonModule,
      DropdownComponent,
      CommonModule,
   ],
   standalone: true,
})
export class HeaderComponent implements OnInit {
   @ViewChild(TemplateRef) button: TemplateRef<unknown> | undefined;
   dropdownOpen = signal<boolean>(false);
   authUser = signal<UserProfile | undefined>(undefined);

   constructor(
      private readonly authService: AuthService,
      public readonly router: Router,
   ) {}

   ngOnInit(): void {
      this.authService.getCurrentUserProfile().subscribe({
         next: (value) => this.authUser.set(value),
         error: (error) => console.error(error),
         complete: () => console.log('done'),
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
            console.log('Déconnexion réussie !');
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
         id: 'déclarer-objet-trouvé',
         title: 'Déclarer un objet trouvé ',
         url: Pages.OBJECTS_FOUND_CREATE,
         icon:'request_page'
      },
      {
         id: 'déclarer-perte',
         title: 'Déclarer une perte ',
         url: Pages.OBJECTS_LOST_CREATE,
         icon:'assignment_add'
      },
      {
         id: 'rechercher',
         title: 'Rechercher un objet ',
         url:  Pages.SEARCH,
         icon:'location_searching'
      },
   ];

   dropdownMenuItems = [
      {
         value: '1',
         label: 'Profil',
         icon: 'person',
         action: ($event: any) => {
            console.log($event);
            this.redirectTo(Pages.PROFILE);

         },
      },
      {
         value: '2',
         label: 'Paramètre',
         icon: 'settings',
         action: ($event: any) => {
            console.log($event);
           this.redirectTo(Pages.SETTINGS);

         },
      },
      {
         value: '3',
         label: 'Se Déconnecter',
         icon: 'logout',
         action: ($event: any) => {
            this.onLogout();
         },
      },
   ];

   onDropdownToggle(isOpen: boolean) {
      console.log('Dropdown ouvert:', isOpen);
      this.dropdownOpen.set(isOpen);
   }
}
