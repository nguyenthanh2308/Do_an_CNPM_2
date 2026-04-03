import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PromotionService } from '../../../../core/services/promotion.service';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-promotion-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule
  ],
  templateUrl: './promotion-list.component.html',
  styleUrl: '../rate-plans/rate-plan-list.component.scss' // Re-use styling
})
export class PromotionListComponent implements OnInit {
  displayedColumns = ['code', 'name', 'discount', 'usage', 'status', 'actions'];
  dataSource: any[] = [];
  isLoading = false;

  constructor(
    private promotionService: PromotionService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    this.promotionService.getAll().subscribe({
      next: (res) => {
        // Handle PagedResult
        this.dataSource = res.data.data;
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  deletePromo(id: number, code: string) {
    if(confirm(`Khóa mã giảm giá ${code}?`)) {
      this.promotionService.delete(id).subscribe({
        next: () => {
          this.snackBar.open('Đã khóa mã voucher', 'OK', { duration: 3000 });
          this.loadData();
        }
      });
    }
  }

  openEditDialog(promo?: any) {
    this.snackBar.open('Tính năng Form Popup đang được hoàn thiện. Vui lòng dùng API trực tiếp.', 'Đóng', { duration: 4000 });
  }
}
