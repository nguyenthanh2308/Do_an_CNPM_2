import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { GuestHeaderComponent } from '../components/guest-header.component';
import { GuestAccountService, GuestProfileDto } from '../../../core/services/guest-account.service';

@Component({
  selector: 'app-guest-profile-edit',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    GuestHeaderComponent,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './guest-profile-edit.component.html',
  styleUrl: './guest-profile-edit.component.scss'
})
export class GuestProfileEditComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  isLoading = true;
  isSaving = false;
  profile: GuestProfileDto | null = null;
  readonly idTypes = ['CCCD', 'Passport', 'Other'];
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly fb: FormBuilder,
    private readonly guestAccount: GuestAccountService,
    private readonly snackBar: MatSnackBar,
    private readonly router: Router
  ) {
    this.form = this.fb.group({
      fullName: ['', [Validators.required, Validators.maxLength(150)]],
      email: ['', [Validators.email, Validators.maxLength(200)]],
      phone: ['', [Validators.maxLength(20)]],
      idNumber: ['', [Validators.maxLength(50)]],
      idType: ['CCCD'],
      nationality: ['', [Validators.maxLength(100)]],
      dateOfBirth: [null as Date | null],
      address: ['', [Validators.maxLength(500)]]
    });
  }

  ngOnInit(): void {
    this.guestAccount.getProfile().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.profile = res.data;
        this.patchForm(res.data);
        this.isLoading = false;
      },
      error: () => {
        this.snackBar.open('Không thể tải hồ sơ.', 'Đóng', { duration: 4000 });
        this.isLoading = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cancel(): void {
    this.router.navigate(['/guest/profile']);
  }

  private patchForm(p: GuestProfileDto): void {
    let dob: Date | null = null;
    if (p.dateOfBirth) {
      const d = new Date(p.dateOfBirth);
      if (!Number.isNaN(d.getTime())) {
        dob = d;
      }
    }
    this.form.patchValue({
      fullName: p.fullName,
      email: p.email ?? '',
      phone: p.phone ?? '',
      idNumber: p.idNumber ?? '',
      idType: p.idType || 'CCCD',
      nationality: p.nationality ?? '',
      dateOfBirth: dob,
      address: p.address ?? ''
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.value;
    this.isSaving = true;
    this.guestAccount
      .updateProfile({
        fullName: v.fullName,
        email: v.email || undefined,
        phone: v.phone || undefined,
        idNumber: v.idNumber || undefined,
        idType: v.idType,
        nationality: v.nationality || undefined,
        dateOfBirth: v.dateOfBirth
          ? new Date(v.dateOfBirth.getTime() - v.dateOfBirth.getTimezoneOffset() * 60000).toISOString().split('T')[0]
          : null,
        address: v.address || undefined
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.profile = res.data;
          this.patchForm(res.data);
          this.snackBar.open('Đã lưu hồ sơ.', 'Đóng', { duration: 3000 });
          this.isSaving = false;
          this.router.navigate(['/guest/profile']);
        },
        error: (err) => {
          const msg = err.error?.errors?.[0] ?? 'Không thể lưu hồ sơ.';
          this.snackBar.open(msg, 'Đóng', { duration: 4000 });
          this.isSaving = false;
        }
      });
  }
}
