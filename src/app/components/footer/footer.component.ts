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
      {
         id: 'services',
         title: 'Services ',
         url: '/services',
      },
      {
         id: 'about',
         title: 'A propos',
         url: '/about',
      },
      {
         id: 'contact',
         title: 'Contactez nous',
         url: '/contact',
      },
   ];

   public socials: LinkType[] = [
      {
         id: 'facebook',
         title: 'Facebook',
         url: '#',
         icon: '../../../assets/icons8-facebook-50 1.svg',
      },
      {
         id: 'linkedin',
         title: 'linkedin',
         url: '#',
         icon: '../../../assets/icons8-linkedin-50 1.svg',
      },
      {
         id: 'twitter',
         title: 'twitter',
         url: '#',
         icon: '../../../assets/icons8-twitter-50 1.svg',
      },
   ];
}
