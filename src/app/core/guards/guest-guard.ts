import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionService } from '../services/session.service';
import { getSidebarByRole } from '../data/sidebar.menu';

export const guestGuard: CanActivateFn = () => {
  const sessionService = inject(SessionService);
  const router = inject(Router);

  if (!sessionService.isAuthenticated() || !sessionService.role) {
    return true;
  }

  return router.createUrlTree(['/app']);
};