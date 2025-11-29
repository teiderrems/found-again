// services/declaration.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Declaration {
  id: string;
  title: string;
  category: string;
  description: string;
  location: string;
  date: string;
  contactEmail: string;
  contactPhone?: string;
  images: string[]; // URLs des images
  type: 'loss' | 'found';
  status: 'active' | 'resolved' | 'expired';
  createdAt: string;
  updatedAt: string;
  userId?: string;
}

export interface DeclarationCreate {
  title: string;
  category: string;
  description: string;
  location: string;
  date: string;
  contactEmail: string;
  contactPhone?: string;
  images: File[];
  type: 'loss' | 'found';
}

export interface DeclarationFilters {
  type?: 'loss' | 'found';
  category?: string;
  location?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  search?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root'
})
export class DeclarationService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/declarations`;
  
  // Subject pour le state management simple
  private declarationsSubject = new BehaviorSubject<Declaration[]>([]);
  public declarations$ = this.declarationsSubject.asObservable();

  constructor() {
    this.loadInitialDeclarations();
  }

  // Créer une déclaration
  createDeclaration(declarationData: DeclarationCreate): Observable<Declaration> {
    const formData = new FormData();
    
    // Ajouter les champs texte
    Object.keys(declarationData).forEach(key => {
      if (key !== 'images') {
        formData.append(key, (declarationData as any)[key]);
      }
    });
    
    // Ajouter les images
    declarationData.images.forEach((image, index) => {
      formData.append('images', image, image.name);
    });

    return this.http.post<Declaration>(this.apiUrl, formData).pipe(
      map(newDeclaration => {
        const currentDeclarations = this.declarationsSubject.value;
        this.declarationsSubject.next([newDeclaration, ...currentDeclarations]);
        return newDeclaration;
      })
    );
  }

  // Récupérer toutes les déclarations avec filtres
  getDeclarations(filters: DeclarationFilters = {}, page = 1, limit = 20): Observable<PaginatedResponse<Declaration>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    // Ajouter les filtres
    Object.keys(filters).forEach(key => {
      const value = (filters as any)[key];
      if (value) {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<PaginatedResponse<Declaration>>(this.apiUrl, { params });
  }

  // Récupérer une déclaration par ID
  getDeclarationById(id: string): Observable<Declaration> {
    return this.http.get<Declaration>(`${this.apiUrl}/${id}`);
  }

  // Mettre à jour une déclaration
  updateDeclaration(id: string, updates: Partial<Declaration>): Observable<Declaration> {
    return this.http.patch<Declaration>(`${this.apiUrl}/${id}`, updates).pipe(
      map(updatedDeclaration => {
        const currentDeclarations = this.declarationsSubject.value;
        const updatedDeclarations = currentDeclarations.map(decl =>
          decl.id === id ? updatedDeclaration : decl
        );
        this.declarationsSubject.next(updatedDeclarations);
        return updatedDeclaration;
      })
    );
  }

  // Supprimer une déclaration
  deleteDeclaration(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      map(() => {
        const currentDeclarations = this.declarationsSubject.value;
        const filteredDeclarations = currentDeclarations.filter(decl => decl.id !== id);
        this.declarationsSubject.next(filteredDeclarations);
      })
    );
  }

  // Marquer une déclaration comme résolue
  markAsResolved(id: string): Observable<Declaration> {
    return this.updateDeclaration(id, { status: 'resolved' });
  }

  // Rechercher des déclarations
  searchDeclarations(query: string, type?: 'loss' | 'found'): Observable<Declaration[]> {
    let params = new HttpParams().set('search', query);
    if (type) {
      params = params.set('type', type);
    }

    return this.http.get<Declaration[]>(`${this.apiUrl}/search`, { params });
  }

  // Charger les déclarations initiales
  private loadInitialDeclarations(): void {
    this.getDeclarations({}, 1, 50).subscribe({
      next: (response) => {
        this.declarationsSubject.next(response.data);
      },
      error: (error) => {
        console.error('Error loading initial declarations:', error);
      }
    });
  }

  // Getter pour le state actuel (synchrone)
  getCurrentDeclarations(): Declaration[] {
    return this.declarationsSubject.value;
  }
}