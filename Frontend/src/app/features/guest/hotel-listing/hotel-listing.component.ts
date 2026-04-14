import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HotelService } from '../../../core/services/hotel.service';
import { RoomService } from '../../../core/services/room.service';
import { HotelDto, RoomDto } from '../../../core/models/models';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-hotel-listing',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './hotel-listing.component.html',
  styleUrl: './hotel-listing.component.scss'
})
export class HotelListingComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly mediaBaseUrl = environment.apiUrl.replace(/\/api\/?$/, '');
  readonly fallbackHotelImage = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80';
  readonly fallbackRoomImage = 'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1200&q=80';

  hotels: HotelDto[] = [];
  selectedHotelId: number | null = null;
  selectedGuests = 0;
  selectedHotelRooms: RoomDto[] = [];
  isLoadingHotels = true;
  isLoadingRooms = false;

  constructor(
    private readonly hotelService: HotelService,
    private readonly roomService: RoomService,
    private readonly snackBar: MatSnackBar,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadHotels();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get selectedHotel(): HotelDto | undefined {
    return this.hotels.find(h => h.hotelId === this.selectedHotelId);
  }

  selectHotel(hotelId: number): void {
    this.selectedHotelId = hotelId;
    this.selectedGuests = 0;
    this.loadRoomsByHotel();
  }

  getFilteredRooms(): RoomDto[] {
    if (!this.selectedGuests) {
      return this.selectedHotelRooms;
    }
    return this.selectedHotelRooms.filter(room => this.getRoomCapacity(room) >= this.selectedGuests);
  }

  getRoomCapacity(room: RoomDto): number {
    return room.roomTypeDetails?.maxOccupancy ?? 1;
  }

  resolveImageUrl(url: string | undefined, fallback: string): string {
    if (!url || !url.trim()) {
      return fallback;
    }

    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    return url.startsWith('/') ? `${this.mediaBaseUrl}${url}` : `${this.mediaBaseUrl}/${url}`;
  }

  onBookClick(room: RoomDto): void {
    if (room.status !== 'Available' || !room.isActive) {
      return;
    }
    sessionStorage.setItem('selectedRoomForBooking', JSON.stringify(room));
    this.router.navigate(['/guest/booking']);
  }

  goToRoomPage(hotelId: number): void {
    this.router.navigate(['/guest/rooms'], { queryParams: { hotelId } });
  }

  private loadHotels(): void {
    this.isLoadingHotels = true;
    this.hotelService.getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.hotels = (res.data ?? []).filter(h => h.isActive);
          this.isLoadingHotels = false;
          if (this.hotels.length > 0) {
            this.selectHotel(this.hotels[0].hotelId);
          }
        },
        error: () => {
          this.hotels = [];
          this.isLoadingHotels = false;
          this.showError('Không thể tải danh sách khách sạn.');
        }
      });
  }

  private loadRoomsByHotel(): void {
    if (!this.selectedHotelId) {
      this.selectedHotelRooms = [];
      return;
    }

    this.isLoadingRooms = true;
    this.roomService.getAll({ hotelId: this.selectedHotelId })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.selectedHotelRooms = (res.data ?? []).filter(r => r.isActive);
          this.isLoadingRooms = false;
        },
        error: () => {
          this.selectedHotelRooms = [];
          this.isLoadingRooms = false;
          this.showError('Không thể tải phòng của khách sạn đã chọn.');
        }
      });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Đóng', { duration: 4000, panelClass: 'snack-error' });
  }
}
