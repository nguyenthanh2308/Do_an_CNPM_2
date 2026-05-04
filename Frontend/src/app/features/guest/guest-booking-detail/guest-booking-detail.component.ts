import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { GuestHeaderComponent } from '../components/guest-header.component';
import { BookingService } from '../../../core/services/booking.service';
import { BookingDto } from '../../../core/models/models';

@Component({
  selector: 'app-guest-booking-detail',
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
  templateUrl: './guest-booking-detail.component.html',
  styleUrl: './guest-booking-detail.component.scss'
})
export class GuestBookingDetailComponent implements OnInit, OnDestroy {
  booking: BookingDto | null = null;
  isLoading = true;
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly bookingService: BookingService,
    private readonly snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = Number(params.get('bookingId'));
      if (!Number.isFinite(id) || id <= 0) {
        this.snackBar.open('Mã đặt phòng không hợp lệ.', 'Đóng', { duration: 3500 });
        this.router.navigate(['/guest/my-bookings']);
        return;
      }
      this.loadBooking(id);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadBooking(id: number): void {
    this.isLoading = true;
    this.booking = null;
    this.bookingService.getById(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.booking = res.data;
        this.isLoading = false;
      },
      error: (err) => {
        const msg = err.error?.errors?.[0] ?? 'Không thể tải chi tiết đặt phòng.';
        this.snackBar.open(msg, 'Đóng', { duration: 4000 });
        this.isLoading = false;
        this.router.navigate(['/guest/my-bookings']);
      }
    });
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      Pending: 'Chờ xác nhận',
      Confirmed: 'Đã xác nhận',
      CheckedIn: 'Đã nhận phòng',
      Completed: 'Hoàn thành',
      Cancelled: 'Đã hủy'
    };
    return map[status] ?? status;
  }

  backToList(): void {
    this.router.navigate(['/guest/my-bookings']);
  }
}
