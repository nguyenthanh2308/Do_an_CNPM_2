import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { GuestHeaderComponent } from '../components/guest-header.component';
import { GuestAccountService, GuestProfileDto } from '../../../core/services/guest-account.service';

@Component({
  selector: 'app-guest-profile-view',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    GuestHeaderComponent,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './guest-profile-view.component.html',
  styleUrl: './guest-profile-view.component.scss'
})
export class GuestProfileViewComponent implements OnInit, OnDestroy {
  profile: GuestProfileDto | null = null;
  isLoading = true;
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly guestAccount: GuestAccountService,
    private readonly snackBar: MatSnackBar,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.guestAccount.getProfile().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.profile = res.data;
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

  goEdit(): void {
    this.router.navigate(['/guest/profile/edit']);
  }

  formatDob(iso: string | null | undefined): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('vi-VN');
  }
}
