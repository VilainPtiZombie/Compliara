import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  // Authentification (pas de layout)
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },

  // Pages publiques (sans auth)
  {
    path: 'public',
    loadChildren: () =>
      import('./public/public.routes').then((m) => m.PUBLIC_ROUTES),
  },

  // Application principale (avec layout + guard)
  {
    path: '',
    loadComponent: () =>
      import('./core/layout/shell.component').then((m) => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./features/dashboard/dashboard.routes').then(
            (m) => m.DASHBOARD_ROUTES
          ),
      },
      {
        path: 'services',
        loadChildren: () =>
          import('./features/services/services.routes').then(
            (m) => m.SERVICES_ROUTES
          ),
      },
      {
        path: 'declarations',
        loadChildren: () =>
          import('./features/declarations/declarations.routes').then(
            (m) => m.DECLARATIONS_ROUTES
          ),
      },
      {
        path: 'planning',
        loadChildren: () =>
          import('./features/planning/planning.routes').then(
            (m) => m.PLANNING_ROUTES
          ),
      },
    ],
  },

  { path: '**', redirectTo: '' },
];
