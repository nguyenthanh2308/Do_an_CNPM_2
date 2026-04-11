import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { RoomService } from '../../../core/services/room.service';
import { RoomDto } from '../../../core/models/models';
import { Subject, takeUntil } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-room-listing',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './room-listing.component.html',
  styleUrl: './room-listing.component.scss'
})
export class RoomListingComponent implements OnInit, OnDestroy {
  rooms: RoomDto[] = [];
  isLoading = true;
  filterStatus: string = '';
  private destroy$ = new Subject<void>();

  // Status configurations
  statusConfig = {
    'Available': { label: 'Trống', color: 'status-available', icon: 'check_circle', canBook: true },
    'Occupied': { label: 'Có khách', color: 'status-occupied', icon: 'person', canBook: false },
    'Dirty': { label: 'Đang dọn', color: 'status-dirty', icon: 'cleaning_services', canBook: false },
    'Maintenance': { label: 'Bảo trì', color: 'status-maintenance', icon: 'build', canBook: false },
    'OutOfService': { label: 'Ngừng hoạt động', color: 'status-outofservice', icon: 'block', canBook: false }
  };

  constructor(
    private roomService: RoomService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadAllRooms();
  }

  loadAllRooms(): void {
    this.isLoading = true;
    this.roomService.getAll().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.rooms = res.data || [];
        this.isLoading = false;
      },
      error: (err) => {
        this.showError('Không thể tải danh sách phòng');
        this.isLoading = false;
      }
    });
  }

  filterByStatus(status: string): void {
    this.filterStatus = this.filterStatus === status ? '' : status;
  }

  getFilteredRooms(): RoomDto[] {
    if (!this.filterStatus) return this.rooms;
    return this.rooms.filter(r => r.status === this.filterStatus);
  }

  isUnavailable(status: string): boolean {
    return status !== 'Available';
  }

  getStatusLabel(status: string): string {
    return (this.statusConfig as any)[status]?.label || status;
  }

  getStatusIcon(status: string): string {
    return (this.statusConfig as any)[status]?.icon || 'info';
  }

  getStatusClass(status: string): string {
    return (this.statusConfig as any)[status]?.color || '';
  }

  canBook(room: RoomDto): boolean {
    return room.status === 'Available' && room.isActive;
  }

  getRoomTypeDisplayName(room: RoomDto): string {
    return room.roomTypeDetails?.name || room.roomTypeName || 'Phòng';
  }

  onBookClick(room: RoomDto): void {
    if (this.canBook(room)) {
      // Store selected room in session storage for booking page
      sessionStorage.setItem('selectedRoomForBooking', JSON.stringify(room));
      this.router.navigate(['/guest/booking']);
    }
  }

  private showError(msg: string): void {
    this.snackBar.open(msg, 'Đóng', { duration: 4000, panelClass: 'snack-error' });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
