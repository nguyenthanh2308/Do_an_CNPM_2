import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RatePlanService } from '../../../core/services/rate-plan.service';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RatePlanFormComponent } from './rate-plan-form.component';

@Component({
  selector: 'app-rate-plan-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSnackBarModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatTooltipModule
  ],
  templateUrl: './rate-plan-list.component.html',
  styleUrl: './rate-plan-list.component.scss'
})
export class RatePlanListComponent implements OnInit {
  displayedColumns = ['name', 'roomType', 'price', 'minStay', 'cancellationPolicy', 'refundable', 'status', 'actions'];
  dataSource: any[] = [];
  filteredData: any[] = [];
  isLoading = false;
  searchText = '';

  constructor(
    private ratePlanService: RatePlanService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    this.ratePlanService.getAll().subscribe({
      next: (res: any) => {
        this.dataSource = res.data || [];
        this.applyFilter();
        this.isLoading = false;
      },
      error: (err: any) => {
        this.snackBar.open(err.error?.errors?.[0] ?? 'Không thể tải gói giá', 'Đóng', { duration: 4000, panelClass: 'snack-error' });
        this.isLoading = false;
      }
    });
  }

  onSearch(text: string): void {
    this.searchText = text;
    this.applyFilter();
  }

  applyFilter(): void {
    const term = this.searchText.toLowerCase().trim();
    this.filteredData = term
      ? this.dataSource.filter(p => p.name?.toLowerCase().includes(term) || p.roomTypeName?.toLowerCase().includes(term))
      : [...this.dataSource];
  }

  deletePlan(id: number, name: string) {
    if (confirm(`Vô hiệu hóa gói giá "${name}"?`)) {
      this.ratePlanService.delete(id).subscribe({
        next: () => {
          this.snackBar.open('✅ Đã vô hiệu hóa gói giá', 'OK', { duration: 3000, panelClass: 'snack-success' });
          this.loadData();
        },
        error: (err: any) => {
          this.snackBar.open(err.error?.errors?.[0] ?? 'Vô hiệu hóa thất bại', 'Đóng', { duration: 4000, panelClass: 'snack-error' });
        }
      });
    }
  }

  openEditDialog(plan?: any) {
    const dialogRef = this.dialog.open(RatePlanFormComponent, {
      width: '700px',
      data: { plan: plan || null }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadData();
    });
  }
}
