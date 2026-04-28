import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BookingService } from '../../../core/services/booking.service';
import { BookingDto } from '../../../core/models/models';

@Component({
  selector: 'app-booking-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatChipsModule,
    MatTooltipModule
  ],
  template: `
    <div class="detail-dialog">
      <!-- Header -->
      <div class="dialog-header" [ngClass]="'header-' + (booking?.status?.toLowerCase() || 'default')">
        <div class="header-left">
          <mat-icon class="header-icon">receipt_long</mat-icon>
          <div>
            <h2 class="dialog-title">Chi tiết Booking #{{ data.bookingId }}</h2>
            <span class="status-badge" [ngClass]="'badge-' + (booking?.status?.toLowerCase() || '')">
              {{ getStatusLabel(booking?.status || '') }}
            </span>
          </div>
        </div>
        <button mat-icon-button (click)="close()" class="close-btn">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Loading -->
      <div *ngIf="isLoading" class="loading-state">
        <mat-spinner diameter="40"></mat-spinner>
        <p>Đang tải thông tin...</p>
      </div>

      <!-- Content -->
      <div *ngIf="!isLoading && booking" class="dialog-content">

        <!-- Guest Info -->
        <div class="info-section">
          <h3 class="section-title">
            <mat-icon>person</mat-icon> Thông tin khách hàng
          </h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">Họ tên</span>
              <span class="value">{{ booking.guestName }}</span>
            </div>
            <div class="info-item" *ngIf="booking.guestEmail">
              <span class="label">Email</span>
              <span class="value">{{ booking.guestEmail }}</span>
            </div>
            <div class="info-item" *ngIf="booking.guestPhone">
              <span class="label">Điện thoại</span>
              <span class="value">{{ booking.guestPhone }}</span>
            </div>
            <div class="info-item">
              <span class="label">Số khách</span>
              <span class="value">{{ booking.numGuests }} người</span>
            </div>
          </div>
        </div>

        <mat-divider></mat-divider>

        <!-- Booking Info -->
        <div class="info-section">
          <h3 class="section-title">
            <mat-icon>hotel</mat-icon> Thông tin đặt phòng
          </h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">Loại phòng</span>
              <span class="value">{{ booking.roomTypeName }}</span>
            </div>
            <div class="info-item">
              <span class="label">Gói giá</span>
              <span class="value">{{ booking.ratePlanName }}</span>
            </div>
            <div class="info-item">
              <span class="label">Phòng</span>
              <span class="value rooms-list">
                <span *ngFor="let r of booking.rooms" class="room-tag">{{ r.roomNumber }}</span>
              </span>
            </div>
            <div class="info-item">
              <span class="label">Nguồn đặt</span>
              <span class="value">{{ booking.bookingSource }}</span>
            </div>
          </div>
        </div>

        <mat-divider></mat-divider>

        <!-- Date Info -->
        <div class="info-section">
          <h3 class="section-title">
            <mat-icon>calendar_today</mat-icon> Ngày lưu trú
          </h3>
          <div class="date-row">
            <div class="date-box">
              <span class="date-label">Check-in dự kiến</span>
              <span class="date-value">{{ formatDate(booking.checkInDate) }}</span>
              <span class="date-actual" *ngIf="booking.actualCheckIn">
                (Thực tế: {{ formatDate(booking.actualCheckIn) }})
              </span>
            </div>
            <div class="date-arrow">→</div>
            <div class="date-box">
              <span class="date-label">Check-out dự kiến</span>
              <span class="date-value">{{ formatDate(booking.checkOutDate) }}</span>
              <span class="date-actual" *ngIf="booking.actualCheckOut">
                (Thực tế: {{ formatDate(booking.actualCheckOut) }})
              </span>
            </div>
            <div class="nights-box">
              <span class="nights-num">{{ booking.nightCount }}</span>
              <span class="nights-label">đêm</span>
            </div>
          </div>
        </div>

        <mat-divider></mat-divider>

        <!-- Price Info -->
        <div class="info-section">
          <h3 class="section-title">
            <mat-icon>payments</mat-icon> Thông tin thanh toán
          </h3>
          <div class="price-breakdown">
            <div class="price-row">
              <span>Tổng cộng</span>
              <span>{{ formatCurrency(booking.totalAmount) }}</span>
            </div>
            <div class="price-row discount" *ngIf="booking.discountAmount > 0">
              <span>
                Giảm giá
                <span *ngIf="booking.promotionCode" class="promo-tag">{{ booking.promotionCode }}</span>
              </span>
              <span>- {{ formatCurrency(booking.discountAmount) }}</span>
            </div>
            <div class="price-row total">
              <span>Thành tiền</span>
              <span>{{ formatCurrency(booking.finalAmount) }}</span>
            </div>
          </div>
        </div>

        <!-- Notes -->
        <div class="info-section" *ngIf="booking.specialRequests || booking.notes">
          <mat-divider></mat-divider>
          <h3 class="section-title">
            <mat-icon>notes</mat-icon> Ghi chú
          </h3>
          <div *ngIf="booking.specialRequests" class="note-box">
            <strong>Yêu cầu đặc biệt:</strong> {{ booking.specialRequests }}
          </div>
          <div *ngIf="booking.notes" class="note-box">
            <strong>Ghi chú nội bộ:</strong> {{ booking.notes }}
          </div>
        </div>

        <!-- Meta -->
        <div class="meta-info">
          <span>Tạo bởi: {{ booking.createdByUserName || 'Khách tự đặt' }}</span>
          <span>Ngày tạo: {{ formatDate(booking.createdAt) }}</span>
        </div>
      </div>

      <!-- Error -->
      <div *ngIf="!isLoading && !booking" class="error-state">
        <mat-icon>error_outline</mat-icon>
        <p>Không thể tải thông tin booking.</p>
      </div>

      <!-- Footer -->
      <div class="dialog-footer">
        <button mat-button (click)="close()">Đóng</button>
      </div>
    </div>
  `,
  styles: [`
    .detail-dialog { display: flex; flex-direction: column; min-width: 680px; max-width: 780px; background: #1e293b; color: #e2e8f0; border-radius: 16px; overflow: hidden; }
    .dialog-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; background: linear-gradient(135deg, #334155, #1e293b); border-bottom: 1px solid rgba(255,255,255,0.08); }
    .header-left { display: flex; align-items: center; gap: 16px; }
    .header-icon { font-size: 2rem; width: 2rem; height: 2rem; color: #818cf8; }
    .dialog-title { margin: 0 0 4px; font-size: 1.25rem; font-weight: 600; color: #f1f5f9; }
    .close-btn { color: #94a3b8; }
    .status-badge { padding: 3px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; }
    .badge-confirmed { background: rgba(34,197,94,0.15); color: #4ade80; }
    .badge-checkedin { background: rgba(59,130,246,0.15); color: #60a5fa; }
    .badge-completed { background: rgba(99,102,241,0.15); color: #818cf8; }
    .badge-cancelled { background: rgba(239,68,68,0.15); color: #f87171; }
    .badge-pending { background: rgba(234,179,8,0.15); color: #facc15; }
    .loading-state, .error-state { display: flex; flex-direction: column; align-items: center; padding: 40px; gap: 16px; color: #94a3b8; }
    .dialog-content { padding: 0 24px; overflow-y: auto; max-height: 65vh; }
    .info-section { padding: 16px 0; }
    .section-title { display: flex; align-items: center; gap: 8px; font-size: 0.9rem; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 12px; }
    .section-title mat-icon { font-size: 1.1rem; width: 1.1rem; height: 1.1rem; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .info-item { display: flex; flex-direction: column; gap: 2px; }
    .label { font-size: 0.75rem; color: #64748b; }
    .value { font-size: 0.9rem; color: #e2e8f0; font-weight: 500; }
    .rooms-list { display: flex; flex-wrap: wrap; gap: 6px; }
    .room-tag { background: rgba(99,102,241,0.2); color: #818cf8; padding: 2px 8px; border-radius: 6px; font-size: 0.8rem; font-weight: 600; }
    .date-row { display: flex; align-items: center; gap: 12px; }
    .date-box { flex: 1; background: rgba(255,255,255,0.04); border-radius: 10px; padding: 12px; text-align: center; }
    .date-label { display: block; font-size: 0.75rem; color: #64748b; }
    .date-value { display: block; font-size: 1rem; font-weight: 600; color: #f1f5f9; margin-top: 4px; }
    .date-actual { display: block; font-size: 0.75rem; color: #4ade80; margin-top: 4px; }
    .date-arrow { font-size: 1.5rem; color: #475569; }
    .nights-box { text-align: center; background: rgba(99,102,241,0.15); border-radius: 10px; padding: 12px 20px; }
    .nights-num { display: block; font-size: 1.5rem; font-weight: 700; color: #818cf8; }
    .nights-label { font-size: 0.75rem; color: #94a3b8; }
    .price-breakdown { background: rgba(255,255,255,0.04); border-radius: 10px; padding: 16px; }
    .price-row { display: flex; justify-content: space-between; padding: 6px 0; color: #94a3b8; font-size: 0.9rem; }
    .price-row.discount { color: #4ade80; }
    .price-row.total { border-top: 1px solid rgba(255,255,255,0.1); margin-top: 8px; padding-top: 12px; font-size: 1.1rem; font-weight: 700; color: #f1f5f9; }
    .promo-tag { background: rgba(234,179,8,0.15); color: #facc15; padding: 2px 6px; border-radius: 4px; font-size: 0.75rem; margin-left: 6px; }
    .note-box { background: rgba(255,255,255,0.04); border-radius: 8px; padding: 10px 14px; margin-bottom: 8px; font-size: 0.875rem; color: #cbd5e1; }
    .meta-info { display: flex; justify-content: space-between; padding: 8px 0 4px; font-size: 0.75rem; color: #475569; border-top: 1px solid rgba(255,255,255,0.06); margin-top: 8px; }
    .dialog-footer { display: flex; justify-content: flex-end; padding: 16px 24px; border-top: 1px solid rgba(255,255,255,0.08); }
    mat-divider { border-color: rgba(255,255,255,0.06) !important; }
  `]
})
export class BookingDetailDialogComponent implements OnInit {
  booking: BookingDto | null = null;
  isLoading = true;

  constructor(
    public dialogRef: MatDialogRef<BookingDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { bookingId: number },
    private bookingService: BookingService
  ) {}

  ngOnInit(): void {
    this.bookingService.getById(this.data.bookingId).subscribe({
      next: res => { this.booking = res.data; this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });
  }

  close(): void { this.dialogRef.close(); }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      Pending: 'Chờ xác nhận', Confirmed: 'Đã xác nhận',
      CheckedIn: 'Đang ở', Completed: 'Hoàn thành', Cancelled: 'Đã hủy'
    };
    return map[status] ?? status;
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  }
}
