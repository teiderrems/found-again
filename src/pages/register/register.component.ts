import { Component } from '@angular/core';
import {
   FormGroup,
   Validators,
   FormBuilder,
   ReactiveFormsModule,
   FormsModule,
} from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router, RouterModule } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';


@Component({
   selector: 'app-register',
   templateUrl: './register.component.html',
   styleUrl: './register.component.css',
   standalone: true,
   imports: [ReactiveFormsModule, FormsModule, RouterModule, MatSnackBarModule],
})
export class RegisterComponent {
   registerForm: FormGroup;
   errorMessage = '';

   constructor(
      private fb: FormBuilder,
      private authService: AuthService,
      private readonly router: Router,
      private snackBar: MatSnackBar
   ) {
      this.registerForm = this.fb.group({
         firstname: ['', [Validators.required, Validators.minLength(2)]],
         lastname: ['', [Validators.required, Validators.minLength(2)]],
         email: [
            '',
            [
               Validators.required,
               Validators.email,
               Validators.pattern(
                  '^[a-zA-Z0-9._%+-]+@(?:gmail\\.com|hotmail\\.com|outlook\\.com|yahoo\\.com|yahoo\\.fr)$',
               ),
            ],
         ],
         password: [
            '',
            [
               Validators.required,
               Validators.minLength(4),
               Validators.maxLength(10),
               Validators.pattern('^(?=.*[0-9])(?=.*[a-zA-Z]).*$'),
            ],
         ],
      });
   }

   async signUp() {
      console.log('Statut du formulaire : ', this.registerForm.status);
      console.log('Erreurs firstname : ', this.firstname?.errors);
      console.log('Erreurs lastname : ', this.lastname?.errors);
      console.log('Erreurs email : ', this.email?.errors);
      console.log('Erreurs password : ', this.password?.errors);

      this.registerForm.markAllAsTouched();

      if (this.registerForm.valid) {
         try {
            const user = await this.authService.registerUser({
               email: this.registerForm.get('email')?.value,
               firstname: this.registerForm.get('firstname')?.value,
               lastname: this.registerForm.get('lastname')?.value,
               password: this.registerForm.get('password')?.value,
            });
            if (user) {
               this.snackBar.open('Inscription réussie ! Bienvenue.', 'OK', {
                  duration: 3000,
                  verticalPosition: 'top'
               });
               this.router.navigateByUrl('/');
               this.registerForm.reset();
            }
         } catch (err: any) {
            console.log(err);
            this.errorMessage = 'Identifiants Incorrects.';
            const errorMessage = this.getErrorMessage(err);
            this.snackBar.open(errorMessage, 'Fermer', {
               duration: 5000,
               verticalPosition: 'top'
            });
         }
      }
   }

   async signInGoogle() {
      try {
         const value= await this.authService.signInGoogle();
         if (value) {
            this.snackBar.open('Inscription via Google réussie !', 'OK', {
               duration: 3000,
               verticalPosition: 'top'
            });
            this.router.navigateByUrl('/');
         }
      } catch (error: any) {
         const errorCode = error?.code || '';
         
         // Ignorer silencieusement si l'utilisateur ferme la popup
         if (errorCode === 'auth/popup-closed-by-user') {
            console.log('Authentification Google annulée par l\'utilisateur');
            return;
         }
         
         // Pour les autres erreurs, les logger et afficher un message
         console.error('Erreur lors de la connexion Google:', error);
         const errorMessage = this.getErrorMessage(error);
         this.snackBar.open(errorMessage, 'Fermer', {
            duration: 5000,
            verticalPosition: 'top'
         });
         // Vous pouvez ajouter ici une notification visuelle à l'utilisateur
      }
   }

   private getErrorMessage(error: any): string {
      const code = error?.code;
      switch (code) {
         case 'auth/email-already-in-use':
            return 'Cette adresse email est déjà utilisée par un autre compte.';
         case 'auth/invalid-email':
            return 'L\'adresse email est invalide.';
         case 'auth/operation-not-allowed':
            return 'L\'inscription par email/mot de passe n\'est pas activée.';
         case 'auth/weak-password':
            return 'Le mot de passe est trop faible.';
         case 'auth/network-request-failed':
            return 'Erreur de connexion réseau. Vérifiez votre connexion internet.';
         default:
            return 'Une erreur est survenue lors de l\'inscription. Veuillez réessayer.';
      }
   }

   get lastname() {
      return this.registerForm.get('lastname');
   }

   get firstname() {
      return this.registerForm.get('firstname');
   }

   get email() {
      return this.registerForm.get('email');
   }

   get password() {
      return this.registerForm.get('password');
   }
}
