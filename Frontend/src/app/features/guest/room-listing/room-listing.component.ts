import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RoomService } from '../../../core/services/room.service';
import { RoomDto } from '../../../core/models/models';
import { environment } from '../../../../environments/environment';
import { GuestHeaderComponent } from '../components/guest-header.component';
import { RoomDetailDialogComponent } from '../../rooms/room-detail-dialog.component';

@Component({
  selector: 'app-room-listing',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    GuestHeaderComponent,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDialogModule
  ],
  templateUrl: './room-listing.component.html',
  styleUrl: './room-listing.component.scss'
})
export class RoomListingComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly mediaBaseUrl = environment.apiUrl.replace(/\/api\/?$/, '');
  private readonly fallbackRoomImage = 'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1200&q=80';

  rooms: RoomDto[] = [];
  isLoading = true;
  selectedGuests = 0;
  selectedHotelId: number | null = null;

  constructor(
    private readonly roomService: RoomService,
    private readonly snackBar: MatSnackBar,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const hotelId = Number(params.get('hotelId'));
      this.selectedHotelId = Number.isFinite(hotelId) && hotelId > 0 ? hotelId : null;
      this.loadRooms();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadRooms(): void {
    this.isLoading = true;
    this.roomService.getAll(this.selectedHotelId ? { hotelId: this.selectedHotelId } : undefined)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.rooms = (res.data || []).filter(r => r.isActive);
          this.isLoading = false;
        },
        error: () => {
          this.rooms = [];
          this.isLoading = false;
          this.showError('Không thể tải danh sách phòng.');
        }
      });
  }

  getFilteredRooms(): RoomDto[] {
    if (!this.selectedGuests) {
      return this.rooms;
    }
    return this.rooms.filter(room => this.getRoomCapacity(room) >= this.selectedGuests);
  }

  getRoomCapacity(room: RoomDto): number {
    return room.roomTypeDetails?.maxOccupancy ?? 1;
  }

  getRoomImage(room: RoomDto): string {
    const imageUrl = room.thumbnailUrl;
    if (!imageUrl || !imageUrl.trim()) {
      return this.fallbackRoomImage;
    }

    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }

    return imageUrl.startsWith('/') ? `${this.mediaBaseUrl}${imageUrl}` : `${this.mediaBaseUrl}/${imageUrl}`;
  }

  canBook(room: RoomDto): boolean {
    return room.status === 'Available' && room.isActive;
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      Available: 'Trống',
      Occupied: 'Có khách',
      Dirty: 'Đang dọn',
      Maintenance: 'Bảo trì',
      OutOfService: 'Ngừng hoạt động'
    };
    return map[status] ?? status;
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      Available: 'status-available',
      Occupied: 'status-occupied',
      Dirty: 'status-dirty',
      Maintenance: 'status-maintenance',
      OutOfService: 'status-outofservice'
    };
    return map[status] ?? '';
  }

  onBookClick(room: RoomDto): void {
    if (!this.canBook(room)) {
      return;
    }

    sessionStorage.setItem('selectedRoomForBooking', JSON.stringify(room));
    this.router.navigate(['/guest/booking']);
  }

  viewRoom(room: RoomDto, event?: Event): void {
    event?.stopPropagation();
    this.dialog.open(RoomDetailDialogComponent, {
      width: 'min(92vw, 720px)',
      maxHeight: '90vh',
      data: { roomId: room.roomId }
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Đóng', { duration: 4000, panelClass: 'snack-error' });
  }
}
