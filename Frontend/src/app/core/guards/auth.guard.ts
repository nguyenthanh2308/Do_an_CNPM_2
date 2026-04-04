import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Roles được phép vào Admin Dashboard
const STAFF_ROLES = ['Admin', 'Manager', 'Receptionist', 'Housekeeping'];

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router      = inject(Router);

  if (!authService.isLoggedIn()) {
    // Chưa đăng nhập → về trang login
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }

  const role = authService.getCurrentUser()?.role;

  // Khách hàng (Guest) KHÔNG được vào Admin Dashboard
  if (!role || !STAFF_ROLES.includes(role)) {
    if (role === 'Guest') {
      return router.createUrlTree(['/home']);
    }

    // Role không hợp lệ hoặc chưa xác định
    return router.createUrlTree(['/login'], {
      queryParams: { message: 'Role khong hop le. Vui long dang nhap lai.' }
    });
  }

  return true;
};
