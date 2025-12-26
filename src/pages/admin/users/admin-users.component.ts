import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { AdminService } from '@/services/admin.service';
import { UserProfile } from '@/types/user';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatFormFieldModule,
    MatSlideToggleModule,
  ],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.css',
})
export class AdminUsersComponent implements OnInit {
  users$!: Observable<UserProfile[]>;
  displayedColumns: string[] = ['email', 'firstname', 'lastname', 'role', 'createdAt', 'actions'];

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.users$ = this.adminService.getAllUsers();
  }

  viewUser(id: string): void {
    console.log('Viewing user:', id);
  }

  editUser(id: string): void {
    console.log('Editing user:', id);
  }

  toggleRole(id: string, currentRole: string): void {
    console.log('Toggling role for user:', id, 'from', currentRole);
  }

  deleteUser(id: string): void {
    console.log('Deleting user:', id);
  }
}
