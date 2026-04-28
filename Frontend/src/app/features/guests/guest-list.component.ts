import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { GuestService, GuestDto } from '../../core/services/guest.service';
import { BookingService } from '../../core/services/booking.service';
import { BookingSummaryDto } from '../../core/models/models';

@Component({
  selector: 'app-guest-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatDialogModule,
    MatChipsModule,
    MatDividerModule
  ],
  template: `
    <div class="guest-page">

      <!-- Header -->
      <div class="page-header">
        <div class="header-left">
          <h1 class="page-title">
            <mat-icon>group</mat-icon>
            Quản lý Khách hàng
          </h1>
          <span class="total-badge">{{ totalCount }} khách</span>
        </div>
      </div>

      <!-- Search + Filter -->
      <mat-card class="filter-card">
        <form [formGroup]="filterForm" class="filter-form">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Tìm khách hàng</mat-label>
            <mat-icon matPrefix>search</mat-icon>
            <input matInput formControlName="search" placeholder="Tên, email, số điện thoại..." id="guestSearch">
            <button mat-icon-button matSuffix *ngIf="filterForm.get('search')?.value"
                    (click)="filterForm.patchValue({search:''})">
              <mat-icon>close</mat-icon>
            </button>
          </mat-form-field>
        </form>
      </mat-card>

      <!-- Loading -->
      <mat-progress-bar *ngIf="isLoading" mode="indeterminate" color="primary"></mat-progress-bar>

      <!-- Table -->
      <mat-card class="table-card">
        <div class="table-wrapper">
          <table mat-table [dataSource]="dataSource" class="guest-table">

            <!-- STT -->
            <ng-container matColumnDef="index">
              <th mat-header-cell *matHeaderCellDef>#</th>
              <td mat-cell *matCellDef="let g; let i = index">{{ (currentPage - 1) * pageSize + i + 1 }}</td>
            </ng-container>

            <!-- Họ tên -->
            <ng-container matColumnDef="fullName">
              <th mat-header-cell *matHeaderCellDef>Khách hàng</th>
              <td mat-cell *matCellDef="let g">
                <div class="guest-cell">
                  <div class="guest-avatar">{{ g.fullName.charAt(0).toUpperCase() }}</div>
                  <div class="guest-info">
                    <span class="guest-name">{{ g.fullName }}</span>
                    <span class="guest-email" *ngIf="g.email">{{ g.email }}</span>
                  </div>
                </div>
              </td>
            </ng-container>

            <!-- Điện thoại -->
            <ng-container matColumnDef="phone">
              <th mat-header-cell *matHeaderCellDef>Điện thoại</th>
              <td mat-cell *matCellDef="let g">
                <span class="phone-text">{{ g.phone || '—' }}</span>
              </td>
            </ng-container>

            <!-- CCCD/Passport -->
            <ng-container matColumnDef="idNumber">
              <th mat-header-cell *matHeaderCellDef>CCCD / Passport</th>
              <td mat-cell *matCellDef="let g">
                <span *ngIf="g.idNumber" class="id-badge">
                  {{ g.idType || 'CCCD' }}: {{ g.idNumber }}
                </span>
                <span *ngIf="!g.idNumber" class="na-text">—</span>
              </td>
            </ng-container>

            <!-- Quốc tịch -->
            <ng-container matColumnDef="nationality">
              <th mat-header-cell *matHeaderCellDef>Quốc tịch</th>
              <td mat-cell *matCellDef="let g">{{ g.nationality || '—' }}</td>
            </ng-container>

            <!-- Ngày tạo -->
            <ng-container matColumnDef="createdAt">
              <th mat-header-cell *matHeaderCellDef>Ngày tạo</th>
              <td mat-cell *matCellDef="let g">{{ formatDate(g.createdAt) }}</td>
            </ng-container>

            <!-- Actions -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Thao tác</th>
              <td mat-cell *matCellDef="let g">
                <button mat-icon-button color="primary" (click)="viewGuestDetail(g)"
                        matTooltip="Xem chi tiết & lịch sử booking">
                  <mat-icon>visibility</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns; sticky: true"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="table-row"></tr>

            <tr class="mat-row" *matNoDataRow>
              <td class="mat-cell empty-cell" [attr.colspan]="displayedColumns.length">
                <div class="empty-state">
                  <mat-icon>person_search</mat-icon>
                  <p>Không tìm thấy khách hàng nào</p>
                </div>
              </td>
            </tr>
          </table>
        </div>

        <mat-paginator [length]="totalCount" [pageSize]="pageSize"
                       [pageSizeOptions]="[10, 20, 50]" (page)="onPage($event)"
                       showFirstLastButtons>
        </mat-paginator>
      </mat-card>

      <!-- Detail Panel (overlay) -->
      <div *ngIf="selectedGuest" class="detail-panel-overlay" (click)="closeDetail()">
        <div class="detail-panel" (click)="$event.stopPropagation()">
          <div class="detail-header">
            <div class="detail-avatar-large">{{ selectedGuest.fullName.charAt(0).toUpperCase() }}</div>
            <div>
              <h2>{{ selectedGuest.fullName }}</h2>
              <p>{{ selectedGuest.email || 'Không có email' }}</p>
            </div>
            <button mat-icon-button (click)="closeDetail()" class="close-btn">
              <mat-icon>close</mat-icon>
            </button>
          </div>

          <div class="detail-body">
            <div class="detail-grid">
              <div class="detail-item" *ngIf="selectedGuest.phone">
                <span class="d-label">Điện thoại</span>
                <span class="d-value">{{ selectedGuest.phone }}</span>
              </div>
              <div class="detail-item" *ngIf="selectedGuest.idNumber">
                <span class="d-label">{{ selectedGuest.idType || 'CCCD' }}</span>
                <span class="d-value">{{ selectedGuest.idNumber }}</span>
              </div>
              <div class="detail-item" *ngIf="selectedGuest.nationality">
                <span class="d-label">Quốc tịch</span>
                <span class="d-value">{{ selectedGuest.nationality }}</span>
              </div>
              <div class="detail-item" *ngIf="selectedGuest.address">
                <span class="d-label">Địa chỉ</span>
                <span class="d-value">{{ selectedGuest.address }}</span>
              </div>
            </div>

            <mat-divider style="margin: 16px 0; border-color: rgba(255,255,255,0.08)"></mat-divider>

            <h3 class="bookings-title">
              <mat-icon>event_note</mat-icon> Lịch sử đặt phòng
            </h3>
            <div *ngIf="isLoadingBookings" class="loading-bookings">
              <mat-spinner diameter="28"></mat-spinner>
            </div>
            <div *ngIf="!isLoadingBookings && guestBookings.length === 0" class="no-bookings">
              Chưa có lần đặt phòng nào.
            </div>
            <div *ngFor="let b of guestBookings" class="booking-item">
              <span class="booking-badge">#{{ b.bookingId }}</span>
              <span class="booking-room">{{ b.roomTypeName }} - {{ b.roomNumbers }}</span>
              <span class="booking-date">{{ formatDate(b.checkInDate) }} → {{ formatDate(b.checkOutDate) }}</span>
              <span class="booking-status" [ngClass]="'st-' + b.status.toLowerCase()">{{ b.status }}</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .guest-page { padding: 0; }
    .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
    .header-left { display: flex; align-items: center; gap: 16px; }
    .page-title { display: flex; align-items: center; gap: 10px; font-size: 1.5rem; font-weight: 700; color: #f1f5f9; margin: 0; }
    .total-badge { background: rgba(99,102,241,0.15); color: #818cf8; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; }
    .filter-card { background: rgba(30,41,59,0.8) !important; border: 1px solid rgba(255,255,255,0.06) !important; border-radius: 12px !important; margin-bottom: 16px; padding: 16px 20px !important; }
    .filter-form { display: flex; gap: 12px; align-items: flex-start; }
    .search-field { flex: 1; }
    .table-card { background: rgba(30,41,59,0.8) !important; border: 1px solid rgba(255,255,255,0.06) !important; border-radius: 12px !important; overflow: hidden; }
    .table-wrapper { overflow-x: auto; }
    .guest-table { width: 100%; background: transparent; }
    .guest-cell { display: flex; align-items: center; gap: 10px; }
    .guest-avatar { width: 38px; height: 38px; border-radius: 50%; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1rem; flex-shrink: 0; }
    .guest-info { display: flex; flex-direction: column; }
    .guest-name { font-weight: 600; color: #f1f5f9; }
    .guest-email { font-size: 0.8rem; color: #64748b; }
    .phone-text { color: #94a3b8; font-size: 0.875rem; }
    .id-badge { background: rgba(99,102,241,0.12); color: #818cf8; padding: 2px 8px; border-radius: 6px; font-size: 0.8rem; }
    .na-text { color: #475569; }
    .table-row:hover { background: rgba(99,102,241,0.05) !important; }
    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 48px; gap: 12px; color: #475569; }
    .empty-state mat-icon { font-size: 3rem; width: 3rem; height: 3rem; }
    /* Detail Panel */
    .detail-panel-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 1000; display: flex; align-items: flex-start; justify-content: flex-end; }
    .detail-panel { background: #1e293b; border-left: 1px solid rgba(255,255,255,0.08); width: 420px; height: 100vh; overflow-y: auto; display: flex; flex-direction: column; }
    .detail-header { display: flex; align-items: center; gap: 16px; padding: 24px; background: linear-gradient(135deg, #312e81, #1e293b); }
    .detail-avatar-large { width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 700; flex-shrink: 0; }
    .detail-header h2 { margin: 0 0 4px; color: #f1f5f9; font-size: 1.1rem; }
    .detail-header p { margin: 0; color: #94a3b8; font-size: 0.85rem; }
    .close-btn { margin-left: auto; color: #64748b; }
    .detail-body { padding: 20px; flex: 1; }
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .detail-item { display: flex; flex-direction: column; gap: 2px; }
    .d-label { font-size: 0.75rem; color: #64748b; text-transform: uppercase; }
    .d-value { color: #e2e8f0; font-weight: 500; font-size: 0.9rem; }
    .bookings-title { display: flex; align-items: center; gap: 8px; color: #94a3b8; font-size: 0.85rem; text-transform: uppercase; font-weight: 600; margin: 0 0 12px; }
    .loading-bookings { display: flex; justify-content: center; padding: 20px; }
    .no-bookings { color: #475569; text-align: center; padding: 20px; font-size: 0.875rem; }
    .booking-item { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding: 8px 12px; border-radius: 8px; background: rgba(255,255,255,0.03); margin-bottom: 6px; font-size: 0.8rem; }
    .booking-badge { background: rgba(99,102,241,0.15); color: #818cf8; padding: 2px 6px; border-radius: 4px; font-weight: 600; }
    .booking-room { color: #e2e8f0; flex: 1; }
    .booking-date { color: #64748b; }
    .booking-status { padding: 2px 8px; border-radius: 4px; font-weight: 600; }
    .st-confirmed { background: rgba(34,197,94,0.1); color: #4ade80; }
    .st-checkedin { background: rgba(59,130,246,0.1); color: #60a5fa; }
    .st-completed { background: rgba(99,102,241,0.1); color: #818cf8; }
    .st-cancelled { background: rgba(239,68,68,0.1); color: #f87171; }
    .st-pending { background: rgba(234,179,8,0.1); color: #facc15; }
  `]
})
export class GuestListComponent implements OnInit, OnDestroy {
  displayedColumns = ['index', 'fullName', 'phone', 'idNumber', 'nationality', 'createdAt', 'actions'];
  dataSource = new MatTableDataSource<GuestDto>([]);
  totalCount = 0;
  currentPage = 1;
  pageSize = 20;
  isLoading = false;

