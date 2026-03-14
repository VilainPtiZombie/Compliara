import { Routes } from '@angular/router';

export const DECLARATIONS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./declarations-list.component').then((m) => m.DeclarationsListComponent),
  },
  {
    path: 'publish',
    loadComponent: () =>
      import('./publish/publish-declaration.component').then((m) => m.PublishDeclarationComponent),
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./create/create-declaration.component').then((m) => m.CreateDeclarationComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./declaration-detail.component').then((m) => m.DeclarationDetailComponent),
  },
];
