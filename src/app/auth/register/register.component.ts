import { Component } from '@angular/core';
import { FormGroup, Validators, FormBuilder } from '@angular/forms';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
   registerForm: FormGroup;
   errorMessage = "";

   constructor(private fb: FormBuilder, private authService: AuthService,private readonly router:Router){
      this.registerForm = this.fb.group({
         firstname: ['', [
            Validators.required,
            Validators.minLength(2)
         ]],
         lastname: ['', [
            Validators.required,
            Validators.minLength(2)
         ]],
         email:['user@gmail.com',[
            Validators.required,
            Validators.email,
            Validators.pattern('^[a-zA-Z0-9._%+-]+@(?:gmail\\.com|hotmail\\.com|outlook\\.com|yahoo\\.com|yahoo\\.fr)$')
         ]],
         password:['user1234',[
            Validators.required,
            Validators.minLength(4),
            Validators.maxLength(10),
            Validators.pattern('^(?=.*[0-9])(?=.*[a-zA-Z]).*$')
         ]
         ]
      });
   }

   async signUp(){

      console.log("Statut du formulaire : ", this.registerForm.status);
      console.log("Erreurs firstname : ", this.firstname?.errors);
      console.log("Erreurs lastname : ", this.lastname?.errors);
      console.log("Erreurs email : ", this.email?.errors);
      console.log("Erreurs password : ", this.password?.errors);

      this.registerForm.markAllAsTouched();

      if (this.registerForm.valid) {
         try{
            const auth=await this.authService.signIn({
               email:this.registerForm.get('email')?.value,
               password:this.registerForm.get('password')?.value});
            if (auth.user) {
               this.router.navigateByUrl('/');
               this.registerForm.reset();
            }
         }catch(err){
            console.log(err);
            this.errorMessage ="Identifiants Incorrects."
         }
      }
   }

   async signInGoogle(){
      try {
         const res= await this.authService.signInGoogle();
         if (res.user) {
            console.log(res.user.email);
            this.router.navigateByUrl('/');
         }
      } catch (error) {
         console.error(error);
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

   get password(){
      return this.registerForm.get('password');
   }
}
