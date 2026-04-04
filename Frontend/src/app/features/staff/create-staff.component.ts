import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
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
    MatDividerModule
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
    { value: 'Housekeeping', label: 'Buồng phòng',    icon: 'cleaning_services' },
    { value: 'Manager',      label: 'Quản lý',         icon: 'manage_accounts' },
    { value: 'Admin',        label: 'Quản trị viên',   icon: 'admin_panel_settings' },
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
      role:     ['Receptionist', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    if (this.staffForm.invalid) {
      this.staffForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const { fullName, email, role, password } = this.staffForm.value;

    this.authService.register({ fullName, email, password, role })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.snackBar.open(
            `✅ Tài khoản "${fullName}" (${role}) đã được tạo thành công!`,
            'Đóng', { duration: 5000, panelClass: 'snack-success' }
          );
          this.staffForm.reset({ role: 'Receptionist' });
        },
        error: (err: { error?: { message?: string; Message?: string; errors?: string[] } }) => {
          this.isLoading = false;
          const msg = err.error?.message || err.error?.Message || err.error?.errors?.[0]
            || 'Không thể tạo tài khoản. Email có thể đã tồn tại.';
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
