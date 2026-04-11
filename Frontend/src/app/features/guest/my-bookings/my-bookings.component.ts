import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BookingService } from '../../../core/services/booking.service';
import { AuthService } from '../../../core/services/auth.service';
import { BookingSummaryDto, UserInfo } from '../../../core/models/models';
import { Subject, takeUntil } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-my-bookings',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule
  ],
  templateUrl: './my-bookings.component.html',
  styleUrl: './my-bookings.component.scss'
})
export class MyBookingsComponent implements OnInit, OnDestroy {
  bookings: BookingSummaryDto[] = [];
  isLoading = true;
  filterStatus = '';
  currentUser: UserInfo | null = null;

  private destroy$ = new Subject<void>();

  statusConfig = {
    'Pending': { label: 'Chờ xác nhận', color: 'status-pending', icon: 'schedule' },
    'Confirmed': { label: 'Đã xác nhận', color: 'status-confirmed', icon: 'check_circle' },
    'CheckedIn': { label: 'Đã nhận phòng', color: 'status-checkedin', icon: 'login' },
    'Completed': { label: 'Hoàn thành', color: 'status-completed', icon: 'done_all' },
    'Cancelled': { label: 'Đã hủy', color: 'status-cancelled', icon: 'cancel' }
  };

  constructor(
    private fb: FormBuilder,
    private bookingService: BookingService,
    private authService: AuthService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.currentUser = this.authService.getCurrentUser();
  }

  ngOnInit(): void {
    this.loadMyBookings();
  }

  loadMyBookings(): void {
    this.isLoading = true;
    if (!this.currentUser) return;

    this.bookingService.getByGuest(this.currentUser.userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.bookings = res.data || [];
          this.isLoading = false;
        },
        error: (err) => {
          this.showError('Không thể tải danh sách đặt phòng');
          this.isLoading = false;
        }
      });
  }

  filterByStatus(status: string): void {
    this.filterStatus = this.filterStatus === status ? '' : status;
  }

  getFilteredBookings(): BookingSummaryDto[] {
    if (!this.filterStatus) return this.bookings;
    return this.bookings.filter(b => b.status === this.filterStatus);
  }

  getStatusLabel(status: string): string {
    return (this.statusConfig as any)[status]?.label || status;
  }

  getStatusIcon(status: string): string {
    return (this.statusConfig as any)[status]?.icon || 'info';
  }

  getStatusClass(status: string): string {
    return (this.statusConfig as any)[status]?.color || '';
  }

  canCancel(booking: BookingSummaryDto): boolean {
    return booking.status !== 'Cancelled' && booking.status !== 'Completed' && booking.status !== 'CheckedIn';
  }

  openCancelDialog(booking: BookingSummaryDto): void {
    const dialogId = `cancel-${booking.bookingId}`;
    const form = this.fb.group({
      reason: ['', [Validators.required, Validators.minLength(10)]]
    });

    const dialogRef = this.dialog.open(CancelBookingDialog, {
      width: '400px',
      data: { booking, form }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.cancelBooking(booking.bookingId, result.reason);
      }
    });
  }

  cancelBooking(bookingId: number, reason: string): void {
    this.bookingService.cancel(bookingId, reason)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showSuccess('Đặt phòng đã được hủy thành công');
          this.loadMyBookings();
        },
        error: (err) => {
          this.showError(err.error?.message || 'Không thể hủy đặt phòng');
        }
      });
  }

  viewDetails(booking: BookingSummaryDto): void {
    this.router.navigate(['/guest/booking-detail'], {
      queryParams: { bookingId: booking.bookingId }
    });
  }

  getNightCount(booking: BookingSummaryDto): number {
    const checkIn = new Date(booking.checkInDate);
    const checkOut = new Date(booking.checkOutDate);
    return Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  }

  private showSuccess(msg: string): void {
    this.snackBar.open(msg, 'Đóng', { duration: 4000, panelClass: 'snack-success' });
  }

  private showError(msg: string): void {
    this.snackBar.open(msg, 'Đóng', { duration: 4000, panelClass: 'snack-error' });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

// ── Cancel Booking Dialog ────────────────────────────────────────────────
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Inject } from '@angular/core';

