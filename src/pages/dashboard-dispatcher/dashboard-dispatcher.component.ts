import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '@/services/auth.service';
import { DashboardComponent } from '@/pages/dashboard/dashboard.component';
import { AdminDashboardComponent } from '@/pages/admin-dashboard/admin-dashboard.component';

@Component({
  selector: 'app-dashboard-dispatcher',
  standalone: true,
  imports: [CommonModule, DashboardComponent, AdminDashboardComponent],
  template: `
    @if (isLoading()) {
      <div class="flex justify-center items-center h-full min-h-[50vh]">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    } @else {
      @if (isAdmin()) {
        <app-admin-dashboard />
      } @else {
        <app-dashboard />
      }
    }
  `
})
export class DashboardDispatcherComponent implements OnInit {
  private authService = inject(AuthService);
  
  isAdmin = signal(false);
  isLoading = signal(true);

  ngOnInit() {
    this.authService.getCurrentUserProfile().subscribe({
      next: (user) => {
        this.isAdmin.set(user?.role === 'admin');
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading user profile', err);
        this.isLoading.set(false);
      }
    });
  }
}
