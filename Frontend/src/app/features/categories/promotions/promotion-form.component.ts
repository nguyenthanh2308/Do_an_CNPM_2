import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PromotionService } from '../../../core/services/promotion.service';

@Component({
  selector: 'app-promotion-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  template: `
    <div class="promo-dialog">
      <!-- Header -->
      <div class="dialog-header">
        <div class="header-left">
          <mat-icon class="header-icon">local_offer</mat-icon>
          <h2 class="dialog-title">{{ isEdit ? 'Chỉnh sửa' : 'Tạo mới' }} Khuyến mãi</h2>
        </div>
        <button mat-icon-button (click)="close()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="dialog-content">

        <!-- Code -->
        <div class="two-col">
          <mat-form-field appearance="fill" class="field">
            <mat-label>Mã voucher</mat-label>
            <mat-icon matPrefix>confirmation_number</mat-icon>
            <input matInput formControlName="code" placeholder="SUMMER20" id="promoCode"
                   style="text-transform: uppercase">
            <mat-hint>Chỉ chữ và số, không dấu cách</mat-hint>
            <mat-error *ngIf="form.get('code')?.hasError('required')">Bắt buộc</mat-error>
            <mat-error *ngIf="form.get('code')?.hasError('pattern')">Không hợp lệ (chỉ A-Z, 0-9, _)</mat-error>
          </mat-form-field>

          <mat-form-field appearance="fill" class="field">
            <mat-label>Tên chương trình</mat-label>
            <mat-icon matPrefix>campaign</mat-icon>
            <input matInput formControlName="name" placeholder="Giảm giá mùa hè" id="promoName">
            <mat-error *ngIf="form.get('name')?.hasError('required')">Bắt buộc</mat-error>
          </mat-form-field>
        </div>

        <!-- Description -->
        <mat-form-field appearance="fill" class="field full-width">
          <mat-label>Mô tả (tùy chọn)</mat-label>
          <mat-icon matPrefix>description</mat-icon>
          <textarea matInput formControlName="description" rows="2" id="promoDesc"
                    placeholder="Khuyến mãi đặc biệt dành cho..."></textarea>
        </mat-form-field>

        <!-- Discount Type + Value -->
        <div class="two-col">
          <mat-form-field appearance="fill" class="field">
            <mat-label>Loại giảm giá</mat-label>
            <mat-icon matPrefix>percent</mat-icon>
            <mat-select formControlName="discountType" id="promoDiscountType">
              <mat-option value="Percentage">Phần trăm (%)</mat-option>
              <mat-option value="FixedAmount">Số tiền cố định (VND)</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="fill" class="field">
            <mat-label>
              Giá trị giảm
              {{ form.get('discountType')?.value === 'Percentage' ? '(%)' : '(VND)' }}
            </mat-label>
            <mat-icon matPrefix>{{ form.get('discountType')?.value === 'Percentage' ? 'percent' : 'payments' }}</mat-icon>
            <input matInput type="number" formControlName="discountValue" id="promoValue"
                   [placeholder]="form.get('discountType')?.value === 'Percentage' ? '10' : '200000'">
            <mat-error *ngIf="form.get('discountValue')?.hasError('required')">Bắt buộc</mat-error>
            <mat-error *ngIf="form.get('discountValue')?.hasError('min')">Phải lớn hơn 0</mat-error>
            <mat-error *ngIf="form.get('discountValue')?.hasError('max') && form.get('discountType')?.value === 'Percentage'">Tối đa 100%</mat-error>
          </mat-form-field>
        </div>

        <!-- Date Range -->
        <div class="two-col">
          <mat-form-field appearance="fill" class="field">
            <mat-label>Ngày bắt đầu</mat-label>
            <mat-icon matPrefix>event</mat-icon>
            <input matInput [matDatepicker]="startPicker" formControlName="startDate" id="promoStart">
            <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
            <mat-datepicker #startPicker></mat-datepicker>
            <mat-error>Bắt buộc</mat-error>
          </mat-form-field>

          <mat-form-field appearance="fill" class="field">
            <mat-label>Ngày kết thúc</mat-label>
            <mat-icon matPrefix>event_busy</mat-icon>
            <input matInput [matDatepicker]="endPicker" formControlName="endDate" id="promoEnd">
            <mat-datepicker-toggle matSuffix [for]="endPicker"></mat-datepicker-toggle>
            <mat-datepicker #endPicker></mat-datepicker>
            <mat-error>Bắt buộc</mat-error>
          </mat-form-field>
        </div>

        <!-- Usage Limit + Min Order -->
        <div class="two-col">
          <mat-form-field appearance="fill" class="field">
            <mat-label>Giới hạn lượt dùng</mat-label>
            <mat-icon matPrefix>tag</mat-icon>
            <input matInput type="number" formControlName="usageLimit" min="1" id="promoUsage"
                   placeholder="100">
            <mat-hint>Để trống = không giới hạn</mat-hint>
          </mat-form-field>

          <mat-form-field appearance="fill" class="field">
            <mat-label>Đơn hàng tối thiểu (VND)</mat-label>
            <mat-icon matPrefix>shopping_cart</mat-icon>
            <input matInput type="number" formControlName="minOrderAmount" min="0" id="promoMinOrder"
                   placeholder="0">
          </mat-form-field>
        </div>

        <!-- Active toggle -->
        <div class="toggle-row">
          <mat-slide-toggle formControlName="isActive" color="primary" id="promoActive">
            Kích hoạt ngay sau khi tạo
          </mat-slide-toggle>
        </div>

        <!-- Error -->
        <div *ngIf="errorMsg" class="error-msg">
          <mat-icon>error_outline</mat-icon> {{ errorMsg }}
        </div>

        <!-- Footer -->
        <div class="dialog-footer">
          <button mat-button type="button" (click)="close()">Hủy</button>
          <button mat-raised-button color="primary" type="submit"
                  [disabled]="form.invalid || isSaving" id="savePromoBtn">
            <mat-spinner *ngIf="isSaving" diameter="18" style="display:inline-block;margin-right:6px;"></mat-spinner>
            {{ isSaving ? 'Đang lưu...' : (isEdit ? '💾 Cập nhật' : '✅ Tạo mới') }}
          </button>
        </div>

      </form>
    </div>
  `,
  styles: [`
    .promo-dialog { display: flex; flex-direction: column; min-width: 620px; background: #1e293b; color: #e2e8f0; border-radius: 16px; overflow: hidden; }
    .dialog-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; background: linear-gradient(135deg, #14532d, #1e293b); border-bottom: 1px solid rgba(255,255,255,0.08); }
    .header-left { display: flex; align-items: center; gap: 14px; }
    .header-icon { font-size: 2rem; width: 2rem; height: 2rem; color: #4ade80; }
    .dialog-title { margin: 0; font-size: 1.2rem; font-weight: 600; color: #f1f5f9; }
    .dialog-content { padding: 20px 24px; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 4px; }
    .field { width: 100%; }
    .full-width { width: 100%; display: block; margin-bottom: 4px; }
    .toggle-row { padding: 8px 0 12px; color: #94a3b8; font-size: 0.9rem; }
    .error-msg { display: flex; align-items: center; gap: 8px; background: rgba(239,68,68,0.1); color: #f87171; border-radius: 8px; padding: 10px 14px; margin-bottom: 12px; font-size: 0.875rem; }
    .dialog-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 12px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.08); }
  `]
})
export class PromotionFormComponent implements OnInit {
  form!: FormGroup;
  isSaving = false;
  errorMsg = '';
  isEdit = false;

  constructor(
    public dialogRef: MatDialogRef<PromotionFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { promo?: any },
    private fb: FormBuilder,
    private promotionService: PromotionService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const p = this.data?.promo;
    this.isEdit = !!p;

    this.form = this.fb.group({
      code:            [p?.code || '', [Validators.required, Validators.pattern(/^[A-Z0-9_]+$/i)]],
      name:            [p?.name || '', Validators.required],
      description:     [p?.description || ''],
      discountType:    [p?.discountType || 'Percentage', Validators.required],
      discountValue:   [p?.discountValue || null, [Validators.required, Validators.min(0.01)]],
      startDate:       [p?.startDate ? new Date(p.startDate) : null, Validators.required],
      endDate:         [p?.endDate ? new Date(p.endDate) : null, Validators.required],
      usageLimit:      [p?.usageLimit || null],
      minOrderAmount:  [p?.minOrderAmount || 0],
      isActive:        [p?.isActive ?? true]
    });

    // Dynamic max validator for percentage
    this.form.get('discountType')?.valueChanges.subscribe(() => {
      this.updateDiscountValidators();
    });
    this.updateDiscountValidators();
  }

  private updateDiscountValidators(): void {
    const ctrl = this.form.get('discountValue');
    const type = this.form.get('discountType')?.value;
    if (type === 'Percentage') {
      ctrl?.setValidators([Validators.required, Validators.min(0.01), Validators.max(100)]);
    } else {
      ctrl?.setValidators([Validators.required, Validators.min(0.01)]);
    }
    ctrl?.updateValueAndValidity();
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.isSaving = true;
    this.errorMsg = '';

    const v = this.form.value;
    const dto = {
      ...v,
      code: v.code.toUpperCase(),
      startDate: this.toISODate(v.startDate),
      endDate: this.toISODate(v.endDate),
      usageLimit: v.usageLimit || null
    };

    const req = this.isEdit
      ? this.promotionService.update(this.data.promo.promotionId, dto)
      : this.promotionService.create(dto);

    req.subscribe({
      next: () => {
        this.isSaving = false;
        this.snackBar.open(
          `✅ Khuyến mãi "${dto.name}" đã được ${this.isEdit ? 'cập nhật' : 'tạo'}!`,
          'Đóng', { duration: 3000, panelClass: 'snack-success' }
        );
        this.dialogRef.close(true);
      },
      error: err => {
        this.isSaving = false;
        this.errorMsg = err.error?.message || err.error?.errors?.[0] || 'Lỗi không xác định.';
      }
    });
  }

  private toISODate(date: Date): string {
    return date instanceof Date ? date.toISOString().split('T')[0] : date;
  }

  close(): void { this.dialogRef.close(false); }
}
