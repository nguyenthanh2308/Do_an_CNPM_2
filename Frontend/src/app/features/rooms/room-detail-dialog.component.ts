import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RoomService } from '../../core/services/room.service';
import { RoomDto } from '../../core/models/models';

@Component({
  selector: 'app-room-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <h2 mat-dialog-title>Chi tiết Phòng</h2>
    
    <mat-dialog-content *ngIf="!isLoading; else loading">
      <div *ngIf="room" class="room-detail-container">
        
        <!-- Room header -->
        <mat-card class="info-card">
          <div class="header-row">
            <div class="room-info">
              <h3>Phòng {{ room.roomNumber }}</h3>
              <p class="subtitle">Tầng {{ room.floor }}</p>
            </div>
            <div [ngClass]="'status-badge ' + getStatusClass(room.status)">
              <mat-icon>{{ getStatusIcon(room.status) }}</mat-icon>
              <span>{{ getStatusLabel(room.status) }}</span>
            </div>
          </div>
        </mat-card>

        <!-- Room details grid -->
        <div class="details-grid">
          <mat-card class="detail-item">
            <mat-card-content>
              <div class="detail-label">
                <mat-icon>category</mat-icon>
                <span>Loại Phòng</span>
              </div>
              <div class="detail-value">{{ room.roomTypeName }}</div>
            </mat-card-content>
          </mat-card>

          <mat-card class="detail-item">
            <mat-card-content>
              <div class="detail-label">
                <mat-icon>hotel</mat-icon>
                <span>Khách sạn</span>
              </div>
              <div class="detail-value">{{ room.hotelName }}</div>
            </mat-card-content>
          </mat-card>

          <mat-card class="detail-item">
            <mat-card-content>
              <div class="detail-label">
                <mat-icon>info</mat-icon>
                <span>Trạng thái</span>
              </div>
              <div class="detail-value" [ngClass]="getStatusClass(room.status)">
                {{ getStatusLabel(room.status) }}
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="detail-item" *ngIf="room.notes">
            <mat-card-content>
              <div class="detail-label">
                <mat-icon>notes</mat-icon>
                <span>Ghi chú</span>
              </div>
              <div class="detail-value">{{ room.notes }}</div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Room type details if available -->
        <div *ngIf="room.roomTypeDetails" class="room-type-section">
          <h4>Thông tin Loại Phòng</h4>
          <mat-divider></mat-divider>
          
          <div class="type-details-grid">
            <div class="type-detail">
              <span class="label">Giá cơ bản:</span>
              <span class="value">{{ formatCurrency(room.roomTypeDetails.basePrice) }}/đêm</span>
            </div>
            <div class="type-detail">
              <span class="label">Sức chứa tối đa:</span>
              <span class="value">{{ room.roomTypeDetails.maxOccupancy }} khách</span>
            </div>
            <div class="type-detail" *ngIf="room.roomTypeDetails.areaSqm">
              <span class="label">Diện tích:</span>
              <span class="value">{{ room.roomTypeDetails.areaSqm }}m²</span>
            </div>
            <div class="type-detail" *ngIf="room.thumbnailUrl">
              <span class="label">Hình ảnh phòng:</span>
              <img [src]="room.thumbnailUrl" alt="Room thumbnail" class="room-thumbnail">
            </div>
          </div>
        </div>

        <!-- Activity section -->
        <div class="activity-section">
          <h4>Hoạt động</h4>
          <mat-divider></mat-divider>
          <p class="status-info">
            <mat-icon>{{ getStatusIcon(room.status) }}</mat-icon>
            <span>Trạng thái hiện tại: <strong>{{ getStatusLabel(room.status) }}</strong></span>
          </p>
          <p class="info-text">
            <mat-icon>check</mat-icon>
            <span>ID Phòng: #{{ room.roomId }}</span>
          </p>
          <p class="info-text">
            <mat-icon>verified</mat-icon>
            <span *ngIf="room.isActive">Phòng đang hoạt động</span>
            <span *ngIf="!room.isActive">Phòng không hoạt động</span>
          </p>
        </div>
      </div>

      <div *ngIf="!room" class="empty-state">
        <mat-icon>error</mat-icon>
        <p>Không thể tải thông tin phòng</p>
      </div>
    </mat-dialog-content>

    <ng-template #loading>
      <div class="loading-state">
        <mat-spinner diameter="40"></mat-spinner>
        <p>Đang tải chi tiết phòng...</p>
      </div>
    </ng-template>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onClose()">Đóng</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .room-detail-container {
      display: flex;
      flex-direction: column;
      gap: 20px;
      padding: 10px 0;
    }

    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 20px;
    }

    .room-info h3 {
      margin: 0;
      font-size: 1.5rem;
      color: var(--primary, #7c3aed);
    }

    .room-info .subtitle {
      margin: 4px 0 0 0;
      color: var(--text-dim, #888);
      font-size: 0.9rem;
    }

    .status-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 8px;
      font-weight: 500;
      font-size: 0.9rem;
      margin-top: 5px;
    }

    .status-badge mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .status-badge.available {
      background: #d4edda;
      color: #155724;
    }

    .status-badge.occupied {
      background: #cce5ff;
      color: #004085;
    }

    .status-badge.dirty {
      background: #fff3cd;
      color: #856404;
    }

    .status-badge.maintenance {
      background: #f8d7da;
      color: #721c24;
    }

    .status-badge.outofservice {
      background: #e2e3e5;
      color: #383d41;
    }

    .details-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
    }

    .detail-item {
      border: 1px solid var(--border, #e0e0e0);
    }

    .detail-item mat-card-content {
      padding: 16px;
    }

    .detail-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.85rem;
      color: var(--text-dim, #888);
      margin-bottom: 8px;
    }

    .detail-label mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .detail-value {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--text, #333);
    }

    .room-type-section,
    .activity-section {
      background: var(--surface-2, #f5f5f5);
      padding: 16px;
      border-radius: 8px;
    }

    .room-type-section h4,
    .activity-section h4 {
      margin: 0 0 12px 0;
      font-size: 1rem;
      color: var(--text, #333);
    }

    .type-details-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 12px;
      margin-top: 12px;
    }

    .type-detail {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .type-detail .label {
      font-size: 0.85rem;
      color: var(--text-dim, #888);
    }

    .type-detail .value {
      font-weight: 600;
      color: var(--text, #333);
    }

    .room-thumbnail {
      max-width: 100%;
      height: 80px;
      object-fit: cover;
      border-radius: 4px;
    }

    .status-info,
    .info-text {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 8px 0;
      color: var(--text, #333);
      font-size: 0.9rem;
    }

    .status-info mat-icon,
    .info-text mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: var(--primary, #7c3aed);
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      gap: 16px;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      gap: 12px;
      color: var(--text-dim, #888);
    }

    .empty-state mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
    }

    mat-card {
      border: 1px solid var(--border, #e0e0e0);
    }

    mat-divider {
      margin: 12px 0;
    }

    h2 {
      margin: 0 0 16px 0;
    }

    mat-dialog-actions {
      margin-top: 24px;
      padding: 16px 0 0 0;
      border-top: 1px solid var(--border, #e0e0e0);
    }
  `]
})
export class RoomDetailDialogComponent implements OnInit {
  room: RoomDto | null = null;
  isLoading = true;

  constructor(
    private roomService: RoomService,
    public dialogRef: MatDialogRef<RoomDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { roomId: number },
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    if (this.data?.roomId) {
      this.loadRoom();
    } else {
      this.isLoading = false;
    }
  }

  loadRoom(): void {
    this.isLoading = true;
    this.roomService.getById(this.data.roomId).subscribe({
      next: (res) => {
        this.room = res.data;
        this.isLoading = false;
      },
      error: (err) => {
        this.snackBar.open(err.error?.errors?.[0] ?? 'Không thể tải chi tiết phòng', 'Đóng', { duration: 4000 });
        this.isLoading = false;
      }
    });
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      Available: 'Trống',
      Occupied: 'Có khách',
      Dirty: 'Cần dọn',
      Maintenance: 'Bảo trì',
      OutOfService: 'Ngừng hoạt động'
    };
    return map[status] ?? status;
  }

  getStatusIcon(status: string): string {
    const map: Record<string, string> = {
      Available: 'check_circle',
      Occupied: 'person',
      Dirty: 'cleaning_services',
      Maintenance: 'build',
      OutOfService: 'block'
    };
    return map[status] ?? 'info';
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      Available: 'available',
      Occupied: 'occupied',
      Dirty: 'dirty',
      Maintenance: 'maintenance',
      OutOfService: 'outofservice'
    };
    return map[status] ?? '';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