  filterForm: FormGroup;
  selectedGuest: GuestDto | null = null;
  guestBookings: BookingSummaryDto[] = [];
  isLoadingBookings = false;

  private destroy$ = new Subject<void>();

  constructor(
    private guestService: GuestService,
    private bookingService: BookingService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.filterForm = this.fb.group({ search: [''] });
  }

  ngOnInit(): void {
    this.loadGuests();
    this.filterForm.get('search')?.valueChanges.pipe(
      debounceTime(500), distinctUntilChanged(), takeUntil(this.destroy$)
    ).subscribe(() => { this.currentPage = 1; this.loadGuests(); });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  loadGuests(): void {
    this.isLoading = true;
    const { search } = this.filterForm.value;
    this.guestService.getAll({ search: search || undefined, page: this.currentPage, pageSize: this.pageSize })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.dataSource.data = res.data.data;
          this.totalCount = res.data.totalCount;
          this.isLoading = false;
        },
        error: () => {
          this.snackBar.open('Không thể tải danh sách khách hàng.', 'Đóng', { duration: 3000 });
          this.isLoading = false;
        }
      });
  }

  onPage(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadGuests();
  }

  viewGuestDetail(guest: GuestDto): void {
    this.selectedGuest = guest;
    this.guestBookings = [];
    this.isLoadingBookings = true;
    this.bookingService.getByGuest(guest.guestId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => { this.guestBookings = res.data; this.isLoadingBookings = false; },
        error: () => { this.isLoadingBookings = false; }
      });
  }

  closeDetail(): void { this.selectedGuest = null; }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
}
