import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard = (allowedRoles: string[]) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const user = auth.getToken() ? auth['currentUserSubject'].value : null;

  if (user && allowedRoles.includes(user.role)) {
    return true;
  }

  return router.parseUrl('/dashboard');
};
