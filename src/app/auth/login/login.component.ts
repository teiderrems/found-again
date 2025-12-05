import { Component } from '@angular/core';
import { AuthService } from '../auth.service';
import {
   FormBuilder,
   FormGroup,
   FormsModule,
   ReactiveFormsModule,
   Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
   selector: 'app-login',
   templateUrl: './login.component.html',
   styleUrls: ['./login.component.css'],
   standalone: true,
   imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
})
export class LoginComponent {
   loginForm: FormGroup;
   errorMessage = '';

   constructor(
      private fb: FormBuilder,
      private authService: AuthService,
      private readonly router: Router,
   ) {
      //Initialiser notre formulaire
      this.loginForm = this.fb.group({
         email: [
            'user@gmail.com',
            [
               Validators.required,
               Validators.email,
               Validators.pattern(
                  '^[a-zA-Z0-9._%+-]+@(?:gmail\\.com|hotmail\\.com|outlook\\.com|yahoo\\.com|yahoo\\.fr)$',
               ),
            ],
         ],
         password: [
            'user1234',
            [
               Validators.required,
               Validators.minLength(4),
               Validators.maxLength(10),
               Validators.pattern('^(?=.*[0-9])(?=.*[a-zA-Z]).*$'),
            ],
         ],
      });
   }

   isVisible = false;
   isOkLoading = false;

   showModal(): void {
      this.isVisible = true;
   }

   handleOk(): void {
      this.isOkLoading = true;
      setTimeout(() => {
         this.isVisible = false;
         this.isOkLoading = false;
      }, 3000);
   }

   handleCancel(): void {
      this.isVisible = false;
   }

   get email() {
      return this.loginForm.get('email');
   }

   get password() {
      return this.loginForm.get('password');
   }

   //connexion avec google

   async signInGoogle() {
      try {
         const response=await this.authService.signInGoogle();
         if (response) {
            this.router.navigateByUrl('/');
            this.loginForm.reset();
         }
      } catch (error) {
         throw error;
      }
   }

   //Méthode pour la connexion
   async signIn() {
      console.log('Statut du formulaire : ', this.loginForm.status);
      console.log('Erreurs email : ', this.email?.errors);
      console.log('Erreurs password : ', this.password?.errors);

      this.loginForm.markAllAsTouched();

      if (this.loginForm.valid) {
         this.authService
            .signIn({
               email: this.loginForm.get('email')?.value,
               password: this.loginForm.get('password')?.value,
            })
            .subscribe({
               next: () => {
                  this.router.navigateByUrl('/');
                  this.loginForm.reset();
               },
               error: (error) => console.error(error),
               complete: () => console.log('done'),
            });
      }
   }

   getEmailError(): string {
      const emailControl = this.loginForm.controls['email'];
      if (emailControl.hasError('required')) {
         return "L'email est requis.";
      }

      if (emailControl.hasError('email')) return "L'adresse email n'est pas valide";

      return '';
   }
   getPasswordError(): string {
      const passwordControl = this.loginForm.controls['password'];
      if (passwordControl.hasError('required')) {
         return 'le mot de passe est requis';
      }
      if (passwordControl.hasError('minlength'))
         return 'Le mot de passe doit contenir au minimum 4 caractères.';
      else if (passwordControl.hasError('maxlength')) {
         return 'Le mot de passe doit contenir au maximmum 15 caractères.';
      } else if (passwordControl.hasError('pattern')) {
         return 'Le mot de passe doit contenir au minimum un chiffre entre 0 à 9. ';
      }

      return '';
   }
}
