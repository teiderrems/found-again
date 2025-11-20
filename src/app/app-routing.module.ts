import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import {  AuthGuard, redirectUnauthorizedTo,redirectLoggedInTo } from '@angular/fire/auth-guard';
import { NotFoundComponent } from './not-found/not-found.component';
import { ConfirmEmailComponent } from './confirm-email/confirm-email.component';
import { AppHomeComponent } from '@/app/app-home/app-home.component';


const redirectLoggedInToHome = () => redirectLoggedInTo(['']);
const redirectUnauthorizedToLanding = () => redirectUnauthorizedTo(['login']);
const routes: Routes = [
  // {
  //   path:'',
  //   component:HomeComponent,
  //   canActivate:[AuthGuard],
  //   data:{
  //     authGuardPipe: redirectUnauthorizedToLanding
  //   },
  //   title:'Accueil',
  //   children:[
  //     {
  //       path:'profil',
  //       component:ProfileComponent,
  //       pathMatch:'full',
  //       title:'Profile',
  //       runGuardsAndResolvers:(from,to)=>from.url===to.url
  //     },
  //   ]
  // },
   {
      path:'',
      component:LoginComponent,
      pathMatch:'full',
      canActivate:[AuthGuard],
      data:{
         authGuardPipe: redirectLoggedInToHome
      },
      title:'Se connecter'
   },
   {
      path:'home',
      component: AppHomeComponent,
      pathMatch:'full',
      canActivate:[AuthGuard],
      data:{
         authGuardPipe: redirectLoggedInToHome
      },
      title:'Accueil'
   },
  {
    path:'login',
    component:LoginComponent,
    pathMatch:'full',
    canActivate:[AuthGuard],
    data:{
      authGuardPipe: redirectLoggedInToHome
    },
    title:'Se connecter'
  },
  {
    path:'register',
    component:RegisterComponent,
    pathMatch:'full',
    title:'S\'inscrire'
  },
  {
    path:'confirm-email',
    component:ConfirmEmailComponent,
    pathMatch:'full',
    title:'ConfirmEmail'
  },
  {
    path:'**',
    component:NotFoundComponent,
    pathMatch:'full',
    title:'Non trouver'
  }

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
