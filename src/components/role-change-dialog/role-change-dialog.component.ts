import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserProfile } from '@/types/user';
import { AdminService } from '@/services/admin.service';

@Component({
  selector: 'app-role-change-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <h2 mat-dialog-title class="flex items-center justify-between">
      <span>Modifier le Rôle de l'Utilisateur</span>
      <button mat-icon-button mat-dialog-close>
        <mat-icon>close</mat-icon>
      </button>
    </h2>

    <mat-dialog-content>
      <div class="space-y-4">
        <!-- User Info -->
        <div class="bg-gray-50 rounded-lg p-4">
          <p class="text-sm text-gray-600 mb-2">Utilisateur:</p>
          <p class="font-semibold text-gray-900">
            {{ data.user.firstname }} {{ data.user.lastname }}
          </p>
          <p class="text-sm text-gray-600 mt-2">Email:</p>
          <p class="font-medium text-gray-900">{{ data.user.email }}</p>
        </div>

        <!-- Current Role -->
        <div>
          <p class="text-sm text-gray-600 mb-2">Rôle actuel:</p>
          <span [class]="'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ' + 
                        (data.user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800')">
            {{ data.user.role === 'admin' ? 'Administrateur' : 'Utilisateur Standard' }}
          </span>
        </div>

        <!-- Action -->
        <div class="pt-2">
          <p class="text-sm text-gray-600 mb-3">Nouveau rôle:</p>
          <div class="flex gap-3">
            <button 
              mat-stroked-button
              [class.ring-2]="data.user.role !== 'standard'"
              [class.ring-blue-500]="data.user.role !== 'standard'"
              (click)="updateRole('standard')"
              [disabled]="isLoading || data.user.role === 'standard'">
              Standard
            </button>
            <button 
              mat-stroked-button
              [class.ring-2]="data.user.role !== 'admin'"
              [class.ring-purple-500]="data.user.role !== 'admin'"
              (click)="updateRole('admin')"
              [disabled]="isLoading || data.user.role === 'admin'">
              Administrateur
            </button>
          </div>
        </div>
        
        @if (isLoading) {
          <div class="flex justify-center p-2">
            <mat-spinner diameter="30"></mat-spinner>
          </div>
        }
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close [disabled]="isLoading">Annuler</button>
    </mat-dialog-actions>
  `
})
export class RoleChangeDialogComponent {
  private adminService = inject(AdminService);
  isLoading = false;

  constructor(
    public dialogRef: MatDialogRef<RoleChangeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { user: UserProfile }
  ) {}

  updateRole(newRole: 'standard' | 'admin') {
    this.isLoading = true;
    this.adminService.updateUserRole(this.data.user.uid, newRole).subscribe({
      next: () => {
        this.isLoading = false;
        this.dialogRef.close(true); // Signal success
      },
      error: (error) => {
        console.error('Erreur lors de la mise à jour du rôle:', error);
        this.isLoading = false;
        // Optionally show error here or let parent handle it
      }
    });
  }
}
