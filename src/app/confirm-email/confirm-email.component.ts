import { Component, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-confirm-email',
  templateUrl: './confirm-email.component.html',
  styleUrl: './confirm-email.component.css'
})
export class ConfirmEmailComponent {

  private readonly fb:FormBuilder=inject(FormBuilder);
  private authService: AuthService=inject(AuthService);
  private readonly router:Router=inject(Router);
  confirmForm=this.fb.group({
    email:['user@gmail.com',[
            Validators.required,
            Validators.email,
            Validators.pattern('^[a-zA-Z0-9._%+-]+@(?:gmail\\.com|hotmail\\.com|outlook\\.com|yahoo\\.com|yahoo\\.fr)$')
          ]]
  });

  get email() {
    return this.confirmForm.get('email');
  }

  getEmailError(): string{
    const emailControl = this.confirmForm.controls['email']
    if (emailControl.hasError('required'))  {return "L'email est requis.";}
  
    if (emailControl.hasError('email')) return "L'adresse email n'est pas valide";

    return "";
  }


  confirm_email(){
    if (this.confirmForm.valid) {
        this.authService.resetPassword(this.confirmForm.get('email')?.value as string)
        .then(()=>this.router.navigateByUrl('/login')).catch(error=>console.error(error));
      
    }
  }
}
