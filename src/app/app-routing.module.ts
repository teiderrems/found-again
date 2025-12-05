import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {
   AuthGuard,
   redirectUnauthorizedTo,
   redirectLoggedInTo,
} from '@angular/fire/auth-guard';
import { HomeComponent } from './home/home.component';
import {Pages} from "@/config/constant";
import {preparePathForRouter} from "@/app/utils";

const redirectLoggedInToHome = () => redirectLoggedInTo(['']);
const redirectUnauthorizedToLanding = () => redirectUnauthorizedTo(['connexion']);
const routes: Routes = [
   {
      path: 'home',
      redirectTo: Pages.HOME,
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
            path:  preparePathForRouter(Pages.OBJECTS_LOST_CREATE),
            loadComponent:()=>import('./lost-object/lost-object.component').then(c=>c.LostObjectComponent),
            pathMatch: 'full',
            title: 'Déclarer un objet perdu',
            runGuardsAndResolvers: (from, to) => from.url === to.url,
         },
         {
            path:  preparePathForRouter(Pages.OBJECTS_FOUND_CREATE),
            loadComponent:()=>import('./found-object/found-object.component').then(c=>c.FoundObjectComponent),
            pathMatch: 'full',
            title: 'Déclarer un objet retrouvé',
            runGuardsAndResolvers: (from, to) => from.url === to.url,
         },
         {
            path: preparePathForRouter(Pages.SEARCH),
            loadComponent:()=>import('./search/search.component').then(c=>c.SearchComponent),
            pathMatch: 'full',
            title: 'Rechercher un objet',
            runGuardsAndResolvers: (from, to) => from.url === to.url,
         },
         {
            path: preparePathForRouter(Pages.SERVICES),
            loadComponent:()=>import('./service/service.component').then(c=>c.ServiceComponent),
            pathMatch: 'full',
            title: 'Nos Services',
            runGuardsAndResolvers: (from, to) => from.url === to.url,
         },
         {
            path: preparePathForRouter(Pages.ABOUT),
            loadComponent:()=>import('./about/about.component').then(c=>c.AboutComponent),
            pathMatch: 'full',
            title: 'A propos de nous',
            runGuardsAndResolvers: (from, to) => from.url === to.url,
         },
         {
            path: preparePathForRouter(Pages.CONTACT),
            loadComponent:()=>import('./contact/contact.component').then(c=>c.ContactComponent),
            pathMatch: 'full',
            title: 'Nous contacter',
            runGuardsAndResolvers: (from, to) => from.url === to.url,
         },
         {
            path: preparePathForRouter(Pages.HELP),
            loadComponent:()=>import('./help-page/help-page.component').then(c=>c.HelpPageComponent),
            pathMatch: 'full',
            title: 'Page d\'aide',
            runGuardsAndResolvers: (from, to) => from.url === to.url,
         }
         ,
         {
            path: preparePathForRouter(Pages.PROFILE),
            loadComponent:()=>import('./profile/profile.component').then(c=>c.ProfileComponent),
            pathMatch: 'full',
            title: 'Profil utilisateur',
            runGuardsAndResolvers: (from, to) => from.url === to.url,
         }
      ],
   },
   {
      path: preparePathForRouter(Pages.SIGN_IN),
      loadComponent:()=>import('./auth/login/login.component').then(c=>c.LoginComponent),
      pathMatch: 'full',
      canActivate: [AuthGuard],
      data: {
         authGuardPipe: redirectLoggedInToHome,
      },
      title: 'Se connecter',
   },
   {
      path: preparePathForRouter(Pages.SIGN_UP),
      loadComponent:()=>import('./auth/register/register.component').then(c=>c.RegisterComponent),
      pathMatch: 'full',
      title: "S'inscrire",
   },
   {
      path: preparePathForRouter(Pages.CONFIRM_EMAIL),
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
