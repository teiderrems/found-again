import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import {
   AuthGuard,
   redirectUnauthorizedTo,
   redirectLoggedInTo,
} from '@angular/fire/auth-guard';
import { NotFoundComponent } from './not-found/not-found.component';
import { ConfirmEmailComponent } from './confirm-email/confirm-email.component';
import { HomeComponent } from './home/home.component';
import { LostObjectComponent } from './lost-object/lost-object.component';
import { FoundObjectComponent } from './found-object/found-object.component';
import { ServiceComponent } from './service/service.component';
import { AboutComponent } from './about/about.component';
import { ContactComponent } from './contact/contact.component';

const redirectLoggedInToHome = () => redirectLoggedInTo(['']);
const redirectUnauthorizedToLanding = () => redirectUnauthorizedTo(['login']);
const routes: Routes = [
   {
      path: 'home',
      redirectTo: '/',
   },
   {
      path: '',
      component: HomeComponent,
      // canActivate:[AuthGuard],
      data: {
         authGuardPipe: redirectUnauthorizedToLanding,
      },
      title: 'Accueil',
      children: [
         {
            path: 'lost-object',
            component: LostObjectComponent,
            pathMatch: 'full',
            title: 'Déclarer un objet perdu',
            runGuardsAndResolvers: (from, to) => from.url === to.url,
         },
         {
            path: 'found-object',
            component: FoundObjectComponent,
            pathMatch: 'full',
            title: 'Déclarer un objet retrouvé',
            runGuardsAndResolvers: (from, to) => from.url === to.url,
         },
         {
            path: 'services',
            component: ServiceComponent,
            pathMatch: 'full',
            title: 'Nos Services',
            runGuardsAndResolvers: (from, to) => from.url === to.url,
         },
         {
            path: 'about',
            component: AboutComponent,
            pathMatch: 'full',
            title: 'A propos de nous',
            runGuardsAndResolvers: (from, to) => from.url === to.url,
         },
         {
            path: 'contact',
            component: ContactComponent,
            pathMatch: 'full',
            title: 'Nous contacter',
            runGuardsAndResolvers: (from, to) => from.url === to.url,
         },
      ],
   },
   {
      path: 'login',
      component: LoginComponent,
      pathMatch: 'full',
      canActivate: [AuthGuard],
      data: {
         authGuardPipe: redirectLoggedInToHome,
      },
      title: 'Se connecter',
   },
   {
      path: 'register',
      component: RegisterComponent,
      pathMatch: 'full',
      title: "S'inscrire",
   },
   {
      path: 'confirm-email',
      component: ConfirmEmailComponent,
      pathMatch: 'full',
      title: 'ConfirmEmail',
   },
   {
      path: '**',
      component: NotFoundComponent,
      pathMatch: 'full',
      title: 'Non trouver',
   },
];

@NgModule({
   imports: [RouterModule.forRoot(routes)],
   exports: [RouterModule],
})
export class AppRoutingModule {}
