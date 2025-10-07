import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { RouterModule } from '@angular/router';
import { ConfirmEmailComponent } from '../confirm-email/confirm-email.component';



@NgModule({
  declarations:[LoginComponent,RegisterComponent,
    ConfirmEmailComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,RouterModule
  ]
})
export class AuthModule { }
