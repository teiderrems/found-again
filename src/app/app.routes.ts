import { Routes } from '@angular/router';

import { HomeComponent } from '@/pages/home/home.component';
import { MapViewComponent } from '@/pages/map-view/map-view.component';
import { Pages } from '@/config/constant';
import { preparePathForRouter } from '@/app/utils';
import {
   AuthGuard,
   redirectUnauthorizedTo,
   redirectLoggedInTo,
} from '@angular/fire/auth-guard';

import { RegistrationGuard } from '@/guards/registration.guard';
import { MaintenanceGuard } from '@/guards/maintenance.guard';

const redirectLoggedInToHome = () => redirectLoggedInTo(['']);
const redirectUnauthorizedToLanding = () => redirectUnauthorizedTo(['connexion']);

export const routes: Routes = [
   {
      path: 'maintenance',
      loadComponent: () => import('@/pages/maintenance/maintenance.component').then(c => c.MaintenanceComponent),
      title: 'Maintenance en cours'
   },
   {
      path: 'home',
      redirectTo: Pages.HOME,
   },
   {
      path: '',
      component: HomeComponent,
      canActivate: [AuthGuard, MaintenanceGuard],
      data: {
         authGuardPipe: redirectUnauthorizedToLanding,
      },
      title: 'Accueil',
      children: [
         {
            path: '',
            loadComponent: () =>
               import('@/pages/dashboard-dispatcher/dashboard-dispatcher.component').then(
                  (c) => c.DashboardDispatcherComponent,
               ),
            pathMatch: 'full',
            title: 'Tableau de Bord',
         },
         {
            path: 'settings',
            loadComponent: () => import('@/pages/settings/settings.component').then(c => c.SettingsComponent),
            title: 'Paramètres'
         },
         {
            path: preparePathForRouter(Pages.OBJECTS_LOST_CREATE),
            loadComponent: () =>
               import('@/pages/lost-object/lost-object.component').then(
                  (c) => c.LostObjectComponent,
               ),
            pathMatch: 'full',
            title: 'Déclarer un objet perdu',
            runGuardsAndResolvers: (from, to) => from.url === to.url,
         },
         {
            path: preparePathForRouter(Pages.OBJECTS_FOUND_CREATE),
            loadComponent: () =>
               import('@/pages/found-object/found-object.component').then(
                  (c) => c.FoundObjectComponent,
               ),
            pathMatch: 'full',
            title: 'Déclarer un objet retrouvé',
            runGuardsAndResolvers: (from, to) => from.url === to.url,
         },
         {
            path: preparePathForRouter(Pages.SEARCH),
            loadComponent: () =>
               import('@/pages/search/search.component').then((c) => c.SearchComponent),
            pathMatch: 'full',
            title: 'Rechercher un objet',
            runGuardsAndResolvers: (from, to) => from.url === to.url,
         },
         {
            path: preparePathForRouter(Pages.SERVICES),
            loadComponent: () =>
               import('@/pages/service/service.component').then(
                  (c) => c.ServiceComponent,
               ),
            pathMatch: 'full',
            title: 'Nos Services',
            runGuardsAndResolvers: (from, to) => from.url === to.url,
         },
         {
            path: preparePathForRouter(Pages.ABOUT),
            loadComponent: () =>
               import('@/pages/about/about.component').then((c) => c.AboutComponent),
            pathMatch: 'full',
            title: 'A propos de nous',
            runGuardsAndResolvers: (from, to) => from.url === to.url,
         },
         {
            path: preparePathForRouter(Pages.CONTACT),
            loadComponent: () =>
               import('@/pages/contact/contact.component').then(
                  (c) => c.ContactComponent,
               ),
            pathMatch: 'full',
            title: 'Nous contacter',
            runGuardsAndResolvers: (from, to) => from.url === to.url,
         },
         {
            path: preparePathForRouter(Pages.PRIVACY),
            loadComponent: () =>
               import('@/pages/privacy/privacy.component').then(
                  (c) => c.PrivacyComponent,
               ),
            pathMatch: 'full',
            title: 'Politique de Confidentialité',
            runGuardsAndResolvers: (from, to) => from.url === to.url,
         },
         {
            path: preparePathForRouter(Pages.TERMS),
            loadComponent: () =>
               import('@/pages/terms/terms.component').then(
                  (c) => c.TermsComponent,
               ),
            pathMatch: 'full',
            title: 'Conditions Générales',
            runGuardsAndResolvers: (from, to) => from.url === to.url,
         },
         {
            path: 'map',
            component: MapViewComponent,
            pathMatch: 'full',
            title: 'Carte',
            runGuardsAndResolvers: (from, to) => from.url === to.url,
         },
         {
            path: 'tableau-de-bord',
            loadComponent: () =>
               import('@/pages/dashboard/dashboard.component').then(
                  (c) => c.DashboardComponent,
               ),
            pathMatch: 'full',
            title: 'Tableau de Bord',
            runGuardsAndResolvers: (from, to) => from.url === to.url,
         },
         {
            path: 'admin-dashboard',
            loadComponent: () =>
               import('@/pages/admin-dashboard/admin-dashboard.component').then(
                  (c) => c.AdminDashboardComponent,
               ),
            pathMatch: 'full',
            title: 'Tableau de Bord Admin',
            runGuardsAndResolvers: (from, to) => from.url === to.url,
         },
         {
            path: 'admin',
            children: [
               {
                  path: 'declarations',
                  loadComponent: () =>
                     import('@/pages/admin/declarations/admin-declarations.component').then(
                        (c) => c.AdminDeclarationsComponent,
                     ),
                  pathMatch: 'full',
                  title: 'Gestion des Déclarations',
                  runGuardsAndResolvers: (from, to) => from.url === to.url,
               },
               {
                  path: 'users',
                  loadComponent: () =>
                     import('@/pages/admin/users/admin-users.component').then(
                        (c) => c.AdminUsersComponent,
                     ),
                  pathMatch: 'full',
                  title: 'Gestion des Utilisateurs',
                  runGuardsAndResolvers: (from, to) => from.url === to.url,
               },
               {
                  path: 'verifications',
                  loadComponent: () =>
                     import('@/pages/admin/verifications/admin-verifications.component').then(
                        (c) => c.AdminVerificationsComponent,
                     ),
                  pathMatch: 'full',
                  title: 'Gestion des Vérifications',
                  runGuardsAndResolvers: (from, to) => from.url === to.url,
               },
               {
                  path: 'settings',
                  loadComponent: () =>
                     import('@/pages/admin/settings/admin-settings.component').then(
                        (c) => c.AdminSettingsComponent,
                     ),
                  pathMatch: 'full',
                  title: 'Paramètres de l\'Application',
                  runGuardsAndResolvers: (from, to) => from.url === to.url,
               },
            ],
         },
         {
            path: 'verifier-identite/:id',
            loadComponent: () =>
               import('@/pages/verify-identity/verify-identity.component').then(
                  (c) => c.VerifyIdentityComponent,
               ),
            pathMatch: 'full',
            title: "Vérifier l'Identité",
            runGuardsAndResolvers: (from, to) => from.url === to.url,
         },
         {
            path: 'mes-verifications',
            loadComponent: () =>
               import('@/pages/my-verifications/my-verifications.component').then(
                  (c) => c.MyVerificationsComponent,
               ),
            pathMatch: 'full',
            title: 'Mes Vérifications',
            runGuardsAndResolvers: (from, to) => from.url === to.url,
         },
         {
            path: 'profile',
            loadComponent: () =>
               import('@/pages/profile/profile.component').then(
                  (c) => c.UserProfileComponent,
               ),
            title: 'Profil Utilisateur',
            runGuardsAndResolvers: (from, to) => from.url === to.url,
         },
         {
            path: 'notifications',
            loadComponent: () =>
               import('@/pages/notifications/notification.component').then(
                  (c) => c.NotificationComponent,
               ),
            pathMatch: 'full',
            title: 'Notifications',
            runGuardsAndResolvers: (from, to) => from.url === to.url,
         }
      ],
   },
   {
      path: preparePathForRouter(Pages.SIGN_IN),
      loadComponent: () =>
         import('@/pages/login/login.component').then((c) => c.LoginComponent),
      pathMatch: 'full',
      canActivate: [AuthGuard, MaintenanceGuard],
      data: {
         authGuardPipe: redirectLoggedInToHome,
      },
      title: 'Se connecter',
   },
   {
      path: preparePathForRouter(Pages.SIGN_UP),
      loadComponent: () =>
         import('@/pages/register/register.component').then((c) => c.RegisterComponent),
      pathMatch: 'full',
      canActivate: [RegistrationGuard, MaintenanceGuard],
      title: "S'inscrire",
   },
   {
      path: preparePathForRouter(Pages.CONFIRM_EMAIL),
      loadComponent: () =>
         import('@/pages/confirm-email/confirm-email.component').then(
            (c) => c.ConfirmEmailComponent,
         ),
      pathMatch: 'full',
      title: 'Confirmer Email',
   },
   {
      path: 'reset-password',
      loadComponent: () =>
         import('@/pages/reset-password/reset-password.component').then(
            (c) => c.ResetPasswordComponent,
         ),
      pathMatch: 'full',
      title: 'Réinitialiser le mot de passe',
   },
   {
      path: '**',
      loadComponent: () =>
         import('@/pages/not-found/not-found.component').then((c) => c.NotFoundComponent),
      pathMatch: 'full',
      title: 'Non trouver',
   },
];
