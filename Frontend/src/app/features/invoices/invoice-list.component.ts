import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { Subject, takeUntil } from 'rxjs';
import { InvoiceService, InvoiceDto } from '../../core/services/invoice.service';

@Component({
  selector: 'app-invoice-list',
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
    MatSelectModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatChipsModule,
    MatDividerModule
  ],
  template: `
    <div class="invoice-page">

      <!-- Header -->
      <div class="page-header">
        <div class="header-left">
          <h1 class="page-title">
            <mat-icon>receipt</mat-icon>
            Quản lý Hóa đơn
          </h1>
          <span class="total-badge">{{ totalCount }} hóa đơn</span>
        </div>
      </div>

      <!-- Filter -->
      <mat-card class="filter-card">
        <div class="filter-row">
          <!-- Status chips -->
          <div class="status-chips">
            <button *ngFor="let s of statusOptions" class="chip-btn"
                    [class.active]="selectedStatus === s.value"
                    [ngClass]="'chip-' + s.value.toLowerCase()"
                    (click)="onStatusFilter(s.value)">
              <mat-icon>{{ s.icon }}</mat-icon>
              {{ s.label }}
              <span class="chip-count">{{ s.count }}</span>
            </button>
          </div>
        </div>
      </mat-card>

      <!-- Loading -->
      <mat-progress-bar *ngIf="isLoading" mode="indeterminate" color="primary"></mat-progress-bar>

      <!-- Table -->
      <mat-card class="table-card">
        <div class="table-wrapper">
          <table mat-table [dataSource]="dataSource" class="invoice-table">

            <!-- Mã HĐ -->
            <ng-container matColumnDef="invoiceNumber">
              <th mat-header-cell *matHeaderCellDef>Mã hóa đơn</th>
              <td mat-cell *matCellDef="let inv">
                <span class="invoice-num">{{ inv.invoiceNumber }}</span>
              </td>
            </ng-container>

            <!-- Booking -->
            <ng-container matColumnDef="bookingId">
              <th mat-header-cell *matHeaderCellDef>Booking</th>
              <td mat-cell *matCellDef="let inv">
                <span class="booking-ref">#{{ inv.bookingId }}</span>
              </td>
            </ng-container>

            <!-- Khách -->
            <ng-container matColumnDef="guestName">
              <th mat-header-cell *matHeaderCellDef>Khách hàng</th>
              <td mat-cell *matCellDef="let inv">
                <span class="guest-name">{{ inv.guestName || '—' }}</span>
              </td>
            </ng-container>

            <!-- Ngày phát hành -->
            <ng-container matColumnDef="issuedAt">
              <th mat-header-cell *matHeaderCellDef>Ngày phát hành</th>
              <td mat-cell *matCellDef="let inv">{{ formatDate(inv.issuedAt) }}</td>
            </ng-container>

            <!-- Tổng tiền -->
            <ng-container matColumnDef="totalAmount">
              <th mat-header-cell *matHeaderCellDef>Tổng tiền</th>
              <td mat-cell *matCellDef="let inv">
                <span class="amount">{{ formatCurrency(inv.totalAmount) }}</span>
              </td>
            </ng-container>

            <!-- Trạng thái -->
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Trạng thái</th>
              <td mat-cell *matCellDef="let inv">
                <span class="status-badge" [ngClass]="'badge-' + inv.status.toLowerCase()">
                  <mat-icon>{{ getStatusIcon(inv.status) }}</mat-icon>
                  {{ getStatusLabel(inv.status) }}
                </span>
              </td>
            </ng-container>

            <!-- Actions -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Thao tác</th>
              <td mat-cell *matCellDef="let inv">
                <button mat-icon-button color="primary" (click)="viewDetail(inv)"
                        matTooltip="Xem chi tiết hóa đơn">
                  <mat-icon>visibility</mat-icon>
                </button>
                <button mat-icon-button color="accent"
                        *ngIf="canMarkPaid(inv.status)"
                        (click)="markAsPaid(inv)"
                        matTooltip="Đánh dấu đã thanh toán">
                  <mat-icon>check_circle</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns; sticky: true"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="table-row"></tr>

            <tr class="mat-row" *matNoDataRow>
              <td class="mat-cell empty-cell" [attr.colspan]="displayedColumns.length">
                <div class="empty-state">
                  <mat-icon>receipt_long</mat-icon>
                  <p>Không có hóa đơn nào</p>
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

      <!-- Detail Side Panel -->
      <div *ngIf="selectedInvoice" class="detail-overlay" (click)="closeDetail()">
        <div class="detail-panel" (click)="$event.stopPropagation()">
          <div class="panel-header">
            <mat-icon class="panel-icon">receipt_long</mat-icon>
            <div>
              <h3>{{ selectedInvoice.invoiceNumber }}</h3>
              <p>Booking #{{ selectedInvoice.bookingId }}</p>
            </div>
            <button mat-icon-button (click)="closeDetail()" class="close-btn">
              <mat-icon>close</mat-icon>
            </button>
          </div>

          <div class="panel-body">
            <div class="panel-row">
              <span class="p-label">Khách hàng</span>
              <span class="p-value">{{ selectedInvoice.guestName || '—' }}</span>
            </div>
            <div class="panel-row">
              <span class="p-label">Ngày phát hành</span>
              <span class="p-value">{{ formatDate(selectedInvoice.issuedAt) }}</span>
            </div>
            <mat-divider style="margin: 12px 0; border-color: rgba(255,255,255,0.06)"></mat-divider>
            <div class="price-row">
              <span>Tạm tính</span>
              <span>{{ formatCurrency(selectedInvoice.subtotal) }}</span>
            </div>
            <div class="price-row discount" *ngIf="selectedInvoice.discountAmount > 0">
              <span>Giảm giá</span>
              <span>- {{ formatCurrency(selectedInvoice.discountAmount) }}</span>
            </div>
            <div class="price-row tax" *ngIf="selectedInvoice.taxAmount > 0">
              <span>Thuế VAT</span>
              <span>+ {{ formatCurrency(selectedInvoice.taxAmount) }}</span>
            </div>
            <div class="price-row total">
              <span>Tổng cộng</span>
              <span>{{ formatCurrency(selectedInvoice.totalAmount) }}</span>
            </div>
            <mat-divider style="margin: 12px 0; border-color: rgba(255,255,255,0.06)"></mat-divider>
            <div class="status-display" [ngClass]="'badge-' + selectedInvoice.status.toLowerCase()">
              <mat-icon>{{ getStatusIcon(selectedInvoice.status) }}</mat-icon>
              {{ getStatusLabel(selectedInvoice.status) }}
            </div>
            <div *ngIf="selectedInvoice.notes" class="note-box">{{ selectedInvoice.notes }}</div>
            <button *ngIf="canMarkPaid(selectedInvoice.status)"
                    mat-raised-button color="primary" class="pay-btn"
                    (click)="markAsPaid(selectedInvoice)">
              <mat-icon>check_circle</mat-icon> Đánh dấu Đã thanh toán
            </button>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .invoice-page { padding: 0; }
    .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
    .header-left { display: flex; align-items: center; gap: 16px; }
    .page-title { display: flex; align-items: center; gap: 10px; font-size: 1.5rem; font-weight: 700; color: #f1f5f9; margin: 0; }
    .total-badge { background: rgba(99,102,241,0.15); color: #818cf8; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; }
    .filter-card { background: rgba(30,41,59,0.8) !important; border: 1px solid rgba(255,255,255,0.06) !important; border-radius: 12px !important; margin-bottom: 16px; padding: 16px 20px !important; }
    .filter-row { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
    .status-chips { display: flex; flex-wrap: wrap; gap: 8px; }
    .chip-btn { display: flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); background: transparent; cursor: pointer; font-size: 0.8rem; color: #94a3b8; transition: all 0.2s; }
    .chip-btn:hover { background: rgba(255,255,255,0.05); }
    .chip-btn.active { border-color: currentColor; background: rgba(currentColor, 0.1); }
    .chip-btn mat-icon { font-size: 1rem; width: 1rem; height: 1rem; }
    .chip-count { background: rgba(255,255,255,0.1); border-radius: 10px; padding: 1px 6px; font-size: 0.7rem; }
    .chip-btn.chip-paid.active, .chip-btn.chip-paid:hover { color: #4ade80; background: rgba(34,197,94,0.1); border-color: rgba(34,197,94,0.3); }
    .chip-btn.chip-issued.active { color: #60a5fa; background: rgba(59,130,246,0.1); border-color: rgba(59,130,246,0.3); }
    .chip-btn.chip-overdue.active { color: #f87171; background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.3); }
    .table-card { background: rgba(30,41,59,0.8) !important; border: 1px solid rgba(255,255,255,0.06) !important; border-radius: 12px !important; overflow: hidden; }
    .table-wrapper { overflow-x: auto; }
    .invoice-table { width: 100%; background: transparent; }
    .invoice-num { font-weight: 600; color: #818cf8; }
    .booking-ref { background: rgba(99,102,241,0.12); color: #818cf8; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; }
    .guest-name { color: #e2e8f0; }
    .amount { font-weight: 700; color: #f1f5f9; }
    .status-badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; }
    .status-badge mat-icon { font-size: 0.9rem; width: 0.9rem; height: 0.9rem; }
    .badge-paid { background: rgba(34,197,94,0.12); color: #4ade80; }
    .badge-issued { background: rgba(59,130,246,0.12); color: #60a5fa; }
    .badge-draft { background: rgba(100,116,139,0.12); color: #94a3b8; }
    .badge-overdue { background: rgba(239,68,68,0.12); color: #f87171; }
    .badge-cancelled { background: rgba(239,68,68,0.08); color: #f87171; }
    .table-row:hover { background: rgba(99,102,241,0.05) !important; }
    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 48px; gap: 12px; color: #475569; }
    .empty-state mat-icon { font-size: 3rem; width: 3rem; height: 3rem; }
    /* Side Panel */
    .detail-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 1000; display: flex; align-items: flex-start; justify-content: flex-end; }
    .detail-panel { background: #1e293b; border-left: 1px solid rgba(255,255,255,0.08); width: 380px; height: 100vh; overflow-y: auto; }
    .panel-header { display: flex; align-items: center; gap: 14px; padding: 24px; background: linear-gradient(135deg, #1a2744, #1e293b); border-bottom: 1px solid rgba(255,255,255,0.08); }
    .panel-icon { font-size: 2rem; width: 2rem; height: 2rem; color: #60a5fa; }
    .panel-header h3 { margin: 0 0 2px; color: #f1f5f9; font-size: 1rem; }
    .panel-header p { margin: 0; color: #64748b; font-size: 0.8rem; }
    .close-btn { margin-left: auto; color: #64748b; }
    .panel-body { padding: 20px; }
    .panel-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 0.875rem; }
    .p-label { color: #64748b; }
    .p-value { color: #e2e8f0; font-weight: 500; }
    .price-row { display: flex; justify-content: space-between; padding: 5px 0; color: #94a3b8; font-size: 0.9rem; }
    .price-row.discount { color: #4ade80; }
    .price-row.tax { color: #f59e0b; }
    .price-row.total { border-top: 1px solid rgba(255,255,255,0.08); margin-top: 6px; padding-top: 10px; font-size: 1.1rem; font-weight: 700; color: #f1f5f9; }
    .status-display { display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; border-radius: 20px; font-weight: 600; margin: 8px 0; }
    .note-box { background: rgba(255,255,255,0.04); border-radius: 8px; padding: 10px; color: #94a3b8; font-size: 0.875rem; margin-top: 8px; }
    .pay-btn { width: 100%; margin-top: 16px; }
  `]
})
export class InvoiceListComponent implements OnInit, OnDestroy {
  displayedColumns = ['invoiceNumber', 'bookingId', 'guestName', 'issuedAt', 'totalAmount', 'status', 'actions'];
  dataSource = new MatTableDataSource<InvoiceDto>([]);
  totalCount = 0;
  currentPage = 1;
  pageSize = 20;
  isLoading = false;
  selectedStatus = '';
  selectedInvoice: InvoiceDto | null = null;

