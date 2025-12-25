import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { DeclarationService } from '@/services/declaration.service';
import { VerificationService } from '@/services/verification.service';
import { AuthService } from '@/services/auth.service';
import { LocationService } from '@/services/location.service';
import { DeclarationData } from '@/types/declaration';

@Component({
  selector: 'app-verify-identity',
  templateUrl: './verify-identity.component.html',
  styleUrl: './verify-identity.component.css',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, MatButtonModule]
})
export class VerifyIdentityComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private declarationService = inject(DeclarationService);
  private verificationService = inject(VerificationService);
  private authService = inject(AuthService);
  private locationService = inject(LocationService);

  verifyForm!: FormGroup;
  objectDeclaration: DeclarationData | null = null;
  isLoading = signal(false);
  verificationStep = signal<'initial' | 'verification' | 'success' | 'failed'>('initial');
  errorMessage = signal<string>('');
  successMessage = signal<string>('');

  ngOnInit() {
    this.initializeForm();
    this.loadObjectDeclaration();
  }

  private initializeForm() {
    this.verifyForm = this.fb.group({
      identityDetails: ['', [Validators.required, Validators.minLength(10)]],
      additionalInfo: ['', [Validators.required, Validators.minLength(20)]],
      serialNumber: [''],
      agreeTerms: [false, Validators.requiredTrue]
    });
  }

  private loadObjectDeclaration() {
    const declarationId = this.route.snapshot.paramMap.get('id');
    if (declarationId) {
      this.isLoading.set(true);
      this.declarationService.getDeclarationById(declarationId).subscribe({
        next: (declaration) => {
          this.objectDeclaration = declaration;
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Erreur lors du chargement de la déclaration:', error);
          this.errorMessage.set('Impossible de charger la déclaration');
          this.isLoading.set(false);
        }
      });
    }
  }

  startVerification() {
    this.verificationStep.set('verification');
    this.errorMessage.set('');
  }

  submitVerification() {
    if (this.verifyForm.invalid) {
      this.errorMessage.set('Veuillez remplir tous les champs correctement');
      return;
    }

    if (!this.objectDeclaration?.id) {
      this.errorMessage.set('Erreur: ID de la déclaration manquant');
      return;
    }

    this.isLoading.set(true);
    const currentUserId = this.authService.getCurrentUserId();
    
    if (!currentUserId) {
      this.errorMessage.set('Erreur: Utilisateur non authentifié');
      this.isLoading.set(false);
      return;
    }

    const verificationData = {
      identityDetails: this.verifyForm.get('identityDetails')?.value,
      additionalInfo: this.verifyForm.get('additionalInfo')?.value,
      serialNumber: this.verifyForm.get('serialNumber')?.value || null,
    };

    // Utiliser le service de vérification
    this.verificationService.createVerification(
      this.objectDeclaration.id,
      currentUserId,
      verificationData
    ).subscribe({
      next: (verificationId) => {
        this.isLoading.set(false);
        this.verificationStep.set('success');
        this.successMessage.set('Votre vérification d\'identité a été enregistrée avec succès. Un administrateur examinera bientôt votre demande.');
        
        // Récupérer les coordonnées de l'utilisateur et rediriger vers la map
        this.getCoordinatesAndNavigateToMap();
      },
      error: (error) => {
        this.isLoading.set(false);
        this.verificationStep.set('failed');
        this.errorMessage.set('Erreur lors de l\'enregistrement de la vérification. Veuillez réessayer plus tard.');
        console.error('Erreur:', error);
      }
    });
  }

  private getCoordinatesAndNavigateToMap() {
    // Récupérer la position actuelle de l'utilisateur (origin)
    this.locationService.getCurrentPosition().subscribe({
      next: (userPosition) => {
        // Récupérer les coordonnées de la déclaration (destination)
        const destinationLat = this.objectDeclaration?.coordinates?.lat;
        const destinationLng = this.objectDeclaration?.coordinates?.lng;

        if (destinationLat !== undefined && destinationLng !== undefined) {
          // Rediriger vers la map avec les paramètres
          setTimeout(() => {
            this.router.navigate(['/map-view'], {
              queryParams: {
                originLat: userPosition.latitude,
                originLng: userPosition.longitude,
                destinationLat: destinationLat,
                destinationLng: destinationLng
              }
            });
          }, 2000);
        } else {
          // Si les coordonnées ne sont pas disponibles, rediriger vers l'accueil
          setTimeout(() => {
            this.router.navigate(['/']);
          }, 2000);
        }
      },
      error: (error) => {
        console.error('Erreur lors de la récupération des coordonnées:', error);
        // Rediriger vers l'accueil même en cas d'erreur
        setTimeout(() => {
          this.router.navigate(['/']);
        }, 2000);
      }
    });
  }

  resetForm() {
    this.verifyForm.reset();
    this.verificationStep.set('initial');
    this.errorMessage.set('');
  }

  goBack() {
    this.router.navigate(['/']);
  }
}
