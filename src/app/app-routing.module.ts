import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {
   AuthGuard,
   redirectUnauthorizedTo,
   redirectLoggedInTo,
} from '@angular/fire/auth-guard';
import { HomeComponent } from './home/home.component';

const redirectLoggedInToHome = () => redirectLoggedInTo(['']);
const redirectUnauthorizedToLanding = () => redirectUnauthorizedTo(['connexion']);
const routes: Routes = [
   {
      path: 'home',
      redirectTo: '/',
   },
   {
      path: '',
      component: HomeComponent,
      canActivate:[AuthGuard],
      data: {
         authGuardPipe: redirectUnauthorizedToLanding,
      },
      title: 'Accueil',
      children: [
         {
            path: 'déclarer',
            loadComponent:()=>import('./lost-object/lost-object.component').then(c=>c.LostObjectComponent),
            pathMatch: 'full',
            title: 'Déclarer un objet perdu',
            runGuardsAndResolvers: (from, to) => from.url === to.url,
         },
         {
            path: 'rechercher',
            loadComponent:()=>import('./found-object/found-object.component').then(c=>c.FoundObjectComponent),
            pathMatch: 'full',
            title: 'Déclarer un objet retrouvé',
            runGuardsAndResolvers: (from, to) => from.url === to.url,
         },
         {
            path: 'services',
            loadComponent:()=>import('./service/service.component').then(c=>c.ServiceComponent),
            pathMatch: 'full',
            title: 'Nos Services',
            runGuardsAndResolvers: (from, to) => from.url === to.url,
         },
         {
            path: 'about',
            loadComponent:()=>import('./about/about.component').then(c=>c.AboutComponent),
            pathMatch: 'full',
            title: 'A propos de nous',
            runGuardsAndResolvers: (from, to) => from.url === to.url,
         },
         {
            path: 'contact',
            loadComponent:()=>import('./contact/contact.component').then(c=>c.ContactComponent),
            pathMatch: 'full',
            title: 'Nous contacter',
            runGuardsAndResolvers: (from, to) => from.url === to.url,
         },
      ],
   },
   {
      path: 'connexion',
      loadComponent:()=>import('./auth/login/login.component').then(c=>c.LoginComponent),
      pathMatch: 'full',
      canActivate: [AuthGuard],
      data: {
         authGuardPipe: redirectLoggedInToHome,
      },
      title: 'Se connecter',
   },
   {
      path: 'inscription',
      loadComponent:()=>import('./auth/register/register.component').then(c=>c.RegisterComponent),
      pathMatch: 'full',
      title: "S'inscrire",
   },
   {
      path: 'confirmer-email',
      loadComponent:()=>import('./confirm-email/confirm-email.component').then(c=>c.ConfirmEmailComponent),
      pathMatch: 'full',
      title: 'Confirmer Email',
   },
   {
      path: '**',
      loadComponent:()=>import('./not-found/not-found.component').then(c=>c.NotFoundComponent),
      pathMatch: 'full',
      title: 'Non trouver',
   },
];

@NgModule({
   imports: [RouterModule.forRoot(routes)],
   exports: [RouterModule],
})
export class AppRoutingModule {}
