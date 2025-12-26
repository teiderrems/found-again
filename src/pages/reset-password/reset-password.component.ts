import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AuthService } from '@/services/auth.service';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    CommonModule,
    MatSnackBarModule,
  ],
})
export class ResetPasswordComponent implements OnInit {
  step: 'email' | 'verify' = 'email';
  emailForm: FormGroup;
  resetForm: FormGroup;
  errorMessage = '';
  successMessage = '';
  isLoading = false;
  resetCode = '';
  userEmail = '';
  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    this.emailForm = this.fb.group({
      email: [
        '',
        [
          Validators.required,
          Validators.email,
          Validators.pattern(
            '^[a-zA-Z0-9._%+-]+@(?:gmail\\.com|hotmail\\.com|outlook\\.com|yahoo\\.com|yahoo\\.fr)$'
          ),
        ],
      ],
    });

    this.resetForm = this.fb.group({
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(4),
          Validators.maxLength(10),
          Validators.pattern('^(?=.*[0-9])(?=.*[a-zA-Z]).*$'),
        ],
      ],
      confirmPassword: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    // Vérifier si on a un code de reset dans les query params
    this.activatedRoute.queryParams.subscribe((params) => {
      if (params['oobCode']) {
        this.resetCode = params['oobCode'];
        this.verifyResetCode();
      }
    });
  }

  get email() {
    return this.emailForm.get('email');
  }

  get password() {
    return this.resetForm.get('password');
  }

  get confirmPassword() {
    return this.resetForm.get('confirmPassword');
  }

  /**
   * Envoie l'email de reset de mot de passe
   */
  async sendResetEmail() {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    try {
      const email = this.emailForm.get('email')?.value;
      await new Promise((resolve, reject) => {
        this.authService.resetPassword(email).subscribe({
          next: () => resolve(null),
          error: (error) => reject(error),
        });
      });

      this.successMessage =
        'Un email de réinitialisation a été envoyé à ' + email;
      this.userEmail = email;
      
      this.snackBar.open(
        'Email de réinitialisation envoyé avec succès',
        'Fermer',
        {
          duration: 5000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
        }
      );

      // Attendre 2 secondes avant de rediriger vers le login
      setTimeout(() => {
        this.router.navigateByUrl('/connexion');
      }, 2000);
    } catch (error: any) {
      console.error('Erreur lors de l\'envoi de l\'email:', error);
      if (error.code === 'auth/user-not-found') {
        this.errorMessage = 'Cet email n\'existe pas.';
      } else {
        this.errorMessage = 'Une erreur est survenue. Veuillez réessayer.';
      }
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Vérifie le code de reset de mot de passe
   */
  private verifyResetCode() {
    this.isLoading = true;
    this.authService.verifyPasswordResetCode(this.resetCode).subscribe({
      next: (email) => {
        this.userEmail = email;
        this.step = 'verify';
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors de la vérification du code:', error);
        this.errorMessage =
          'Le lien de réinitialisation est invalide ou expiré.';
        this.isLoading = false;
      },
    });
  }

  /**
   * Réinitialise le mot de passe avec le code
   */
  async submitResetPassword() {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    const password = this.resetForm.get('password')?.value;
    const confirmPassword = this.resetForm.get('confirmPassword')?.value;

    if (password !== confirmPassword) {
      this.errorMessage = 'Les mots de passe ne correspondent pas.';
      return;
    }

    this.isLoading = true;
    try {
      await new Promise((resolve, reject) => {
        this.authService
          .confirmPasswordReset(this.resetCode, password)
          .subscribe({
            next: () => resolve(null),
            error: (error) => reject(error),
          });
      });

      this.successMessage = 'Mot de passe réinitialisé avec succès!';
      this.snackBar.open('Mot de passe réinitialisé avec succès', 'Fermer', {
        duration: 5000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
      });

      // Rediriger vers login après 2 secondes
      setTimeout(() => {
        this.router.navigateByUrl('/connexion');
      }, 2000);
    } catch (error: any) {
      console.error('Erreur lors de la réinitialisation:', error);
      if (error.code === 'auth/weak-password') {
        this.errorMessage = 'Le mot de passe est trop faible.';
      } else {
        this.errorMessage = 'Une erreur est survenue. Veuillez réessayer.';
      }
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Toggle pour afficher/masquer le mot de passe
   */
  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  /**
   * Toggle pour afficher/masquer la confirmation du mot de passe
   */
  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  /**
   * Retourner à l'étape précédente
   */
  goBack() {
    this.step = 'email';
    this.errorMessage = '';
    this.successMessage = '';
    this.emailForm.reset();
  }
}
