import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
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
import { Subject, takeUntil } from 'rxjs';
import { RoomService } from '../../core/services/room.service';
import { HotelService } from '../../core/services/hotel.service';
import { RoomTypeService } from '../../core/services/room-type.service';
import { CreateRoomDto, HotelDto, RoomTypeDto, UpdateRoomDto } from '../../core/models/models';
import { ImageUploadComponent } from '../../shared/components/image-upload/image-upload.component';

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
    MatSnackBarModule,
    ImageUploadComponent
  ],
  providers: [RoomService],
  template: `
    <h2 mat-dialog-title>{{ data.mode === 'create' ? 'Thêm Phòng' : 'Chỉnh sửa Phòng' }}</h2>
    
    <mat-dialog-content>
      <form [formGroup]="form" class="form-container">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Khach san</mat-label>
          <mat-icon matPrefix>apartment</mat-icon>
          <mat-select formControlName="hotelId">
            <mat-option *ngFor="let hotel of hotels" [value]="hotel.hotelId">
              {{ hotel.name }}
            </mat-option>
          </mat-select>
          <mat-error *ngIf="form.get('hotelId')?.hasError('required')">Khach san la bat buoc</mat-error>
        </mat-form-field>

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
          <mat-select formControlName="roomTypeId" [disabled]="!form.get('hotelId')?.value || isOptionsLoading">
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

        <div class="full-width">
          <label>Hình ảnh phòng</label>
          <app-image-upload
            [imageUrl]="form.get('thumbnailUrl')?.value"
            buttonText="Tải ảnh phòng"
            (imageUrlChange)="onThumbnailUploaded($event)">
          </app-image-upload>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>URL hình ảnh</mat-label>
          <input matInput formControlName="thumbnailUrl" placeholder="https://...">
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
export class SimpleRoomFormComponent implements OnInit, OnDestroy {
  form: FormGroup;
  isLoading = false;
  isOptionsLoading = false;
  hotels: HotelDto[] = [];
  roomTypes: RoomTypeDto[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private roomService: RoomService,
    private hotelService: HotelService,
    private roomTypeService: RoomTypeService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<SimpleRoomFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.form = this.fb.group({
      hotelId: [null, Validators.required],
      roomNumber: ['', Validators.required],
      floor: [1, Validators.required],
      roomTypeId: [null, Validators.required],
      status: ['Available'],
      notes: [''],
      thumbnailUrl: ['']
    });

    if (this.data?.room) {
      this.form.patchValue({
        hotelId: this.data.room.hotelId,
        roomNumber: this.data.room.roomNumber,
        floor: this.data.room.floor,
        roomTypeId: this.data.room.roomTypeId,
        status: this.data.room.status,
        notes: this.data.room.notes,
        thumbnailUrl: this.data.room.thumbnailUrl
      });
    }
  }

  ngOnInit(): void {
    this.loadHotels();

    this.form.get('hotelId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((hotelId) => {
        this.form.patchValue({ roomTypeId: null }, { emitEvent: false });
        if (hotelId) {
          this.loadRoomTypesByHotel(hotelId);
        } else {
          this.roomTypes = [];
        }
      });

    const initialHotelId = this.form.get('hotelId')?.value;
    if (initialHotelId) {
      this.loadRoomTypesByHotel(initialHotelId);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadHotels(): void {
    this.hotelService.getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.hotels = res.data ?? [];
        },
        error: () => {
          this.snackBar.open('Khong the tai danh sach khach san', 'Dong', { duration: 3000 });
        }
      });
  }

  private loadRoomTypesByHotel(hotelId: number): void {
    this.isOptionsLoading = true;
    this.roomTypeService.getByHotel(hotelId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (roomTypes) => {
          this.roomTypes = roomTypes;
          this.isOptionsLoading = false;
        },
        error: () => {
          this.roomTypes = [];
          this.isOptionsLoading = false;
          this.snackBar.open('Khong the tai loai phong theo khach san', 'Dong', { duration: 3000 });
        }
      });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (!this.form.valid) return;

    this.isLoading = true;
    if (this.data.mode === 'edit' && this.data?.room?.roomId) {
      const updateDto: UpdateRoomDto = {
        roomTypeId: this.form.value.roomTypeId,
        roomNumber: this.form.value.roomNumber,
        floor: this.form.value.floor,
        notes: this.form.value.notes,
        thumbnailUrl: this.form.value.thumbnailUrl
      };

      this.roomService.update(this.data.room.roomId, updateDto).subscribe({
        next: () => {
          this.snackBar.open('Phòng đã được cập nhật thành công', 'Đóng', { duration: 3000, panelClass: 'snack-success' });
          this.isLoading = false;
          this.dialogRef.close(true);
        },
        error: (err: any) => {
          this.snackBar.open(err.error?.errors?.[0] ?? 'Cập nhật phòng thất bại', 'Đóng', { duration: 4000, panelClass: 'snack-error' });
          this.isLoading = false;
        }
      });
      return;
    }

    const createDto: CreateRoomDto = this.form.value;
    this.roomService.create(createDto).subscribe({
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

  onThumbnailUploaded(url: string): void {
    this.form.patchValue({ thumbnailUrl: url });
  }
}
