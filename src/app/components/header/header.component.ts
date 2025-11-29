import {
   Component,
   inject,
   OnDestroy,
   signal,
   TemplateRef,
   ViewChild,
} from '@angular/core';
import { AuthService } from '@/app/auth/auth.service';
import { ApiServiceService } from '@/app/api-service.service';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Auth, user, User } from '@angular/fire/auth';
import { Subscription } from 'rxjs';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { LinkItemComponent } from '../link-item/link-item.component';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { DropdownComponent } from '../dropdown/dropdown.component';
import { CommonModule } from '@angular/common';

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
export class HeaderComponent implements OnDestroy {
   @ViewChild(TemplateRef) button: TemplateRef<unknown> | undefined;
   dropdownOpen = signal<boolean>(false);

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
         id: 'rechercher',
         title: 'Déclarer un objet trouvé ',
         url: '/rechercher',
         is_active: false,
      },
      {
         id: 'déclarer',
         title: 'Déclarer une perte ',
         url: '/déclarer',
         is_active: false,
      },
   ];

   private auth: Auth = inject(Auth);
   user$ = user(this.auth);
   userSubscription: Subscription;

   email: string | null | undefined = 'inconnu';

   userOptions = [
      {
         value: '1',
         label: 'Profil',
         icon: 'person',
         action: ($event:any) => {
            console.log($event);
         },
      },
      {
         value: '2',
         label: 'Paramètre',
         icon: 'settings',
         action: ($event:any) => {
            console.log($event);
         },
      },
      {
         value: '3',
         label: 'Se Déconnecter',
         icon: 'logout',
         action: async ($event:any) => {
            await this.auth.signOut();
            this.router.navigateByUrl('/');
         },
      },
   ];

   statusOptions = [
      { value: 'active', label: 'Actif' },
      { value: 'inactive', label: 'Inactif' },
   ];

   colorOptions = [
      { value: 'red', label: 'Rouge' },
      { value: 'blue', label: 'Bleu' },
      { value: 'green', label: 'Vert' },
   ];

   allItems = [
      { value: '1', label: 'Premier élément' },
      { value: '2', label: 'Deuxième élément' },
      { value: '3', label: 'Troisième élément' },
   ];

   selectedUser = '1';
   selectedStatus = 'active';
   selectedColor = 'blue';
   selectedItem: any;
   // dropdownOpen = false;
   filteredOptions = [...this.allItems];

   onUserChange(value: any) {
      console.log('Utilisateur sélectionné:', value);
      this.selectedUser = value;
   }

   onStatusChange(value: any) {
      console.log('Statut sélectionné:', value);
      this.selectedStatus = value;
   }

   onColorChange(value: any) {
      console.log('Couleur sélectionnée:', value);
      this.selectedColor = value;
   }

   onItemSelect(value: any) {
      console.log('Élément sélectionné:', value);
      this.selectedItem = value;
   }

   onSearch(event: any) {
      const searchTerm = event.target.value.toLowerCase();
      this.filteredOptions = this.allItems.filter((item) =>
         item.label.toLowerCase().includes(searchTerm),
      );
   }

   async logOut() {
      try {
         await this.authService.logOut();
         this.router.navigateByUrl('/login');
      } catch (error) {
         console.log(error);
      }
   }

   onDropdownToggle(isOpen: boolean) {
      console.log('Dropdown ouvert:', isOpen);
      this.dropdownOpen.set(isOpen);
   }
}
