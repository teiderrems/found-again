import { Component } from '@angular/core';
import { LinkType } from '../header/header.component';
import { LinkItemComponent } from '../link-item/link-item.component';
import { RouterLink } from '@angular/router';
import {Pages} from "@/config/constant";

@Component({
   selector: 'app-footer',
   templateUrl: './footer.component.html',
   styleUrl: './footer.component.css',
   standalone: true,
   imports: [LinkItemComponent, RouterLink],
})
export class FooterComponent {
   public links_: LinkType[] = [
      {
         id: 'services',
         title: 'Services ',
         url: Pages.SERVICES,
      },
      {
         id: 'about',
         title: 'A propos',
         url: Pages.ABOUT,
      },
      {
         id: 'contact',
         title: 'Contactez nous',
         url: Pages.CONTACT ,
      },
   ];

   public socials: LinkType[] = [
      {
         id: 'facebook',
         title: 'Facebook',
         url: '#',
         icon: '/images/icons8-facebook-50 1.svg',
      },
      {
         id: 'linkedin',
         title: 'linkedin',
         url: '#',
         icon: '/images/icons8-linkedin-50 1.svg',
      },
      {
         id: 'twitter',
         title: 'twitter',
         url: '#',
         icon: '/images/icons8-twitter-50 1.svg',
      },
   ];
}
