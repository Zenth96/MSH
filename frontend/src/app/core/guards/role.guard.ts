import { inject } from '@angular/core';
import { Router } from '@angular/router';
import type { CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    const user = auth.getToken() ? auth.getCurrentUserValue() : null;

    if (user && allowedRoles.includes(user.role)) {
      return true;
    }

    return router.parseUrl('/not-authenticated');
  };
};
