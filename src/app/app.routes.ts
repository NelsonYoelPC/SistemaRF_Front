import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { guestGuard } from './core/guards/guest-guard';

export const routes: Routes = [
    {
        path: 'login',
        canActivate: [guestGuard],
        loadComponent: () =>
            import('./pages/login/login').then(m => m.LoginComponent)
    },
    {
        path: '',
        canActivate: [authGuard],
        loadComponent: () =>
            import('./layout/app-shell/app-shell').then(m => m.AppShellComponent),
        children: [
            {
                path: 'administracion/usuarios',
                loadComponent: () =>
                    import('./pages/usuarios/usuarios').then(m => m.UsuariosComponent)
            },
            {
                path: 'administracion/roles',
                loadComponent: () =>
                    import('./pages/roles/roles').then(m => m.RolesComponent)
            },
            {
                path: '',
                redirectTo: 'administracion/usuarios',
                pathMatch: 'full'
            },
            {
                path: '**',
                redirectTo: 'administracion/usuarios'
            }
        ]
    },
    {
        path: '**',
        redirectTo: 'login'
    }
];