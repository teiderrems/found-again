import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

  loginForm: FormGroup;
  errorMessage : String ="";

  constructor(private fb: FormBuilder, private authService: AuthService,private readonly router:Router){
    //Initialiser notre formulaire
    this.loginForm = this.fb.group({
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

  get password(){
    return this.loginForm.get('password');
  }


  //connexion avec google

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

 //Méthode pour la connexion
  async signIn(){

    console.log("Statut du formulaire : ", this.loginForm.status);
    console.log("Erreurs email : ", this.email?.errors);
    console.log("Erreurs password : ", this.password?.errors);

    this.loginForm.markAllAsTouched();

    if (this.loginForm.valid) {
      try{
        const auth=await this.authService.signIn({
          email:this.loginForm.get('email')?.value,
          password:this.loginForm.get('password')?.value});
        if (auth.user) {
          this.router.navigateByUrl('/');
          this.loginForm.reset();
        }
      }catch(err){
        console.log(err);
        this.errorMessage ="Identifiants Incorrects."
      }
    }
  }


  getEmailError(): string{
    const emailControl = this.loginForm.controls['email']
    if (emailControl.hasError('required'))  {return "L'email est requis.";}

    if (emailControl.hasError('email')) return "L'adresse email n'est pas valide";

    return "";
  }
  getPasswordError(): string {
    const passwordControl = this.loginForm.controls['password'];
    if (passwordControl.hasError('required')) {
      return "le mot de passe est requis";
    }
    if (passwordControl.hasError('minlength'))
      return "Le mot de passe doit contenir au minimum 4 caractères."
    else if (passwordControl.hasError('maxlength')) {
      return "Le mot de passe doit contenir au maximmum 15 caractères."
    }
    else if (passwordControl.hasError('pattern')) {
      return "Le mot de passe doit contenir au minimum un chiffre entre 0 à 9. "
    }

    return "";
  }

}
