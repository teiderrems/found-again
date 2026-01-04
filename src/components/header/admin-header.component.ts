import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { DropdownComponent, DropdownOption } from '../dropdown/dropdown.component';
import { AuthService } from '@/services/auth.service';
import { ThemeService } from '@/services/theme.service';
import { UserProfile } from '@/types/user';
import { Pages } from '@/config/constant';

export type AdminLinkType = {
  id: string;
  title: string;
  url: string;
  icon: string;
  badge?: number;
};

@Component({
  selector: 'app-admin-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatIconModule,
    MatButtonModule,
    DropdownComponent,
  ],
  templateUrl: './admin-header.component.html',
  styleUrl: './admin-header.component.css',
})
export class AdminHeaderComponent implements OnInit {
  readonly themeService = inject(ThemeService);
  authUser = signal<UserProfile | undefined>(undefined);
  mobileMenuOpen = signal(false);

  Pages = Pages;

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  adminLinks: AdminLinkType[] = [
    {
      id: 'dashboard',
      title: 'Tableau de bord',
      url: '/admin-dashboard',
      icon: 'dashboard',
      badge: 0
    },
    {
      id: 'declarations',
      title: 'Déclarations',
      url: '/admin/declarations',
      icon: 'list_alt',
      badge: 0
    },
    {
      id: 'users',
      title: 'Utilisateurs',
      url: '/admin/users',
      icon: 'people',
      badge: 0
    },
    {
      id: 'verifications',
      title: 'Vérifications',
      url: '/admin/verifications',
      icon: 'verified_user',
      badge: 0
    },
    {
      id: 'ads',
      title: 'Publicités',
      url: '/admin/ads',
      icon: 'campaign',
      badge: 0
    },
    {
      id: 'settings',
      title: 'Paramètres',
      url: '/admin/settings',
      icon: 'settings',
      badge: 0
    },
  ];

  dropdownMenuItems: DropdownOption[] = [];

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.authService.getCurrentUserProfile().subscribe({
      next: (user) => {
        this.authUser.set(user);
        this.initializeDropdownMenu();
      },
      error: (error) => console.error(error),
    });
  }

  private initializeDropdownMenu(): void {
    this.dropdownMenuItems = [
      {
        value: 'profile',
        label: 'Profil',
        icon: 'person',
        disabled: false,
      },
      {
        value: 'settings',
        label: 'Paramètres',
        icon: 'settings',
        disabled: false,
      },
      {
        value: 'logout',
        label: 'Se Déconnecter',
        icon: 'logout',
        disabled: false,
      },
    ];
  }

  getAvatar(): string {
    return (
      this.authUser()?.lastname ||
      this.authUser()?.firstname ||
      this.authUser()?.email ||
      'A'
    )
      .charAt(0)
      .toUpperCase();
  }

  getDisplayName(): string {
    return (
      this.authUser()?.lastname ||
      this.authUser()?.firstname ||
      this.authUser()?.email ||
      'Administrateur'
    );
  }

  onLogout(): void {
    this.authService.logOut().subscribe({
      next: () => {
        console.log('Déconnexion réussie !');
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

  redirectTo(path: string): void {
    this.router.navigateByUrl(path, {
      onSameUrlNavigation: 'reload',
    });
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.set(!this.mobileMenuOpen());
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  handleDropdownAction(value: string): void {
    switch (value) {
      case 'profile':
        this.redirectTo(Pages.PROFILE);
        break;
      case 'settings':
        this.redirectTo(Pages.ADMIN_SETTINGS);
        break;
      case 'logout':
        this.onLogout();
        break;
    }
  }
}
