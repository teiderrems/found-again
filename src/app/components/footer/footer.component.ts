import { Component } from '@angular/core';
import { LinkType } from '../header/header.component';
import { LinkItemComponent } from '../link-item/link-item.component';
import { RouterLink } from '@angular/router';

@Component({
   selector: 'app-footer',
   templateUrl: './footer.component.html',
   styleUrl: './footer.component.css',
   standalone: true,
   imports: [LinkItemComponent, RouterLink],
})
export class FooterComponent {
   public links_: LinkType[] = [
      // {
      //    id: 'home',
      //    title: 'Accueil',
      //    url: '/',
      //    is_active: false,
      // },
      {
         id: 'services',
         title: 'Services ',
         url: '/services',
         is_active: false,
      },
      {
         id: 'about',
         title: 'A propos',
         url: '/about',
         is_active: false,
      },
      {
         id: 'contact',
         title: 'Contactez nous',
         url: '/contact',
         is_active: false,
      },
   ];

   public socials: LinkType[] = [
      {
         id: 'facebook',
         title: 'Facebook',
         url: '#',
         is_active: false,
         icon: '../../../assets/icons8-facebook-50 1.svg',
      },
      {
         id: 'linkedin',
         title: 'linkedin',
         url: '#',
         is_active: false,
         icon: '../../../assets/icons8-linkedin-50 1.svg',
      },
      {
         id: 'twitter',
         title: 'twitter',
         url: '#',
         is_active: false,
         icon: '../../../assets/icons8-twitter-50 1.svg',
      },
   ];
}
