import { LinkType } from '@/components/header/header.component';
import { Component, input, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-link-item',
  templateUrl: './link-item.component.html',
  styleUrl: './link-item.component.css',
  standalone:true,
  imports: [MatIconModule, RouterLink, RouterLinkActive]
})
export class LinkItemComponent {
  
  link=input<LinkType | undefined>();
  is_active=signal<boolean>(false);
  constructor(public readonly router: Router){
    this.is_active.set(this.router.url===this.link()?.url);
  }
}
