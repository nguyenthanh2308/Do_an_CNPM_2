import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { PaymentService } from '../../../core/services/payment.service';
import { PaymentDto } from '../../../core/models/models';

@Component({
  selector: 'app-payment-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule,
    MatChipsModule
  ],
  templateUrl: './payment-list.component.html',
  styleUrl: './payment-list.component.scss'
})
export class PaymentListComponent implements OnInit {
  displayedColumns: string[] = [
    'paymentId', 'invoiceNumber', 'guestName',
    'amount', 'paymentMethod', 'status', 'paymentDate', 'actions'
  ];

  dataSource: PaymentDto[] = [];
  filteredDataSource: PaymentDto[] = [];
  isLoading = false;
  updatingId: number | null = null;   // track which row is saving
  searchTerm = '';
  selectedStatus = 'All';
  readonly statusOptions = ['All', 'Pending', 'Completed', 'Failed', 'Refunded'];

  constructor(
    private paymentService: PaymentService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.paymentService.getPaged(1, 100).subscribe({
      next: res => {
        this.dataSource = res.data.data;
        this.applyFilters();
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Không tải được danh sách thanh toán.', 'Đóng', { duration: 3000 });
      }
    });
  }

  updateStatus(item: PaymentDto, newStatus: 'Completed' | 'Failed' | 'Refunded'): void {
    if (item.status === newStatus || this.updatingId === item.paymentId) return;

    const actionLabel: Record<string, string> = {
      Completed: 'xác nhận thanh toán thành công',
      Failed:    'đánh dấu thất bại',
      Refunded:  'hoàn tiền'
    };

    if (!confirm(`Bạn có chắc muốn ${actionLabel[newStatus]} cho thanh toán #${item.paymentId}?`)) {
      return;
    }

    this.updatingId = item.paymentId;
    this.paymentService.updateStatus(item.paymentId, { status: newStatus }).subscribe({
      next: res => {
        this.updatingId = null;
        // Cập nhật trực tiếp trong array mà không cần reload
        const idx = this.dataSource.findIndex(p => p.paymentId === item.paymentId);
        if (idx !== -1) {
          this.dataSource[idx] = res.data;
          this.applyFilters();
        }
        this.snackBar.open(`✅ Thanh toán #${item.paymentId} → ${newStatus}`, 'OK', {
          duration: 3000, panelClass: 'snack-success'
        });
      },
      error: err => {
        this.updatingId = null;
        const msg = err.error?.message || err.error?.errors?.[0] || 'Cập nhật trạng thái thất bại.';
        this.snackBar.open(`❌ ${msg}`, 'Đóng', { duration: 4000, panelClass: 'snack-error' });
      }
    });
  }

  applyFilters(): void {
    const term   = this.searchTerm.trim().toLowerCase();
    const status = this.selectedStatus.toLowerCase();

    this.filteredDataSource = this.dataSource.filter(item => {
      const matchesStatus = status === 'all' || item.status.toLowerCase() === status;
      const matchesTerm   = !term ||
        (item.invoiceNumber ?? '').toLowerCase().includes(term) ||
        (item.guestName     ?? '').toLowerCase().includes(term) ||
        (item.paymentMethod ?? '').toLowerCase().includes(term) ||
        item.paymentId.toString().includes(term);
      return matchesStatus && matchesTerm;
    });
  }

  clearFilters(): void {
    this.searchTerm    = '';
    this.selectedStatus = 'All';
    this.applyFilters();
  }

  getStatusLabel(s: string): string {
    const map: Record<string, string> = {
      Pending: 'Chờ xử lý', Completed: 'Thành công',
      Failed: 'Thất bại', Refunded: 'Hoàn tiền'
    };
    return map[s] ?? s;
  }

  getStatusClass(s: string): string {
    const map: Record<string, string> = {
      Completed: 'st-completed', Pending: 'st-pending',
      Failed: 'st-failed', Refunded: 'st-refunded'
    };
    return map[s] ?? '';
  }

  canComplete(status: string): boolean { return ['Pending'].includes(status); }
  canFail(status: string): boolean     { return ['Pending'].includes(status); }
  canRefund(status: string): boolean   { return ['Completed'].includes(status); }

  isUpdating(paymentId: number): boolean { return this.updatingId === paymentId; }

  formatCurrency(n: number): string {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
  }

  formatDate(d: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
}