@Component({
  selector: 'app-cancel-booking-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule
  ],
  template: `
    <div class="dialog-header">
      <h2>Hủy đặt phòng</h2>
      <button mat-icon-button (click)="onCancel()">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <div class="dialog-content">
      <p class="warning">
        <mat-icon>warning</mat-icon>
        Bạn sắp hủy đặt phòng cho <strong>{{ data.booking.roomTypeName }}</strong>
        ({{ data.booking.checkInDate | date:'dd/MM/yyyy' }} - {{ data.booking.checkOutDate | date:'dd/MM/yyyy' }})
      </p>

      <form [formGroup]="data.form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Lý do hủy phòng</mat-label>
          <mat-icon matPrefix>description</mat-icon>
          <textarea matInput formControlName="reason" 
                    placeholder="Vui lòng cho chúng tôi biết lý do hủy đặt phòng..."
                    rows="4"></textarea>
          <mat-hint align="end">Tối thiểu 10 ký tự</mat-hint>
          <mat-error *ngIf="data.form.get('reason')?.hasError('required')">
            Lý do là bắt buộc
          </mat-error>
          <mat-error *ngIf="data.form.get('reason')?.hasError('minlength')">
            Lý do phải tối thiểu 10 ký tự
          </mat-error>
        </mat-form-field>
      </form>

      <div class="refund-info">
        <h3>
          <mat-icon>info</mat-icon>
          Chính sách hoàn tiền
        </h3>
        <ul>
          <li>Hủy phòng trước 48 giờ: Hoàn lại 100%</li>
          <li>Hủy phòng 24-48 giờ: Hoàn lại 50%</li>
          <li>Hủy phòng dưới 24 giờ: Không hoàn lại</li>
        </ul>
      </div>
    </div>

    <div class="dialog-actions">
      <button mat-stroked-button (click)="onCancel()">
        <mat-icon>close</mat-icon>
        Hủy bỏ
      </button>
      <button mat-flat-button class="btn-confirm" 
              (click)="onConfirm()"
              [disabled]="data.form.invalid">
        <mat-icon>check_circle</mat-icon>
        Xác nhận hủy
      </button>
    </div>
  `,
  styles: [`
    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      border-bottom: 1px solid #e5e7eb;

      h2 {
        margin: 0;
        color: #1f2937;
      }
    }

    .dialog-content {
      padding: 20px;
    }

    .warning {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: rgba(220, 38, 38, 0.1);
      border-left: 4px solid #dc2626;
      border-radius: 8px;
      color: #7f1d1d;
      margin-bottom: 20px;

      mat-icon {
        color: #dc2626;
      }
    }

    .full-width {
      width: 100%;
      margin-bottom: 20px;
    }

    .refund-info {
      background: #f9fafb;
      padding: 16px;
      border-radius: 12px;
      border-left: 4px solid #7c3aed;

      h3 {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0 0 12px 0;
        color: #7c3aed;
        font-size: 0.95rem;

        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
        }
      }

      ul {
        margin: 0;
        padding-left: 20px;
        color: #6b7280;
        font-size: 0.85rem;

        li {
          margin: 6px 0;
        }
      }
    }

    .dialog-actions {
      display: flex;
      gap: 12px;
      padding: 16px;
      border-top: 1px solid #e5e7eb;
      justify-content: flex-end;

      button {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .btn-confirm {
        background: linear-gradient(135deg, #dc2626, #b91c1c);
        color: white;

        &:hover:not(:disabled) {
          box-shadow: 0 8px 16px rgba(220, 38, 38, 0.3);
        }

        &:disabled {
          background: #d1d5db;
          color: #9ca3af;
        }
      }
    }
  `]
})
export class CancelBookingDialog {
  constructor(
    public dialogRef: MatDialogRef<CancelBookingDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  onCancel(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    if (this.data.form.valid) {
      this.dialogRef.close(this.data.form.value);
    }
  }
}
