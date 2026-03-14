import { Routes } from '@angular/router';

export const PUBLIC_ROUTES: Routes = [
  {
    path: ':token',
    loadComponent: () =>
      import('./declaration-public.component').then(
        (m) => m.DeclarationPublicComponent
      ),
  },
];
