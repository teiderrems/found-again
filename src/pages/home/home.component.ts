import { Component, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { RouterOutlet } from '@angular/router';

@Component({
   selector: 'app-home',
   templateUrl: './home.component.html',
   styleUrl: './home.component.css',
   imports: [
      CommonModule,
      HeaderComponent,
      FooterComponent,
      RouterOutlet
   ],
   standalone: true,
})
export class HomeComponent implements OnInit {
   ngOnInit(): void {
      
   }
}
