# Admin Header Component

## Vue d'ensemble
Le composant `AdminHeaderComponent` est un header spécialisé destiné aux utilisateurs avec le rôle "admin". Il remplace automatiquement le header standard dans le layout lorsqu'un utilisateur authentifié a le statut administrateur.

## Fonctionnalités

### Navigation Administrative
- **Déclarations**: Lien principal vers le tableau de bord des déclarations
- **Utilisateurs**: Gestion des utilisateurs du système
- **Vérifications**: Suivi des verifications en attente
- **Statistiques**: Analyse et rapports du système

### Menu déroulant Déclarations
Le menu déroulant "Déclarations" offre un accès rapide à :
- Tableau de bord complet
- Déclarations récentes (avec filtre)
- Vérifications en attente (avec filtre)

### Badge Admin
Un badge rouge distinctif "ADMIN" s'affiche dans l'en-tête pour identifier clairement que l'utilisateur est en mode administrateur.

### Menu Utilisateur
- Affiche le nom et l'email de l'administrateur
- Avatar dynamique basé sur les initiales
- Liens vers : Profil, Paramètres
- Bouton de déconnexion

### Responsivité
- **Desktop**: Navigation complète avec tous les menus
- **Tablet & Mobile**: Menu condensé avec toggle mobile

## Intégration

### Affichage automatique
Le composant s'affiche automatiquement dans `AppLayoutComponent` lorsque :
```typescript
authUser.role === 'admin'
```

### Structure du layout
```html
<!-- Dans app-layout.component.html -->
@if (isAdmin()) {
  <app-admin-header/>
} @else {
  <app-header/>
}
```

## Style et Couleurs
- **Fond**: Gradient gris sombre (gray-900 → gray-800)
- **Badge Admin**: Rouge (#DC2626)
- **Icônes**: Material Design (admin_panel_settings, dashboard, people, verified_user, analytics)
- **Hover**: Fond gris-700 avec transition lisse
- **Avatar**: Gradient bleu

## Propriétés

### Signal Reactif
- `authUser`: Signal contenant le profil utilisateur actuel
- `mobileMenuOpen`: Signal pour l'état du menu mobile

### Liens d'administration
```typescript
adminLinks: AdminLinkType[] = [
  { id: 'declarations', title: 'Déclarations', ... },
  { id: 'users', title: 'Utilisateurs', ... },
  { id: 'verifications', title: 'Vérifications', ... },
  { id: 'analytics', title: 'Statistiques', ... },
]
```

## Méthodes

### `getAvatar(): string`
Retourne la première lettre du nom de l'administrateur pour l'affichage en avatar

### `getDisplayName(): string`
Retourne le nom complet ou email de l'administrateur

### `onLogout(): void`
Gère la déconnexion de l'administrateur et redirection vers la page de connexion

### `redirectTo(path: string): void`
Navigation vers une page spécifique

### `toggleMobileMenu(): void`
Bascule l'état du menu mobile

### `closeMobileMenu(): void`
Ferme le menu mobile après navigation

## Routes utilisées
- `/admin-dashboard`: Tableau de bord principal
- `/admin-dashboard?tab=recent-declarations`: Déclarations récentes
- `/admin-dashboard?tab=pending-verifications`: Vérifications en attente
- `Pages.PROFILE`: Profil de l'administrateur
- `Pages.SETTINGS`: Paramètres du système
- `Pages.SIGN_IN`: Page de connexion (après déconnexion)

## Badges de notification
Les liens administratifs peuvent afficher des badges numériques pour les éléments en attente :
```html
@if (link.badge && link.badge > 0) {
  <span class="bg-red-600">{{ link.badge }}</span>
}
```

## Sécurité
- ✅ Accès restreint aux utilisateurs avec `role === 'admin'`
- ✅ Validation côté AuthService
- ✅ Redirection automatique après déconnexion
- ✅ Menu personnel sécurisé avec données utilisateur

## Modifications futures
- [ ] Intégrer les badges numériques (déclarations à vérifier, etc.)
- [ ] Ajouter un système de notifications push
- [ ] Intégrer les recherches rapides
- [ ] Ajouter des logs d'activité administrateur
- [ ] Thème sombre/clair pour admin
