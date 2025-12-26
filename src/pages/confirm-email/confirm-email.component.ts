import { Component, OnInit } from '@angular/core';
import {
   FormBuilder,
   FormGroup,
   FormsModule,
   ReactiveFormsModule,
   Validators,
} from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';


@Component({
   selector: 'app-confirm-email',
   templateUrl: './confirm-email.component.html',
   styleUrl: './confirm-email.component.css',
   imports: [ReactiveFormsModule, FormsModule, RouterModule],
   standalone: true,
})
export class ConfirmEmailComponent implements OnInit {
   confirmEmailForm: FormGroup;
   errorMessage = '';

   constructor(
      private fb: FormBuilder,
      private authService: AuthService,
      private readonly router: Router,
      private readonly route: ActivatedRoute,
   ) {
      this.confirmEmailForm = this.fb.group({
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
      });
   }

   ngOnInit(): void {
      // Rediriger vers la page de reset de mot de passe en conservant les paramètres (oobCode, etc.)
      this.route.queryParams.subscribe(params => {
         this.router.navigate(['/reset-password'], { queryParams: params });
      });
   }

   get email() {
      return this.confirmEmailForm.get('email');
   }

   async confirmEmail() {
      console.log('Statut du formulaire : ', this.confirmEmailForm.status);
      console.log('Erreurs email : ', this.email?.errors);

      this.confirmEmailForm.markAllAsTouched();

      if (this.confirmEmailForm.valid) {
         this.authService
            .resetPassword(this.confirmEmailForm.get('email')?.value as string)
            .subscribe({
               next:()=>this.router.navigateByUrl('/login'),
               error:(error)=>console.error(error),
               complete:()=>console.log("done")
            });
      }
   }
}

