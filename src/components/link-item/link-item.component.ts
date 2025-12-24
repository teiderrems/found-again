import { LinkType } from '@/components/header/header.component';
import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-link-item',
  templateUrl: './link-item.component.html',
  styleUrl: './link-item.component.css',
  standalone:true,
  imports: [MatIconModule, RouterLink, RouterLinkActive]
})
export class LinkItemComponent {
  link=input<LinkType | undefined>();
}
