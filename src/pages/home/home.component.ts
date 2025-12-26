import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '@/components/header/header.component';
import { FooterComponent } from '@/components/footer/footer.component';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '@/services/auth.service';
import { UserProfile } from '@/types/user';
import { AdminHeaderComponent } from '@/components/header/admin-header.component';

@Component({
   selector: 'app-home',
   templateUrl: './home.component.html',
   styleUrl: './home.component.css',
   imports: [
    CommonModule,
    HeaderComponent,
    FooterComponent,
    RouterOutlet,
    AdminHeaderComponent
],
   standalone: true,
})
export class HomeComponent implements OnInit {
   authUser = signal<UserProfile | undefined>(undefined);
   isAdmin = signal(false);

   constructor(private readonly authService: AuthService) {}

   ngOnInit(): void {
      this.authService.getCurrentUserProfile().subscribe({
         next: (user) => {
            this.authUser.set(user);
            this.isAdmin.set(user?.role === 'admin');
         },
         error: (err) => {
            console.error('Erreur lors du chargement du profil utilisateur:', err);
         }
      });
   }
}

