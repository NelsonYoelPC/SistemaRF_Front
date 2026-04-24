import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { guestGuard } from './core/guards/guest-guard';
import { AuthLayoutComponent } from './layout/auth-layout/auth-layout';

export const routes: Routes = [
    {
        path: '',
        component: AuthLayoutComponent,
        canActivate: [guestGuard],
        children: [
            {
                path: 'login',
                loadComponent: () =>
                    import('./pages/login/login').then(m => m.LoginComponent)
            },
            {
                path: '',
                redirectTo: 'login',
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
        ]
    },
    {
        path: '**',
        redirectTo: ''
    }
];