import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { AdminService } from '@/services/admin.service';
import { UserProfile } from '@/types/user';
import { ConfirmationDialogComponent } from '@/components/confirmation-dialog.component';
import { FirebaseDatePipe } from '@/pipes/firebase-date.pipe';
import { SettingsService } from '@/services/settings.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatDialogModule,
    MatPaginatorModule,
    FirebaseDatePipe
  ],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.css',
})
export class AdminUsersComponent implements OnInit {
  private adminService = inject(AdminService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private settingsService = inject(SettingsService);

  users = signal<UserProfile[]>([]);
  filteredUsers = signal<UserProfile[]>([]);
  pageSize = signal(10);
  pageIndex = signal(0);
  
  constructor() {
    effect(() => {
      this.pageSize.set(this.settingsService.itemsPerPage());
    }, { allowSignalWrites: true });
  }
  
  // Sorting
  sortColumn = signal<string>('');
  sortDirection = signal<'asc' | 'desc'>('asc');

  sortedUsers = computed(() => {
    const users = this.filteredUsers();
    const column = this.sortColumn();
    const direction = this.sortDirection();

    if (!column) return users;

    return [...users].sort((a, b) => {
      const valueA = (a as any)[column];
      const valueB = (b as any)[column];
      
      if (valueA == null && valueB == null) return 0;
      if (valueA == null) return 1;
      if (valueB == null) return -1;

      const comparison = valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
      return direction === 'asc' ? comparison : -comparison;
    });
  });

  pagedUsers = computed(() => {
    const startIndex = this.pageIndex() * this.pageSize();
    return this.sortedUsers().slice(startIndex, startIndex + this.pageSize());
  });

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers() {
    this.adminService.getAllUsers().subscribe({
      next: (users) => {
        this.users.set(users);
        this.filteredUsers.set(users);
      },
      error: (error) => console.error('Error loading users:', error)
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredUsers.set(
      this.users().filter(user => 
        user.email.toLowerCase().includes(filterValue) || 
        user.firstname.toLowerCase().includes(filterValue) || 
        user.lastname.toLowerCase().includes(filterValue)
      )
    );
    this.pageIndex.set(0); // Reset to first page on filter
  }

  sortData(column: string) {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
  }

  handlePageEvent(e: PageEvent) {
    this.pageSize.set(e.pageSize);
    this.pageIndex.set(e.pageIndex);
  }

  toggleRole(user: UserProfile): void {
    const newRole = user.role === 'admin' ? 'standard' : 'admin';
    const action = newRole === 'admin' ? 'promouvoir' : 'rétrograder';
    
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Modifier le rôle',
        message: `Voulez-vous vraiment ${action} ${user.firstname} ${user.lastname} ?`,
        confirmText: 'Confirmer',
        cancelText: 'Annuler',
        type: 'warning'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.adminService.updateUserRole(user.uid, newRole).subscribe({
          next: () => {
            this.snackBar.open('Rôle mis à jour avec succès', 'Fermer', { duration: 3000 });
          },
          error: (error) => {
            console.error('Error updating role:', error);
            this.snackBar.open('Erreur lors de la mise à jour du rôle', 'Fermer', { duration: 3000 });
          }
        });
      }
    });
  }

  toggleUserStatus(user: UserProfile) {
    const newStatus = !(user.isActive ?? true);
    const action = newStatus ? 'activer' : 'désactiver';

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: `${newStatus ? 'Activer' : 'Désactiver'} l'utilisateur`,
        message: `Êtes-vous sûr de vouloir ${action} l'utilisateur "${user.firstname} ${user.lastname}" ? ${!newStatus ? 'Il ne pourra plus se connecter.' : ''}`,
        confirmText: action.charAt(0).toUpperCase() + action.slice(1),
        cancelText: 'Annuler',
        type: newStatus ? 'info' : 'warning'
      }
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;

      this.adminService.toggleUserStatus(user.uid, newStatus).subscribe({
        next: () => {
          this.snackBar.open(`Utilisateur ${newStatus ? 'activé' : 'désactivé'} avec succès`, 'Fermer', {
            duration: 3000
          });
        },
        error: (error) => {
          console.error('Erreur lors du changement de statut:', error);
          this.snackBar.open('Erreur lors du changement de statut', 'Fermer', {
            duration: 3000
          });
        }
      });
    });
  }

  deleteUser(user: UserProfile): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Supprimer l\'utilisateur',
        message: `Êtes-vous sûr de vouloir supprimer l'utilisateur ${user.email} ? Cette action est irréversible.`,
        confirmText: 'Supprimer',
        cancelText: 'Annuler',
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.adminService.deleteUser(user.uid).subscribe({
          next: () => {
            this.snackBar.open('Utilisateur supprimé avec succès', 'Fermer', { duration: 3000 });
          },
          error: (error) => {
            console.error('Error deleting user:', error);
            this.snackBar.open('Erreur lors de la suppression', 'Fermer', { duration: 3000 });
          }
        });
      }
    });
  }
}
