import { Component, Inject, OnInit } from '@angular/core';
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
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RatePlanService } from '../../../core/services/rate-plan.service';
import { RoomTypeService } from '../../../core/services/room-type.service';

@Component({
  selector: 'app-rate-plan-form',
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
    MatSnackBarModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule
  ],
  providers: [RatePlanService, RoomTypeService],
  template: `
    <h2 mat-dialog-title>{{ mode === 'create' ? 'Thêm Gói Giá' : 'Chỉnh sửa Gói Giá' }}</h2>
    
    <mat-dialog-content>
      <form [formGroup]="form" class="form-container">
        <!-- Room Type -->
        <mat-form-field appearance="outline" class="full-width" *ngIf="mode === 'create'">
          <mat-label>Loại Phòng</mat-label>
          <mat-icon matPrefix>category</mat-icon>
          <mat-select formControlName="roomTypeId">
            <mat-option *ngFor="let rt of roomTypes" [value]="rt.roomTypeId">
              {{ rt.name }}
            </mat-option>
          </mat-select>
          <mat-error *ngIf="form.get('roomTypeId')?.hasError('required')">Loại phòng là bắt buộc</mat-error>
        </mat-form-field>

        <!-- Name -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Tên Gói Giá</mat-label>
          <mat-icon matPrefix>label</mat-icon>
          <input matInput formControlName="name" placeholder="VD: Early Bird, Last Minute">
          <mat-error *ngIf="form.get('name')?.hasError('required')">Tên gói giá là bắt buộc</mat-error>
        </mat-form-field>

        <!-- Description -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Mô tả</mat-label>
          <mat-icon matPrefix>description</mat-icon>
          <textarea matInput formControlName="description" placeholder="Mô tả chi tiết gói giá" rows="3"></textarea>
        </mat-form-field>

        <!-- Price Per Night -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Giá mỗi đêm (VND)</mat-label>
          <mat-icon matPrefix>attach_money</mat-icon>
          <input matInput type="number" formControlName="pricePerNight" placeholder="VD: 500000" min="0">
          <mat-error *ngIf="form.get('pricePerNight')?.hasError('required')">Giá là bắt buộc</mat-error>
        </mat-form-field>

        <!-- Meal Plan -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Chế độ ăn</mat-label>
          <mat-icon matPrefix>restaurant</mat-icon>
          <mat-select formControlName="mealPlan">
            <mat-option value="RoomOnly">Chỉ phòng</mat-option>
            <mat-option value="Breakfast">Có ăn sáng</mat-option>
            <mat-option value="HalfBoard">Nửa à (Sáng + Tối)</mat-option>
            <mat-option value="FullBoard">Đầy đủ (3 bữa)</mat-option>
          </mat-select>
        </mat-form-field>

        <!-- Cancellation Policy -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Chính sách hủy</mat-label>
          <mat-icon matPrefix>gavel</mat-icon>
          <mat-select formControlName="cancellationPolicy">
            <mat-option value="NonRefundable">Không hoàn lại</mat-option>
            <mat-option value="FreeCancel24h">Hủy miễn phí 24h</mat-option>
            <mat-option value="FreeCancel48h">Hủy miễn phí 48h</mat-option>
            <mat-option value="FreeCancel7days">Hủy miễn phí 7 ngày</mat-option>
            <mat-option value="Refundable">Hoàn lại 100%</mat-option>
          </mat-select>
        </mat-form-field>

        <!-- Min Stay Nights -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Tối thiểu đêm</mat-label>
          <mat-icon matPrefix>nights_stay</mat-icon>
          <input matInput type="number" formControlName="minStayNights" placeholder="VD: 1" min="1">
        </mat-form-field>

        <!-- Is Refundable -->
        <div class="toggle-field">
          <span class="toggle-label">Có thể hoàn lại</span>
          <mat-slide-toggle formControlName="isRefundable" color="primary"></mat-slide-toggle>
        </div>
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
    
    .toggle-field {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid var(--border, #e0e0e0);
    }
    
    .toggle-label {
      font-size: 0.9rem;
      color: var(--text, #333);
    }
    
    mat-dialog-actions {
      padding: 16px 0 0 0;
      margin-top: 24px;
      border-top: 1px solid var(--border, #e0e0e0);
    }
    
    mat-form-field {
      margin-bottom: 8px;
    }
    
    h2 {
      margin: 0 0 16px 0;
    }
  `]
})
export class RatePlanFormComponent implements OnInit {
  form: FormGroup;
  isLoading = false;
  roomTypes: any[] = [];
  mode: 'create' | 'edit' = 'create';

  constructor(
    private fb: FormBuilder,
    private ratePlanService: RatePlanService,
    private roomTypeService: RoomTypeService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<RatePlanFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.mode = data?.plan ? 'edit' : 'create';
    this.form = this.fb.group({
      roomTypeId: ['', Validators.required],
      name: ['', Validators.required],
      description: [''],
      pricePerNight: ['', [Validators.required, Validators.min(0)]],
      mealPlan: ['RoomOnly'],
      cancellationPolicy: ['FreeCancel48h'],
      minStayNights: [1, Validators.min(1)],
      isRefundable: [true]
    });

    // If edit mode, disable roomTypeId
    if (this.mode === 'edit' && data?.plan) {
      this.form.get('roomTypeId')?.disable();
      this.form.patchValue({
        roomTypeId: data.plan.roomTypeId,
        name: data.plan.name,
        description: data.plan.description,
        pricePerNight: data.plan.pricePerNight,
        mealPlan: data.plan.mealPlan,
        cancellationPolicy: data.plan.cancellationPolicy,
        minStayNights: data.plan.minStayNights,
        isRefundable: data.plan.isRefundable
      });
    }
  }

  ngOnInit(): void {
    this.loadRoomTypes();
  }

  loadRoomTypes(): void {
    this.roomTypeService.getAll().subscribe({
      next: (res: any) => {
        this.roomTypes = res.data || [];
      },
      error: (err: any) => {
        this.snackBar.open('Không thể tải danh sách loại phòng', 'Đóng', { duration: 4000, panelClass: 'snack-error' });
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (!this.form.valid) return;

    this.isLoading = true;
    const dto = {
      ...this.form.getRawValue(),
      ratePlanId: this.data?.plan?.ratePlanId
    };

    const operation$ = this.mode === 'create'
      ? this.ratePlanService.create(dto)
      : this.ratePlanService.update(dto.ratePlanId, dto);

    operation$.subscribe({
      next: () => {
        const action = this.mode === 'create' ? 'thêm' : 'cập nhật';
        this.snackBar.open(`Gói giá đã ${action} thành công`, 'Đóng', { duration: 3000, panelClass: 'snack-success' });
        this.isLoading = false;
        this.dialogRef.close(true);
      },
      error: (err: any) => {
        this.snackBar.open(err.error?.errors?.[0] ?? `${this.mode === 'create' ? 'Thêm' : 'Cập nhật'} gói giá thất bại`, 'Đóng', { duration: 4000, panelClass: 'snack-error' });
        this.isLoading = false;
      }
    });
  }
}
