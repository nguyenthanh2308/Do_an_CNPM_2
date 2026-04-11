import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RoomService } from '../../core/services/room.service';
import { CreateRoomDto, RoomStatus } from '../../core/models/models';

@Component({
  selector: 'app-room-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatCardModule,
    MatIconModule,
    MatSnackBarModule
  ],
  providers: [RoomService],
  template: `
    <h2 mat-dialog-title>{{ data.mode === 'create' ? 'Thêm Phòng' : 'Chỉnh sửa Phòng' }}</h2>
    
    <mat-dialog-content>
      <form [formGroup]="form" class="form-container">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Số phòng</mat-label>
          <mat-icon matPrefix>door_front</mat-icon>
          <input matInput formControlName="roomNumber" placeholder="VD: 101, A201">
          <mat-error *ngIf="form.get('roomNumber')?.hasError('required')">Số phòng là bắt buộc</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Tầng</mat-label>
          <mat-icon matPrefix>stairs</mat-icon>
          <input matInput type="number" formControlName="floor" placeholder="VD: 1, 2, 3">
          <mat-error *ngIf="form.get('floor')?.hasError('required')">Tầng là bắt buộc</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Loại Phòng</mat-label>
          <mat-icon matPrefix>category</mat-icon>
          <mat-select formControlName="roomTypeId">
            <mat-option *ngFor="let rt of roomTypes" [value]="rt.roomTypeId">
              {{ rt.name }}
            </mat-option>
          </mat-select>
          <mat-error *ngIf="form.get('roomTypeId')?.hasError('required')">Loại phòng là bắt buộc</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Trạng thái</mat-label>
          <mat-icon matPrefix>info</mat-icon>
          <mat-select formControlName="status">
            <mat-option value="Available">Trống</mat-option>
            <mat-option value="Occupied">Có khách</mat-option>
            <mat-option value="Dirty">Cần dọn</mat-option>
            <mat-option value="Maintenance">Bảo trì</mat-option>
            <mat-option value="OutOfService">Ngừng hoạt động</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Ghi chú</mat-label>
          <mat-icon matPrefix>note</mat-icon>
          <input matInput formControlName="notes" placeholder="Ghi chú thêm về phòng">
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Hủy</button>
      <button mat-raised-button color="primary" (click)="onSubmit()" [disabled]="form.invalid || isLoading">
        {{ isLoading ? 'Đang lưu...' : 'Lưu' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .form-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 20px 0;
    }
    .full-width {
      width: 100%;
    }
    mat-dialog-actions {
      padding: 16px 0 0 0;
    }
  `]
})
export class SimpleRoomFormComponent {
  form: FormGroup;
  isLoading = false;
  roomTypes: any[] = [];

  constructor(
    private fb: FormBuilder,
    private roomService: RoomService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<SimpleRoomFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.form = this.fb.group({
      roomNumber: ['', Validators.required],
      floor: [1, Validators.required],
      roomTypeId: ['', Validators.required],
      status: ['Available'],
      notes: ['']
    });

    // Mock room types - in production, fetch from API
    this.roomTypes = [
      { roomTypeId: 1, name: 'Deluxe' },
      { roomTypeId: 2, name: 'Suite' }
    ];
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (!this.form.valid) return;

    this.isLoading = true;
    const dto: CreateRoomDto = {
      ...this.form.value,
      hotelId: 1 // Default hotel ID
    };

    this.roomService.create(dto).subscribe({
      next: () => {
        this.snackBar.open('Phòng đã được thêm thành công', 'Đóng', { duration: 3000, panelClass: 'snack-success' });
        this.isLoading = false;
        this.dialogRef.close(true);
      },
      error: (err: any) => {
        this.snackBar.open(err.error?.errors?.[0] ?? 'Thêm phòng thất bại', 'Đóng', { duration: 4000, panelClass: 'snack-error' });
        this.isLoading = false;
      }
    });
  }
}
