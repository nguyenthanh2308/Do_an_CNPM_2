import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BookingService } from '../../../core/services/booking.service';
import { BookingDto } from '../../../core/models/models';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-edit-booking-dialog',
  standalone: true,
  providers: [provideNativeDateAdapter()],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <div class="edit-dialog">
      <!-- Header -->
      <div class="dialog-header">
        <div class="header-left">
          <mat-icon class="header-icon">edit_calendar</mat-icon>
          <div>
            <h2 class="dialog-title">Chỉnh sửa Booking #{{ data.bookingId }}</h2>
            <p class="dialog-sub">Khách: <strong>{{ data.guestName }}</strong></p>
          </div>
        </div>
        <button mat-icon-button (click)="close()" class="close-btn">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Loading initial data -->
      <div *ngIf="isLoadingData" class="loading-state">
        <mat-spinner diameter="36"></mat-spinner>
        <p>Đang tải dữ liệu booking...</p>
      </div>

      <!-- Form -->
      <form *ngIf="!isLoadingData" [formGroup]="editForm" (ngSubmit)="onSubmit()" class="dialog-content">

        <!-- Dates Row -->
        <div class="field-row two-col">
          <mat-form-field appearance="fill" class="field">
            <mat-label>Ngày check-in</mat-label>
            <mat-icon matPrefix>login</mat-icon>
            <input matInput [matDatepicker]="checkInPicker" formControlName="checkInDate" id="editCheckIn">
            <mat-datepicker-toggle matSuffix [for]="checkInPicker"></mat-datepicker-toggle>
            <mat-datepicker #checkInPicker></mat-datepicker>
            <mat-error>Ngày check-in là bắt buộc</mat-error>
          </mat-form-field>

          <mat-form-field appearance="fill" class="field">
            <mat-label>Ngày check-out</mat-label>
            <mat-icon matPrefix>logout</mat-icon>
            <input matInput [matDatepicker]="checkOutPicker" formControlName="checkOutDate" id="editCheckOut">
            <mat-datepicker-toggle matSuffix [for]="checkOutPicker"></mat-datepicker-toggle>
            <mat-datepicker #checkOutPicker></mat-datepicker>
            <mat-error>Ngày check-out là bắt buộc</mat-error>
          </mat-form-field>
        </div>

        <!-- Num Guests -->
        <div class="field-row">
          <mat-form-field appearance="fill" class="field full-width">
            <mat-label>Số khách</mat-label>
            <mat-icon matPrefix>group</mat-icon>
            <input matInput type="number" formControlName="numGuests" min="1" max="10" id="editNumGuests">
            <mat-error>Số khách từ 1–10</mat-error>
          </mat-form-field>
        </div>

        <!-- Special Requests -->
        <div class="field-row">
          <mat-form-field appearance="fill" class="field full-width">
            <mat-label>Yêu cầu đặc biệt</mat-label>
            <mat-icon matPrefix>star_outline</mat-icon>
            <textarea matInput formControlName="specialRequests" rows="2" id="editSpecialRequests"
                      placeholder="Phòng tầng cao, cạnh thang máy..."></textarea>
          </mat-form-field>
        </div>

        <!-- Notes -->
        <div class="field-row">
          <mat-form-field appearance="fill" class="field full-width">
            <mat-label>Ghi chú nội bộ</mat-label>
            <mat-icon matPrefix>notes</mat-icon>
            <textarea matInput formControlName="notes" rows="2" id="editNotes"
                      placeholder="Ghi chú cho nhân viên nội bộ..."></textarea>
          </mat-form-field>
        </div>

        <!-- Error -->
        <div *ngIf="errorMsg" class="error-msg">
          <mat-icon>error_outline</mat-icon> {{ errorMsg }}
        </div>

        <!-- Footer -->
        <div class="dialog-footer">
          <button mat-button type="button" (click)="close()">Hủy</button>
          <button mat-raised-button color="primary" type="submit"
                  [disabled]="editForm.invalid || isSaving" id="saveBookingBtn">
            <mat-spinner *ngIf="isSaving" diameter="18" style="display:inline-block;margin-right:6px;"></mat-spinner>
            {{ isSaving ? 'Đang lưu...' : '💾 Lưu thay đổi' }}
          </button>
        </div>

      </form>
    </div>
  `,
  styles: [`
    .edit-dialog { display: flex; flex-direction: column; min-width: 560px; background: #1e293b; color: #e2e8f0; border-radius: 16px; overflow: hidden; }
    .dialog-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; background: linear-gradient(135deg, #312e81, #1e293b); border-bottom: 1px solid rgba(255,255,255,0.08); }
    .header-left { display: flex; align-items: center; gap: 14px; }
    .header-icon { font-size: 2rem; width: 2rem; height: 2rem; color: #818cf8; }
    .dialog-title { margin: 0; font-size: 1.2rem; font-weight: 600; color: #f1f5f9; }
    .dialog-sub { margin: 2px 0 0; font-size: 0.85rem; color: #94a3b8; }
    .dialog-sub strong { color: #c7d2fe; }
    .close-btn { color: #94a3b8; }
    .loading-state { display: flex; flex-direction: column; align-items: center; padding: 40px; gap: 12px; color: #94a3b8; }
    .dialog-content { padding: 20px 24px; }
    .field-row { margin-bottom: 4px; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .field { width: 100%; }
    .full-width { width: 100%; }
    .error-msg { display: flex; align-items: center; gap: 8px; background: rgba(239,68,68,0.1); color: #f87171; border-radius: 8px; padding: 10px 14px; margin-bottom: 12px; font-size: 0.875rem; }
    .dialog-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.08); }
    ::ng-deep .mat-mdc-form-field { --mdc-filled-text-field-container-color: rgba(255,255,255,0.05); }
    ::ng-deep .mat-mdc-input-element { color: #e2e8f0 !important; }
    ::ng-deep .mdc-floating-label { color: #94a3b8 !important; }
  `]
})
export class EditBookingDialogComponent implements OnInit {
  editForm!: FormGroup;
  isLoadingData = true;
  isSaving = false;
  errorMsg = '';

  constructor(
    public dialogRef: MatDialogRef<EditBookingDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { bookingId: number; guestName: string },
    private fb: FormBuilder,
    private bookingService: BookingService,
    private snackBar: MatSnackBar,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.editForm = this.fb.group({
      checkInDate:     [null, Validators.required],
      checkOutDate:    [null, Validators.required],
      numGuests:       [1, [Validators.required, Validators.min(1), Validators.max(10)]],
      specialRequests: [''],
      notes:           ['']
    });

    // Load current booking data
    this.bookingService.getById(this.data.bookingId).subscribe({
      next: res => {
        const b: BookingDto = res.data;
        this.editForm.patchValue({
          checkInDate:     new Date(b.checkInDate),
          checkOutDate:    new Date(b.checkOutDate),
          numGuests:       b.numGuests,
          specialRequests: b.specialRequests || '',
          notes:           b.notes || ''
        });
        this.isLoadingData = false;
      },
      error: () => { this.isLoadingData = false; }
    });
  }

  onSubmit(): void {
    if (this.editForm.invalid) { this.editForm.markAllAsTouched(); return; }
    this.isSaving = true;
    this.errorMsg = '';

    const v = this.editForm.value;
    const dto = {
      checkInDate:     this.formatDate(v.checkInDate),
      checkOutDate:    this.formatDate(v.checkOutDate),
      numGuests:       v.numGuests,
      specialRequests: v.specialRequests,
      notes:           v.notes
    };

    this.http.put<any>(`${environment.apiUrl}/bookings/${this.data.bookingId}`, dto).subscribe({
      next: () => {
        this.isSaving = false;
        this.snackBar.open('✅ Cập nhật booking thành công!', 'Đóng', { duration: 3000, panelClass: 'snack-success' });
        this.dialogRef.close(true);
      },
      error: err => {
        this.isSaving = false;
        this.errorMsg = err.error?.message || err.error?.errors?.[0] || 'Cập nhật thất bại. Vui lòng thử lại.';
      }
    });
  }

  close(): void { this.dialogRef.close(false); }

  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
