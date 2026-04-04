import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';

/**
 * Trang đăng ký dành cho KHÁCH HÀNG (Guest).
 * Role luôn là 'Guest' — không cho phép chọn chức vụ.
 * Admin tạo tài khoản nhân viên qua trang /staff/create trong Admin Dashboard.
 */
@Component({
  selector: 'app-register',
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
  templateUrl: './register.component.html',
  styleUrl: '../login/login.component.scss'
})
export class RegisterComponent implements OnDestroy {
  registerForm: FormGroup;
  hidePassword = true;
  hideConfirmPassword = true;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    // Khách hàng đã đăng nhập → redirect về trang chủ guest portal
    if (this.authService.isLoggedIn()) {
      const role = this.authService.getCurrentUser()?.role;
      if (role && role !== 'Guest') {
        this.router.navigate(['/dashboard']);
      } else if (role === 'Guest') {
        this.router.navigate(['/home']);
      }
    }

    this.registerForm = this.fb.group({
      fullName:        ['', [Validators.required, Validators.maxLength(150)]],
      email:           ['', [Validators.required, Validators.email]],
      password:        ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const pw  = control.get('password')?.value;
    const cpw = control.get('confirmPassword')?.value;
    if (pw && cpw && pw !== cpw) return { passwordsNotMatch: true };
    return null;
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const { fullName, email, password } = this.registerForm.value;
    const username = (email as string).split('@')[0];

    // Role cố định là 'Guest' — khách hàng không được chọn chức vụ
    this.authService.register({
      username,
      fullName,
      email,
      password,
      confirmPassword: password,
      role: 'Guest'
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.successMessage = `Tài khoản của "${fullName}" đã được tạo thành công! Bạn có thể đăng nhập ngay.`;
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage =
            err.error?.message ||
            err.error?.Message ||
            err.error?.errors?.[0] ||
            'Không thể tạo tài khoản. Email có thể đã được sử dụng.';
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
