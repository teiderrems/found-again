import { Component, inject } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {

  constructor(private readonly authService:AuthService){}
  private readonly router:Router=inject(Router);
  
    register=new FormGroup({
      email:new FormControl('',[Validators.email,Validators.required]),
      password:new FormControl('',[Validators.maxLength(15),Validators.minLength(4),Validators.required])
    })
  
    async signUp(){
  
      if (this.register.valid) {
        try{
          const auth=await this.authService.signUp({email:this.register.get('email')?.value,password:this.register.get('password')?.value});
          if (auth.user) {
            this.register.reset();
            this.router.navigateByUrl('/login');
          }
        }catch(err){
  
          console.log(err);
        }
      }
    }
}
