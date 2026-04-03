import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RatePlanService } from '../../../../core/services/rate-plan.service';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-rate-plan-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule
  ],
  templateUrl: './rate-plan-list.component.html',
  styleUrl: './rate-plan-list.component.scss'
})
export class RatePlanListComponent implements OnInit {
  displayedColumns = ['name', 'price', 'cancellationPolicy', 'status', 'actions'];
  dataSource: any[] = [];
  isLoading = false;

  constructor(
    private ratePlanService: RatePlanService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    this.ratePlanService.getAll().subscribe({
      next: (res) => {
        this.dataSource = res.data;
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  deletePlan(id: number, name: string) {
    if(confirm(`Vô hiệu hóa gói giá ${name}?`)) {
      this.ratePlanService.delete(id).subscribe({
        next: () => {
          this.snackBar.open('Đã vô hiệu hóa', 'OK', { duration: 3000 });
          this.loadData();
        }
      });
    }
  }

  openEditDialog(plan?: any) {
    // In a full implementation, this opens a MatDialog to create/edit
    // Due to scope, we will alert the user to use Backend API directly
    this.snackBar.open('Tính năng Form Popup đang được hoàn thiện. Vui lòng dùng API trực tiếp.', 'Đóng', { duration: 4000 });
  }
}
