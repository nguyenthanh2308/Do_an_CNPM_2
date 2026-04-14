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
import { RoomTypeService } from '../../../core/services/room-type.service';
import { HotelService } from '../../../core/services/hotel.service';
import { RoomTypeDto, CreateRoomTypeDto, UpdateRoomTypeDto, HotelDto } from '../../../core/models/models';

@Component({
  selector: 'app-room-type-management',
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
  templateUrl: './room-type-management.component.html',
  styleUrl: './room-type-management.component.scss'
})
export class RoomTypeManagementComponent implements OnInit, OnDestroy {
  roomTypes: RoomTypeDto[] = [];
  hotels: HotelDto[] = [];
  selectedHotelId: number | null = null;
  roomTypeForm!: FormGroup;
  displayedColumns: string[] = ['roomTypeId', 'name', 'hotelName', 'basePrice', 'maxOccupancy', 'totalRooms', 'availableRooms', 'isActive', 'actions'];
  
  editingId: number | null = null;
  isLoading = false;
  isFormLoading = false;
  showForm = false;
  pageSize = 10;
  pageIndex = 0;
  totalRows = 0;
  
  private destroy$ = new Subject<void>();

  constructor(
    private roomTypeService: RoomTypeService,
    private hotelService: HotelService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.loadHotels();
    this.loadRoomTypes();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.roomTypeForm = this.fb.group({
      hotelId: ['', Validators.required],
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      basePrice: ['', [Validators.required, Validators.min(0)]],
      maxOccupancy: [2, [Validators.required, Validators.min(1), Validators.max(20)]],
      thumbnailUrl: [''],
      areaSqm: ['']
    });
  }

  private loadRoomTypes(): void {
    this.isLoading = true;
    if (this.selectedHotelId) {
      this.roomTypeService.getByHotel(this.selectedHotelId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (rows: RoomTypeDto[]) => {
            this.roomTypes = rows;
            this.totalRows = rows.length;
            this.isLoading = false;
          },
          error: (err: any) => {
            this.isLoading = false;
            this.showError(err.error?.errors?.[0] ?? 'Tải danh sách thất bại.');
          }
        });
      return;
    }

    this.roomTypeService.getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          const rows = response.data || [];
          this.roomTypes = rows;
          this.totalRows = rows.length;
          this.isLoading = false;
        },
        error: (err: any) => {
          this.isLoading = false;
          this.showError(err.error?.errors?.[0] ?? 'Tải danh sách thất bại.');
        }
      });
  }

  private loadHotels(): void {
    this.hotelService.getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.hotels = response.data || [];
        },
        error: () => {
          this.showError('Tải danh sách khách sạn thất bại.');
        }
      });
  }

  openForm(roomType?: RoomTypeDto): void {
    this.showForm = true;
    if (roomType) {
      this.editingId = roomType.roomTypeId;
      this.roomTypeForm.patchValue({
        hotelId: roomType.hotelId,
        name: roomType.name,
        description: roomType.description,
        basePrice: roomType.basePrice,
        maxOccupancy: roomType.maxOccupancy,
        thumbnailUrl: roomType.thumbnailUrl,
        areaSqm: roomType.areaSqm
      });
    } else {
      this.editingId = null;
      this.roomTypeForm.reset({ maxOccupancy: 2 });
    }
  }

  closeForm(): void {
    this.showForm = false;
    this.roomTypeForm.reset({ maxOccupancy: 2 });
    this.editingId = null;
  }

  saveRoomType(): void {
    if (!this.roomTypeForm.valid) return this.showError('Vui lòng điền đầy đủ thông tin.');
    
    this.isFormLoading = true;
    const formValue = this.roomTypeForm.value;

    if (this.editingId) {
      const updateDto: UpdateRoomTypeDto = {
        name: formValue.name,
        description: formValue.description,
        basePrice: formValue.basePrice,
        maxOccupancy: formValue.maxOccupancy,
        thumbnailUrl: formValue.thumbnailUrl,
        areaSqm: formValue.areaSqm
      };
      
      this.roomTypeService.update(this.editingId, updateDto)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.showSuccess(`Loại phòng "${formValue.name}" đã cập nhật.`);
            this.closeForm();
            this.loadRoomTypes();
            this.isFormLoading = false;
          },
          error: () => {
            this.showError('Cập nhật thất bại.');
            this.isFormLoading = false;
          }
        });
    } else {
      const createDto: CreateRoomTypeDto = {
        hotelId: formValue.hotelId,
        name: formValue.name,
        description: formValue.description,
        basePrice: formValue.basePrice,
        maxOccupancy: formValue.maxOccupancy,
        thumbnailUrl: formValue.thumbnailUrl,
        areaSqm: formValue.areaSqm
      };
      
      this.roomTypeService.create(createDto)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.showSuccess(`Loại phòng "${formValue.name}" đã tạo.`);
            this.closeForm();
            this.loadRoomTypes();
            this.isFormLoading = false;
          },
          error: () => {
            this.showError('Tạo thất bại.');
            this.isFormLoading = false;
          }
        });
    }
  }

  editRoomType(roomType: RoomTypeDto): void {
    this.openForm(roomType);
  }

  deleteRoomType(roomType: RoomTypeDto): void {
    const dialogRef = this.dialog.open(MatConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Xác nhận xóa',
        message: `Bạn có chắc chắn muốn vô hiệu hóa loại phòng "${roomType.name}"?`
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.roomTypeService.delete(roomType.roomTypeId)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.showSuccess(`Loại phòng "${roomType.name}" đã được vô hiệu hóa.`);
              this.loadRoomTypes();
            },
            error: () => {
              this.showError('Xóa thất bại.');
            }
          });
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadRoomTypes();
  }

  onHotelFilterChange(hotelId: number | null): void {
    this.selectedHotelId = hotelId;
    this.pageIndex = 0;
    this.loadRoomTypes();
  }

  getHotelName(hotelId: number): string {
    return this.hotels.find(h => h.hotelId === hotelId)?.name ?? 'N/A';
  }

  getStatusLabel(isActive: boolean): string {
    return isActive ? 'Hoạt động' : 'Vô hiệu';
  }

  getStatusClass(isActive: boolean): string {
    return isActive ? 'status-active' : 'status-inactive';
  }

  onThumbnailUploaded(url: string): void {
    this.roomTypeForm.patchValue({ thumbnailUrl: url });
  }

  private showSuccess(msg: string): void {
    this.snackBar.open(msg, 'Đóng', { duration: 3000, panelClass: 'snack-success' });
  }

  private showError(msg: string): void {
    this.snackBar.open(msg, 'Đóng', { duration: 4000, panelClass: 'snack-error' });
  }
}
