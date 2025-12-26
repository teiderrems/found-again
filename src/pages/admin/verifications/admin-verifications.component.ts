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
import { VerificationService } from '@/services/verification.service';
import { VerificationData } from '@/types/verification';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'app-admin-verifications',
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
  ],
  templateUrl: './admin-verifications.component.html',
  styleUrl: './admin-verifications.component.css',
})
export class AdminVerificationsComponent implements OnInit {
  verifications$!: Observable<VerificationData[]>;
  displayedColumns: string[] = ['userId', 'declarationId', 'status', 'timestamp', 'actions'];

  constructor(private verificationService: VerificationService) {}

  ngOnInit(): void {
    // TODO: Implémenter la récupération de toutes les vérifications
    this.verifications$ = of([]);
  }

  viewVerification(id: string): void {
    console.log('Viewing verification:', id);
  }

  approveVerification(id: string): void {
    console.log('Approving verification:', id);
  }

  rejectVerification(id: string): void {
    console.log('Rejecting verification:', id);
  }

  deleteVerification(id: string): void {
    console.log('Deleting verification:', id);
  }
}
