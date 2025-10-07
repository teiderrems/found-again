import { inject, Injectable, OnInit } from '@angular/core';
import { Credentials } from '../interfaces/auth';
import { Auth, sendPasswordResetEmail, signInWithPopup } from '@angular/fire/auth';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { GoogleAuthProvider } from "firebase/auth";



@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private auth: Auth = inject(Auth);
  

  signInGoogle(){
    const provider=new GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    provider.addScope('https://www.googleapis.com/auth/contacts.readonly');
    return signInWithPopup(this.auth,provider);
  }

  signIn(credential:Credentials){

    return signInWithEmailAndPassword(this.auth,credential.email!,credential.password!)
  }

  signUp(credential:Credentials){

    return createUserWithEmailAndPassword(this.auth,credential.email!,credential.password!);
  }

  logOut(){
    
    return this.auth.signOut();
  }


  resetPassword(email:string){
    return sendPasswordResetEmail(this.auth,email);
  }
}
