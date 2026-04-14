import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { RoomService } from '../../../core/services/room.service';
import { HotelService } from '../../../core/services/hotel.service';
import { AvailableRoomDto, HotelDto, RoomDto } from '../../../core/models/models';
import { environment } from '../../../../environments/environment';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';

@Component({
  selector: 'app-guest-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCardModule,
    MatMenuModule
  ],
  templateUrl: './guest-home.component.html',
  styleUrl: './guest-home.component.scss'
})
export class GuestHomeComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly mediaBaseUrl = environment.apiUrl.replace(/\/api\/?$/, '');
  private readonly fallbackHotelImages = [
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=1200&q=80'
  ];
  private readonly fallbackRoomImages = [
    'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1616594039964-3ad4f99d14e1?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'
  ];

  fullName: string;
  searchForm: FormGroup;
  availableRooms: AvailableRoomDto[] = [];
  hotelCards: Array<{ title: string; subtitle: string; imageUrl: string; tag: string }> = [];
  roomCards: Array<{ title: string; subtitle: string; imageUrl: string; tag: string }> = [];
  isLoading = false;
  searchError = '';
  hasSearched = false;
  introPoints = ['Khách sạn đối tác chọn lọc', 'Nhiều hạng phòng theo ngân sách', 'Quy trình đặt phòng đơn giản'];

  constructor(
    private authService: AuthService,
    private roomService: RoomService,
    private hotelService: HotelService,
    private fb: FormBuilder
  ) {
    this.fullName = this.authService.getCurrentUser()?.fullName || 'Khách';

    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 1);
    const checkOut = new Date();
    checkOut.setDate(checkOut.getDate() + 2);

    this.searchForm = this.fb.group({
      checkInDate: [checkIn, Validators.required],
      checkOutDate: [checkOut, Validators.required],
      guests: [1, [Validators.required, Validators.min(1), Validators.max(10)]]
    });
  }

  ngOnInit(): void {
    this.loadHotels();
    this.loadRooms();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  signOut() {
    this.authService.logout();
  }

  get hotelTrackCards(): Array<{ title: string; subtitle: string; imageUrl: string; tag: string }> {
    return [...this.hotelCards, ...this.hotelCards];
  }

  get roomTrackCards(): Array<{ title: string; subtitle: string; imageUrl: string; tag: string }> {
    return [...this.roomCards, ...this.roomCards];
  }

  searchRooms() {
    if (this.searchForm.invalid) {
      this.searchForm.markAllAsTouched();
      return;
    }

    const checkInDate = this.searchForm.value.checkInDate as Date;
    const checkOutDate = this.searchForm.value.checkOutDate as Date;

    if (checkOutDate <= checkInDate) {
      this.searchError = 'Ngày trả phòng phải sau ngày nhận phòng.';
      return;
    }

    this.isLoading = true;
    this.searchError = '';
    this.hasSearched = true;

    this.roomService.getAvailableRooms({
      checkIn: this.toApiDate(checkInDate),
      checkOut: this.toApiDate(checkOutDate),
      guests: this.searchForm.value.guests
    }).subscribe({
      next: (res) => {
        this.availableRooms = res.data ?? [];
        this.isLoading = false;
      },
      error: () => {
        this.availableRooms = [];
        this.isLoading = false;
        this.searchError = 'Không thể tải danh sách phòng trống. Vui lòng thử lại.';
      }
    });
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

  private loadHotels(): void {
    this.hotelService.getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          const hotels = (res.data ?? []).filter(h => h.isActive);
          this.hotelCards = this.buildHotelCards(hotels);
        },
        error: () => {
          this.hotelCards = this.buildHotelCards([]);
        }
      });
  }

  private loadRooms(): void {
    this.roomService.getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          const rooms = (res.data ?? []).filter(r => r.isActive);
          this.roomCards = this.buildRoomCards(rooms);
        },
        error: () => {
          this.roomCards = this.buildRoomCards([]);
        }
      });
  }

  private buildHotelCards(hotels: HotelDto[]): Array<{ title: string; subtitle: string; imageUrl: string; tag: string }> {
    if (hotels.length === 0) {
      return this.fallbackHotelImages.map((image, index) => ({
        title: `Khách sạn đối tác ${index + 1}`,
        subtitle: 'Đang mở rộng hệ thống hợp tác',
        imageUrl: image,
        tag: 'Partner'
      }));
    }

    return hotels.slice(0, 10).map((hotel, index) => ({
      title: hotel.name,
      subtitle: hotel.address,
      imageUrl: this.resolveImageUrl(hotel.thumbnailUrl, this.fallbackHotelImages[index % this.fallbackHotelImages.length]),
      tag: `${hotel.starRating || 0} sao`
    }));
  }

  private buildRoomCards(rooms: RoomDto[]): Array<{ title: string; subtitle: string; imageUrl: string; tag: string }> {
    if (rooms.length === 0) {
      return this.fallbackRoomImages.map((image, index) => ({
        title: `Hạng phòng ${index + 1}`,
        subtitle: 'Không gian được cập nhật liên tục',
        imageUrl: image,
        tag: 'Room'
      }));
    }

    return rooms.slice(0, 12).map((room, index) => ({
      title: `Phòng ${room.roomNumber}`,
      subtitle: `${room.hotelName} - ${room.roomTypeName}`,
      imageUrl: this.resolveImageUrl(room.thumbnailUrl, this.fallbackRoomImages[index % this.fallbackRoomImages.length]),
      tag: room.status === 'Available' ? 'San sang' : room.status
    }));
  }

  private toApiDate(date: Date): string {
    return new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
      .toISOString()
      .split('T')[0];
  }
}