  statusOptions = [
    { value: '', label: 'Tất cả', icon: 'list', count: 0 },
    { value: 'Issued', label: 'Chờ thanh toán', icon: 'pending', count: 0 },
    { value: 'Paid', label: 'Đã thanh toán', icon: 'check_circle', count: 0 },
    { value: 'Overdue', label: 'Quá hạn', icon: 'warning', count: 0 },
    { value: 'Draft', label: 'Nháp', icon: 'draft', count: 0 },
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private invoiceService: InvoiceService,
    private snackBar: MatSnackBar,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void { this.loadData(); }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  loadData(): void {
    this.isLoading = true;
    this.invoiceService.getAll(this.currentPage, this.pageSize, this.selectedStatus || undefined)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.dataSource.data = res.data.data;
          this.totalCount = res.data.totalCount;
          this.isLoading = false;
        },
        error: () => {
          this.snackBar.open('Không thể tải danh sách hóa đơn.', 'Đóng', { duration: 3000 });
          this.isLoading = false;
        }
      });
  }

  onStatusFilter(status: string): void {
    this.selectedStatus = status;
    this.currentPage = 1;
    this.loadData();
  }

  onPage(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadData();
  }

  viewDetail(inv: InvoiceDto): void { this.selectedInvoice = inv; }
  closeDetail(): void { this.selectedInvoice = null; }

  canMarkPaid(status: string): boolean { return ['Issued', 'Draft', 'Overdue'].includes(status); }

  markAsPaid(inv: InvoiceDto): void {
    this.invoiceService.updateStatus(inv.invoiceId, 'Paid').subscribe({
      next: () => {
        this.snackBar.open(`✅ Hóa đơn ${inv.invoiceNumber} đã được đánh dấu thanh toán!`, 'Đóng', {
          duration: 3000, panelClass: 'snack-success'
        });
        this.closeDetail();
        this.loadData();
      },
      error: err => this.snackBar.open(err.error?.message || 'Cập nhật thất bại.', 'Đóng', { duration: 3000 })
    });
  }

  getStatusLabel(s: string): string {
    const map: Record<string, string> = {
      Paid: 'Đã thanh toán', Issued: 'Chờ TT', Draft: 'Nháp',
      Overdue: 'Quá hạn', Cancelled: 'Đã hủy'
    };
    return map[s] ?? s;
  }

  getStatusIcon(s: string): string {
    const map: Record<string, string> = {
      Paid: 'check_circle', Issued: 'pending', Draft: 'drafts',
      Overdue: 'warning', Cancelled: 'cancel'
    };
    return map[s] ?? 'receipt';
  }

  formatDate(d: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  formatCurrency(n: number): string {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
  }
}
