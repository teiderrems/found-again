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
import { DeclarationService } from '@/services/declaration.service';
import { DeclarationData } from '@/types/declaration';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'app-admin-declarations',
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
  templateUrl: './admin-declarations.component.html',
  styleUrl: './admin-declarations.component.css',
})
export class AdminDeclarationsComponent implements OnInit {
  declarations$!: Observable<DeclarationData[]>;
  displayedColumns: string[] = ['title', 'type', 'category', 'createdAt', 'status', 'actions'];

  constructor(private declarationService: DeclarationService) {}

  ngOnInit(): void {
    this.declarations$ = this.declarationService.getDeclarations();
  }

  viewDeclaration(id: string): void {
    console.log('Viewing declaration:', id);
  }

  editDeclaration(id: string): void {
    console.log('Editing declaration:', id);
  }

  deleteDeclaration(id: string): void {
    console.log('Deleting declaration:', id);
  }
}
