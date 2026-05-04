import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Lấy danh sách roles được phép truy cập từ định nghĩa route (data: { roles: ['Admin', 'Manager'] })
  const expectedRoles = route.data['roles'] as Array<string>;

  if (!authService.isLoggedIn()) {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }

  const userRole = authService.getCurrentUser()?.role;
  if (userRole && expectedRoles.includes(userRole)) {
    return true;
  }

  if (userRole === 'Guest') {
    return router.createUrlTree(['/home']);
  }

  return router.createUrlTree(['/rooms']);
};
