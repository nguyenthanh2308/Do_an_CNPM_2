import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil } from 'rxjs';

/**
 * Trang TẠO TÀI KHOẢN NHÂN VIÊN — chỉ dành cho Admin.
 * Route: /staff/create (bảo vệ bởi roleGuard với data: { roles: ['Admin'] })
 */
@Component({
  selector: 'app-create-staff',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatCardModule,
    MatDividerModule,
    MatTooltipModule
  ],
  templateUrl: './create-staff.component.html',
  styleUrls: ['./create-staff.component.scss']
})
export class CreateStaffComponent implements OnDestroy {
  staffForm: FormGroup;
  hidePassword = true;
  isLoading = false;

  private destroy$ = new Subject<void>();

  roleOptions = [
    { value: 'Receptionist', label: 'Lễ tân',         icon: 'support_agent' },
    { value: 'Housekeeping', label: 'Buồng phòng',     icon: 'cleaning_services' },
    { value: 'Manager',      label: 'Quản lý',          icon: 'manage_accounts' },
    { value: 'Admin',        label: 'Quản trị viên',    icon: 'admin_panel_settings' },
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.staffForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.maxLength(150)]],
      email:    ['', [Validators.required, Validators.email]],
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50),
                      Validators.pattern(/^[a-zA-Z0-9._-]+$/)]],
      phone:    ['', [Validators.pattern(/^[0-9]{9,11}$/)]],
      role:     ['Receptionist', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    // Auto-generate username khi nhập email (chỉ khi user chưa tự nhập username)
    this.staffForm.get('email')?.valueChanges.subscribe((email: string) => {
      if (email && !this.staffForm.get('username')?.dirty) {
        const suggested = email.split('@')[0]
          .toLowerCase()
          .replace(/[^a-z0-9._-]/g, '');
        this.staffForm.get('username')?.setValue(suggested, { emitEvent: false });
      }
    });
  }

  onSubmit(): void {
    if (this.staffForm.invalid) {
      this.staffForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const { fullName, email, username, phone, role, password } = this.staffForm.value;

    this.authService.register({
      fullName,
      email,
      username,
      phone,
      password,
      confirmPassword: password,   // Backend yêu cầu ConfirmPassword khớp Password
      role
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.snackBar.open(
            `✅ Tài khoản "${fullName}" (${this.getRoleLabel(role)}) đã được tạo thành công!`,
            'Đóng', { duration: 5000, panelClass: 'snack-success' }
          );
          this.staffForm.reset({ role: 'Receptionist' });
        },
        error: (err: { error?: { message?: string; Message?: string; errors?: string[] } }) => {
          this.isLoading = false;
          const msg = err.error?.message || err.error?.Message || err.error?.errors?.[0]
            || 'Không thể tạo tài khoản. Email hoặc username có thể đã tồn tại.';
          this.snackBar.open(`❌ ${msg}`, 'Đóng', { duration: 5000, panelClass: 'snack-error' });
        }
      });
  }

  generatePassword(): void {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!';
    const pwd = Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    this.staffForm.patchValue({ password: pwd });
    this.hidePassword = false;
  }

  getRoleLabel(val: string): string {
    return this.roleOptions.find(r => r.value === val)?.label ?? val;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
