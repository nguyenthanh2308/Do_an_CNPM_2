import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatConfirmDialogComponent } from '../../../shared/components/mat-confirm-dialog/mat-confirm-dialog.component';
import { ImageUploadComponent } from '../../../shared/components/image-upload/image-upload.component';
import { Subject, takeUntil } from 'rxjs';
import { HotelService } from '../../../core/services/hotel.service';
import { HotelDto, CreateHotelDto, UpdateHotelDto } from '../../../core/models/models';

@Component({
  selector: 'app-hotel-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatPaginatorModule,
    MatDialogModule,
    MatTooltipModule,
    ImageUploadComponent
  ],
  templateUrl: './hotel-management.component.html',
  styleUrl: './hotel-management.component.scss'
})
export class HotelManagementComponent implements OnInit, OnDestroy {
  hotels: HotelDto[] = [];
  hotelForm!: FormGroup;
  isLoading = false;
  isFormLoading = false;
  showForm = false;
  editingId: number | null = null;
  pageSize = 10;
  pageIndex = 0;
  totalRows = 0;

  displayedColumns: string[] = ['hotelId', 'name', 'address', 'phone', 'starRating', 'totalRooms', 'isActive', 'actions'];
  readonly starOptions = [1, 2, 3, 4, 5];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private hotelService: HotelService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadHotels();
  }

  initializeForm(): void {
    this.hotelForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(200)]],
      address: ['', [Validators.maxLength(500)]],
      phone: ['', [Validators.maxLength(20)]],
      email: ['', [Validators.email]],
      description: [''],
      starRating: [3, [Validators.required, Validators.min(1), Validators.max(5)]],
      thumbnailUrl: ['']
    });
  }

  loadHotels(): void {
    this.isLoading = true;
    this.hotelService.getPaged(this.pageIndex + 1, this.pageSize)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.hotels = res.data.data;
          this.totalRows = res.data.totalCount;
          this.isLoading = false;
        },
        error: (err) => {
          this.showError('Lỗi khi tải danh sách khách sạn');
          this.isLoading = false;
        }
      });
  }

  openForm(hotel?: HotelDto): void {
    this.editingId = hotel?.hotelId ?? null;
    this.showForm = true;
    
    if (hotel) {
      this.hotelForm.patchValue({
        name: hotel.name,
        address: hotel.address,
        phone: hotel.phone,
        email: hotel.email,
        description: hotel.description,
        starRating: hotel.starRating,
        thumbnailUrl: hotel.thumbnailUrl
      });
    } else {
      this.hotelForm.reset({ starRating: 3 });
    }
  }

  closeForm(): void {
    this.showForm = false;
    this.editingId = null;
    this.hotelForm.reset({ starRating: 3 });
  }

  saveHotel(): void {
    if (!this.hotelForm.valid) {
      this.showError('Vui lòng nhập đầy đủ thông tin bắt buộc');
      return;
    }

    this.isFormLoading = true;
    const formValue = this.hotelForm.value;

    if (this.editingId) {
      // Update
      const updateDto: UpdateHotelDto = formValue;
      this.hotelService.update(this.editingId, updateDto)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.showSuccess('Cập nhật khách sạn thành công');
            this.closeForm();
            this.loadHotels();
            this.isFormLoading = false;
          },
          error: (err) => {
            if (err?.status === 403) {
              this.showError('Bạn không có quyền cập nhật khách sạn. Vui lòng đăng nhập bằng Admin/Manager.');
            } else if (err?.status === 401) {
              this.showError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
            } else {
              this.showError(err.error?.message || err.error?.errors?.[0] || 'Lỗi cập nhật khách sạn');
            }
            this.isFormLoading = false;
          }
        });
    } else {
      // Create
      const createDto: CreateHotelDto = formValue;
      this.hotelService.create(createDto)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.showSuccess('Thêm khách sạn thành công');
            this.closeForm();
            this.pageIndex = 0;
            this.loadHotels();
            this.isFormLoading = false;
          },
          error: (err) => {
            this.showError(err.error?.message || 'Lỗi thêm khách sạn');
            this.isFormLoading = false;
          }
        });
    }
  }

  editHotel(hotel: HotelDto): void {
    this.openForm(hotel);
  }

  deleteHotel(hotel: HotelDto): void {
    const dialogRef = this.dialog.open(MatConfirmDialogComponent, {
      width: '400px',
      data: { 
        title: 'Xác nhận xoá', 
        message: `Bạn có chắc muốn xoá khách sạn "${hotel.name}"?` 
      }
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result) {
        this.hotelService.delete(hotel.hotelId)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.showSuccess('Xoá khách sạn thành công');
              this.loadHotels();
            },
            error: (err) => {
              this.showError(err.error?.message || 'Lỗi xoá khách sạn');
            }
          });
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadHotels();
  }

  onThumbnailUploaded(url: string): void {
    this.hotelForm.patchValue({ thumbnailUrl: url });
  }

  private showSuccess(msg: string): void {
    this.snackBar.open(msg, 'Đóng', { duration: 3000, panelClass: 'snack-success' });
  }

  private showError(msg: string): void {
    this.snackBar.open(msg, 'Đóng', { duration: 4000, panelClass: 'snack-error' });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
