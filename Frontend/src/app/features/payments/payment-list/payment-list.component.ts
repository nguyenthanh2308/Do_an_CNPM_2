import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
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
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  templateUrl: './payment-list.component.html',
  styleUrl: './payment-list.component.scss'
})
export class PaymentListComponent implements OnInit {
  displayedColumns: string[] = [
    'paymentId',
    'invoiceNumber',
    'guestName',
    'amount',
    'paymentMethod',
    'status',
    'paymentDate',
    'actions'
  ];

  dataSource: PaymentDto[] = [];
  filteredDataSource: PaymentDto[] = [];
  isLoading = false;
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
    this.paymentService.getPaged(1, 50).subscribe({
      next: (res) => {
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

  updateStatus(item: PaymentDto, status: 'Completed' | 'Failed' | 'Refunded'): void {
    if (item.status === status) {
      return;
    }

    this.paymentService.updateStatus(item.paymentId, { status }).subscribe({
      next: () => {
        this.snackBar.open('Đã cập nhật trạng thái thanh toán.', 'OK', { duration: 2500 });
        this.loadData();
      },
      error: () => {
        this.snackBar.open('Cập nhật trạng thái thất bại.', 'Đóng', { duration: 3000 });
      }
    });
  }

  applyFilters(): void {
    const term = this.searchTerm.trim().toLowerCase();
    const status = this.selectedStatus.toLowerCase();

    this.filteredDataSource = this.dataSource.filter((item) => {
      const matchesStatus = status === 'all' || item.status.toLowerCase() === status;
      const matchesTerm =
        term.length === 0 ||
        item.invoiceNumber.toLowerCase().includes(term) ||
        item.guestName.toLowerCase().includes(term) ||
        item.paymentMethod.toLowerCase().includes(term) ||
        item.paymentId.toString().includes(term);

      return matchesStatus && matchesTerm;
    });
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = 'All';
    this.applyFilters();
  }
}
