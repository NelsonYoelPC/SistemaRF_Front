import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { guestGuard } from './core/guards/guest-guard';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () =>
            import('./layout/auth-layout/auth-layout').then(m => m.AuthLayoutComponent),
        canActivate: [guestGuard],
        children: [
            {
                path: 'login',
                loadComponent: () =>
                    import('./pages/login/login').then(m => m.LoginComponent)
            },
            {
                path: '',
                redirectTo: '/login',
                pathMatch: 'full'
            }
        ]
    },
    {
        path: 'app',
        canActivate: [authGuard],
        loadComponent: () =>
            import('./layout/app-shell/app-shell').then(m => m.AppShellComponent),
        children: [
            {
                path: 'dashboard',
                redirectTo: 'administracion/usuarios',
                pathMatch: 'full'
            },
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
                path: 'reconocimiento/personas-interes',
                loadComponent: () =>
                    import('./pages/reconocimiento/personas-interes/personas-interes').then(m => m.PersonasInteresComponent)
            },
            {
                path: 'reconocimiento/monitoreo-analitico',
                loadComponent: () =>
                    import('./pages/reconocimiento/monitoreo-analitico/monitoreo-analitico').then(m => m.MonitoreoAnaliticoComponent)
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
        redirectTo: ''
    }
];