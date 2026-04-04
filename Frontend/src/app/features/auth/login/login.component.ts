import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';

// Các role được phép vào Admin Dashboard
const STAFF_ROLES = ['Admin', 'Manager', 'Receptionist', 'Housekeeping'];

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnDestroy {
  loginForm: FormGroup;
  hidePassword = true;
  isLoading = false;
  errorMessage = '';
  /** Thông báo từ guard khi Guest cố truy cập admin */
  warningMessage = '';

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      email:    ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    // Hiển thị thông báo từ authGuard (khi Guest bị chặn)
    this.warningMessage = this.route.snapshot.queryParamMap.get('message') ?? '';
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';
    this.warningMessage = '';
    const { email, password } = this.loginForm.value;

    this.authService.login({ email, password })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isLoading = false;
          const role = this.authService.getCurrentUser()?.role;

          if (role && STAFF_ROLES.includes(role)) {
            // Nhân viên → admin dashboard
            const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/rooms';
            this.router.navigateByUrl(returnUrl);
          } else {
            // Khách hàng (Guest) → thông báo không có quyền vào admin
            this.authService.logout();
            this.errorMessage = 'Tài khoản khách hàng không có quyền truy cập khu vực này. Vui lòng sử dụng Guest Portal để đặt phòng.';
          }
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err.error?.Message || err.error?.message || 'Tài khoản hoặc mật khẩu không chính xác.';
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
