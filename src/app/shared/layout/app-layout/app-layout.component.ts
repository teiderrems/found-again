import { Component, OnInit, signal } from '@angular/core';
import { SidebarService } from '../../services/sidebar.service';
import { CommonModule } from '@angular/common';
import { AppSidebarComponent } from '../app-sidebar/app-sidebar.component';
import { BackdropComponent } from '../backdrop/backdrop.component';
import { RouterModule } from '@angular/router';
import { AppHeaderComponent } from '../app-header/app-header.component';
import { AdminHeaderComponent } from '@/components/header/admin-header.component';
import { AuthService } from '@/services/auth.service';
import { UserProfile } from '@/types/user';

@Component({
  selector: 'app-layout',
  imports: [
    CommonModule,
    RouterModule,
    AppHeaderComponent,
    AdminHeaderComponent,
    AppSidebarComponent,
    BackdropComponent
  ],
  templateUrl: './app-layout.component.html',
})

export class AppLayoutComponent implements OnInit {
  readonly isExpanded$;
  readonly isHovered$;
  readonly isMobileOpen$;
  
  authUser = signal<UserProfile | undefined>(undefined);
  isAdmin = signal(false);

  constructor(
    public sidebarService: SidebarService,
    private readonly authService: AuthService,
  ) {
    this.isExpanded$ = this.sidebarService.isExpanded$;
    this.isHovered$ = this.sidebarService.isHovered$;
    this.isMobileOpen$ = this.sidebarService.isMobileOpen$;
  }

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

  get containerClasses() {
    return [
      'flex-1',
      'transition-all',
      'duration-300',
      'ease-in-out',
      (this.isExpanded$ || this.isHovered$) ? 'xl:ml-[290px]' : 'xl:ml-[90px]',
      this.isMobileOpen$ ? 'ml-0' : ''
    ];
  }

}
