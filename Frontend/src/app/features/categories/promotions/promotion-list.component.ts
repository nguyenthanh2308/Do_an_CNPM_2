import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PromotionService } from '../../../core/services/promotion.service';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PromotionFormComponent } from './promotion-form.component';

@Component({
  selector: 'app-promotion-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSnackBarModule,
    MatDialogModule,
    MatProgressBarModule,
    MatTooltipModule
  ],
  templateUrl: './promotion-list.component.html',
  styleUrl: '../rate-plans/rate-plan-list.component.scss'
})
export class PromotionListComponent implements OnInit {
  displayedColumns = ['code', 'name', 'discount', 'dates', 'usage', 'status', 'actions'];
  dataSource: any[] = [];
  isLoading = false;

  constructor(
    private promotionService: PromotionService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    this.promotionService.getAll().subscribe({
      next: (res: any) => {
        this.dataSource = res.data.data ?? res.data ?? [];
        this.isLoading = false;
      },
      error: () => {
        this.snackBar.open('Không thể tải danh sách khuyến mãi.', 'Đóng', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  openEditDialog(promo?: any) {
    const dialogRef = this.dialog.open(PromotionFormComponent, {
      width: '680px',
      data: { promo: promo || null },
      panelClass: 'dark-dialog'
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadData();
    });
  }

  deletePromo(id: number, code: string) {
    if (confirm(`Khóa/vô hiệu hóa mã giảm giá "${code}"?`)) {
      this.promotionService.delete(id).subscribe({
        next: () => {
          this.snackBar.open('✅ Đã khóa mã voucher', 'OK', { duration: 3000, panelClass: 'snack-success' });
          this.loadData();
        },
        error: (err: any) => {
          this.snackBar.open(err.error?.errors?.[0] ?? 'Thao tác thất bại.', 'Đóng', { duration: 3000 });
        }
      });
    }
  }

  formatDate(d: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
}
