import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { BookingService } from '../../../core/services/booking.service';
import { AuthService } from '../../../core/services/auth.service';
import { BookingSummaryDto, BookingFilterDto } from '../../../core/models/models';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CheckoutDialogComponent } from '../checkout-dialog/checkout-dialog.component';
import { BookingDetailDialogComponent } from '../booking-detail-dialog/booking-detail-dialog.component';
import { EditBookingDialogComponent } from '../edit-booking-dialog/edit-booking-dialog.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-booking-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatSnackBarModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatChipsModule,
    MatDividerModule
  ],
  templateUrl: './booking-list.component.html',
  styleUrls: ['./booking-list.component.scss']
})
export class BookingListComponent implements OnInit, OnDestroy {

  // ── Table ──────────────────────────────────────────────────────────────
  displayedColumns = ['bookingId', 'guestName', 'roomInfo', 'dates', 'status', 'finalAmount', 'actions'];
  dataSource = new MatTableDataSource<BookingSummaryDto>([]);
  totalCount = 0;
  isLoading = false;

  // ── Pagination ─────────────────────────────────────────────────────────
  currentPage = 1;
  pageSize = 20;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // ── Filter ─────────────────────────────────────────────────────────────
  filterForm: FormGroup;
  statusOptions = [
    { value: '',           label: 'Tất cả',       icon: 'list' },
    { value: 'Pending',    label: 'Chờ xác nhận', icon: 'schedule' },
    { value: 'Confirmed',  label: 'Đã xác nhận',  icon: 'verified' },
    { value: 'CheckedIn',  label: 'Đang ở',        icon: 'login' },
    { value: 'Completed',  label: 'Hoàn thành',    icon: 'check_circle' },
    { value: 'Cancelled',  label: 'Đã hủy',        icon: 'cancel' },
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private bookingService: BookingService,
    public authService: AuthService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      guestName: [''],
      status: [''],
      checkInFrom: [null],
      checkInTo: [null]
    });
  }

  ngOnInit(): void {
    this.loadBookings();

    this.filterForm.get('guestName')?.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => this.onSearch());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  buildFilter(): BookingFilterDto {
    const { guestName, status, checkInFrom, checkInTo } = this.filterForm.value;
    return {
      guestName: guestName || undefined,
      status: status || undefined,
      checkInFrom: checkInFrom ? new Date(checkInFrom).toISOString() : undefined,
      checkInTo: checkInTo ? new Date(checkInTo).toISOString() : undefined,
      page: this.currentPage,
      pageSize: this.pageSize
    };
  }

  loadBookings(): void {
    this.isLoading = true;
    this.bookingService.getAll(this.buildFilter()).pipe(takeUntil(this.destroy$)).subscribe({
      next: res => {
        this.dataSource.data = res.data.data;
        this.totalCount = res.data.totalCount;
        this.dataSource.sort = this.sort;
        this.isLoading = false;
      },
      error: () => {
        this.showError('Không thể tải danh sách booking.');
        this.isLoading = false;
      }
    });
  }

  onSearch(): void { this.currentPage = 1; this.loadBookings(); }
  onStatusFilter(status: string): void {
    this.filterForm.patchValue({ status }, { emitEvent: false });
    this.currentPage = 1;
    this.loadBookings();
  }
  onPage(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadBookings();
  }
  clearFilters(): void {
    this.filterForm.reset({ guestName: '', status: '', checkInFrom: null, checkInTo: null });
    this.currentPage = 1;
    this.loadBookings();
  }

  // ── Actions ────────────────────────────────────────────────────────────

  viewDetail(booking: BookingSummaryDto): void {
    this.dialog.open(BookingDetailDialogComponent, {
      width: '780px',
      maxHeight: '90vh',
      data: { bookingId: booking.bookingId },
      panelClass: 'dark-dialog'
    });
  }

  editBooking(booking: BookingSummaryDto): void {
    const dialogRef = this.dialog.open(EditBookingDialogComponent, {
      width: '600px',
      data: { bookingId: booking.bookingId, guestName: booking.guestName },
      panelClass: 'dark-dialog'
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadBookings();
    });
  }

  checkIn(booking: BookingSummaryDto): void {
    if (!confirm(`Check-in cho khách ${booking.guestName}?`)) return;
    this.bookingService.checkIn({ bookingId: booking.bookingId }).subscribe({
      next: () => { this.showSuccess('Check-in thành công!'); this.loadBookings(); },
      error: (err) => this.showError(err.error?.errors?.[0] ?? 'Check-in thất bại.')
    });
  }

  checkOut(booking: BookingSummaryDto): void {
    const dialogRef = this.dialog.open(CheckoutDialogComponent, {
      width: '800px',
      data: {
        bookingId: booking.bookingId,
        baseAmount: booking.finalAmount,
        discountAmount: 0,
        guestName: booking.guestName,
        roomNumbers: booking.roomNumbers
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadBookings();
    });
  }

  cancelBooking(booking: BookingSummaryDto): void {
    const reason = prompt(`Lý do hủy booking #${booking.bookingId}:`);
    if (reason === null) return;
    this.bookingService.cancel(booking.bookingId, reason).subscribe({
      next: () => { this.showSuccess(`Booking #${booking.bookingId} đã hủy.`); this.loadBookings(); },
      error: (err) => this.showError(err.error?.errors?.[0] ?? 'Hủy thất bại.')
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      Pending: 'status-pending', Confirmed: 'status-confirmed',
      CheckedIn: 'status-checkedin', Completed: 'status-completed',
      Cancelled: 'status-cancelled'
    };
    return map[status] ?? '';
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      Pending: 'Chờ xác nhận', Confirmed: 'Xác nhận',
      CheckedIn: 'Đang ở', Completed: 'Hoàn thành', Cancelled: 'Đã hủy'
    };
    return map[status] ?? status;
  }

  getStatusIcon(status: string): string {
    const map: Record<string, string> = {
      Pending: 'schedule', Confirmed: 'verified',
      CheckedIn: 'login', Completed: 'check_circle', Cancelled: 'cancel'
    };
    return map[status] ?? 'help';
  }

  canCheckIn(status: string): boolean  { return status === 'Confirmed'; }
  canCheckOut(status: string): boolean { return status === 'CheckedIn'; }
  canCancel(status: string): boolean   { return ['Pending', 'Confirmed'].includes(status); }
  canEdit(status: string): boolean     { return ['Pending', 'Confirmed'].includes(status); }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  private showSuccess(msg: string): void {
    this.snackBar.open(msg, 'Đóng', { duration: 3000, panelClass: 'snack-success' });
  }
  private showError(msg: string): void {
    this.snackBar.open(msg, 'Đóng', { duration: 4000, panelClass: 'snack-error' });
  }
}
