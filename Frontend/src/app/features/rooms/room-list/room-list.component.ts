import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { RoomService } from '../../../core/services/room.service';
import { AuthService } from '../../../core/services/auth.service';
import { SignalRService, RoomStatusChangedEvent } from '../../../core/services/signalr.service';
import { RoomDto, RoomStatus } from '../../../core/models/models';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterModule } from '@angular/router';
import { SimpleRoomFormComponent } from '../room-form.component';

@Component({
  selector: 'app-room-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatDialogModule,
    MatSnackBarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatChipsModule,
    MatDividerModule
  ],
  templateUrl: './room-list.component.html',
  styleUrls: ['./room-list.component.scss']
})
export class RoomListComponent implements OnInit, OnDestroy {

  // ── Table ──────────────────────────────────────────────────────────────
  displayedColumns = ['roomNumber', 'floor', 'roomTypeName', 'status', 'hotelName', 'actions'];
  dataSource = new MatTableDataSource<RoomDto>([]);
  totalCount = 0;
  isLoading = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // ── Filter Form ────────────────────────────────────────────────────────
  filterForm: FormGroup;
  statusOptions: { value: string; label: string; color: string }[] = [
    { value: '',             label: 'Tất cả',      color: '' },
    { value: 'Available',   label: 'Trống',        color: 'chip-available' },
    { value: 'Occupied',    label: 'Có khách',     color: 'chip-occupied' },
    { value: 'Dirty',       label: 'Cần dọn',      color: 'chip-dirty' },
    { value: 'Maintenance', label: 'Bảo trì',      color: 'chip-maintenance' },
    { value: 'OutOfService',label: 'Ngừng hoạt động', color: 'chip-out' },
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private roomService: RoomService,
    public authService: AuthService,
    private signalRService: SignalRService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      search: [''],
      status: [''],
      roomTypeId: [null]
    });
  }

  ngOnInit(): void {
    this.loadRooms();
    
    // Khởi tạo connection SignalR
    this.signalRService.startConnection();

    // Lắng nghe sự kiện RoomStatusChanged từ Backend
    this.signalRService.roomStatusChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe((event: RoomStatusChangedEvent) => {
        const room = this.dataSource.data.find(r => r.roomId === event.roomId);
        if (room) {
          room.status = event.newStatus as RoomStatus;
          // Hiển thị toast cho Housekeeping/Manager
          this.snackBar.open(
            `Phòng ${event.roomNumber} vừa chuyển thành ${this.getStatusLabel(event.newStatus)}`,
            'Đóng', { duration: 5000, panelClass: 'snack-info' }
          );
        }
      });

    // Auto filter khi thay đổi form (debounce 400ms)
    this.filterForm.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.applyFilter();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadRooms(): void {
    this.isLoading = true;
    const { status, roomTypeId } = this.filterForm.value;

    this.roomService.getAll({ status: status || undefined, roomTypeId: roomTypeId || undefined })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.dataSource.data = res.data;
          this.dataSource.sort = this.sort;
          this.dataSource.paginator = this.paginator;
          this.totalCount = res.data.length;
          this.isLoading = false;
        },
        error: () => {
          this.showError('Không thể tải danh sách phòng.');
          this.isLoading = false;
        }
      });
  }

  applyFilter(): void {
    const search = this.filterForm.get('search')?.value?.trim().toLowerCase() ?? '';
    this.dataSource.filterPredicate = (room: RoomDto) =>
      room.roomNumber.toLowerCase().includes(search) ||
      room.roomTypeName.toLowerCase().includes(search) ||
      room.hotelName.toLowerCase().includes(search);
    this.dataSource.filter = search || ' ';
    this.loadRooms();
  }

  onStatusChange(status: string): void {
    this.filterForm.patchValue({ status }, { emitEvent: false });
    this.loadRooms();
  }

  clearFilters(): void {
    this.filterForm.reset({ search: '', status: '', roomTypeId: null });
    this.loadRooms();
  }

  // ── Actions ────────────────────────────────────────────────────────────
  openAddRoomDialog(): void {
    const dialogRef = this.dialog.open(SimpleRoomFormComponent, {
      width: '600px',
      data: { mode: 'create' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadRooms();
      }
    });
  }
  viewDetail(room: RoomDto): void {
    // Navigate to detail or open dialog
    // this.router.navigate(['/rooms', room.roomId]);
    console.log('View detail:', room);
  }

  updateStatus(room: RoomDto, newStatus: RoomStatus): void {
    this.roomService.updateStatus(room.roomId, { status: newStatus }).subscribe({
      next: () => {
        this.showSuccess(`Phòng ${room.roomNumber} → ${newStatus}`);
        this.loadRooms();
      },
      error: (err) => this.showError(err.error?.errors?.[0] ?? 'Cập nhật thất bại.')
    });
  }

  deleteRoom(room: RoomDto): void {
    if (!confirm(`Bạn có chắc muốn vô hiệu hóa phòng ${room.roomNumber}?`)) return;
    this.roomService.delete(room.roomId).subscribe({
      next: () => {
        this.showSuccess(`Phòng ${room.roomNumber} đã được vô hiệu hóa.`);
        this.loadRooms();
      },
      error: (err) => this.showError(err.error?.errors?.[0] ?? 'Xóa thất bại.')
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      Available: 'chip-available', Occupied: 'chip-occupied',
      Dirty: 'chip-dirty', Maintenance: 'chip-maintenance',
      OutOfService: 'chip-out'
    };
    return map[status] ?? '';
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      Available: 'Trống', Occupied: 'Có khách',
      Dirty: 'Cần dọn', Maintenance: 'Bảo trì',
      OutOfService: 'Ngừng HĐ'
    };
    return map[status] ?? status;
  }

  getStatusIcon(status: string): string {
    const map: Record<string, string> = {
      Available: 'check_circle', Occupied: 'person',
      Dirty: 'cleaning_services', Maintenance: 'build',
      OutOfService: 'block'
    };
    return map[status] ?? 'help';
  }

  private showSuccess(msg: string): void {
    this.snackBar.open(msg, 'Đóng', { duration: 3000, panelClass: 'snack-success' });
  }

  private showError(msg: string): void {
    this.snackBar.open(msg, 'Đóng', { duration: 4000, panelClass: 'snack-error' });
  }
}
