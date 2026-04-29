import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { RoomService } from '../../../core/services/room.service';
import { HotelService } from '../../../core/services/hotel.service';
import { HotelDto, RoomDto } from '../../../core/models/models';
import { environment } from '../../../../environments/environment';
import { GuestHeaderComponent } from '../components/guest-header.component';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-guest-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    GuestHeaderComponent,
    MatCardModule,
    MatButtonModule,
    MatIconModule
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

  hotelCards: Array<{ title: string; subtitle: string; imageUrl: string; tag: string }> = [];
  roomCards: Array<{ title: string; subtitle: string; imageUrl: string; tag: string }> = [];
  achievements: Array<{ value: string; label: string; tone: string }> = [];
  introPoints = ['Khách sạn đối tác chọn lọc', 'Nhiều hạng phòng theo ngân sách', 'Quy trình đặt phòng đơn giản'];

  readonly heroImageUrl = 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1400&q=85';

  readonly features = [
    {
      icon: 'apartment',
      iconColor: '#06b6d4',
      iconBg: 'rgba(6,182,212,0.1)',
      title: 'Đa dạng khách sạn',
      desc: 'Hệ thống hợp tác với nhiều khách sạn 3–5 sao được chọn lọc kỹ càng trên toàn quốc.'
    },
    {
      icon: 'king_bed',
      iconColor: '#8b5cf6',
      iconBg: 'rgba(139,92,246,0.1)',
      title: 'Nhiều hạng phòng',
      desc: 'Từ phòng Standard tiết kiệm đến Suite sang trọng, đáp ứng mọi nhu cầu và ngân sách.'
    },
    {
      icon: 'bolt',
      iconColor: '#f59e0b',
      iconBg: 'rgba(245,158,11,0.1)',
      title: 'Đặt phòng tức thì',
      desc: 'Xác nhận ngay lập tức, quy trình đặt phòng đơn giản chỉ vài bước nhanh chóng.'
    },
    {
      icon: 'verified_user',
      iconColor: '#10b981',
      iconBg: 'rgba(16,185,129,0.1)',
      title: 'Thanh toán an toàn',
      desc: 'Hệ thống bảo mật đa lớp, hỗ trợ nhiều hình thức thanh toán linh hoạt.'
    }
  ];

  readonly lifestyleImages = [
    {
      url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80',
      label: 'Hồ bơi sang trọng',
      tag: 'Pool & Spa',
      span: 'wide'
    },
    {
      url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80',
      label: 'Ẩm thực đặc sắc',
      tag: 'Fine Dining',
      span: 'tall'
    },
    {
      url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80',
      label: 'Dịch vụ Spa thư giãn',
      tag: 'Wellness',
      span: 'normal'
    }
  ];

  readonly testimonials = [
    {
      avatar: 'N',
      name: 'Nguyễn Minh Anh',
      location: 'Hà Nội',
      rating: 5,
      text: 'Hệ thống đặt phòng rất tiện lợi và nhanh chóng. Tôi đã đặt được phòng Suite tuyệt vời chỉ trong vài phút. Dịch vụ khách sạn vượt ngoài mong đợi!'
    },
    {
      avatar: 'T',
      name: 'Trần Bảo Long',
      location: 'TP. Hồ Chí Minh',
      rating: 5,
      text: 'Giá cả hợp lý, nhiều lựa chọn khách sạn đa dạng. Quy trình thanh toán rõ ràng và an toàn. Tôi hoàn toàn hài lòng và sẽ tiếp tục sử dụng.'
    },
    {
      avatar: 'L',
      name: 'Lê Thị Thu Hà',
      location: 'Đà Nẵng',
      rating: 5,
      text: 'Tìm kiếm phòng theo ngân sách rất dễ dàng. Hình ảnh và mô tả phòng chính xác so với thực tế. Chắc chắn sẽ giới thiệu cho bạn bè!'
    }
  ];

  constructor(
    private roomService: RoomService,
    private hotelService: HotelService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadHotels();
    this.loadRooms();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get hotelTrackCards(): Array<{ title: string; subtitle: string; imageUrl: string; tag: string }> {
    return [...this.hotelCards, ...this.hotelCards];
  }

  get roomTrackCards(): Array<{ title: string; subtitle: string; imageUrl: string; tag: string }> {
    return [...this.roomCards, ...this.roomCards];
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  getStars(rating: number): number[] {
    return Array(rating).fill(0);
  }

  resolveImageUrl(url: string | undefined, fallback: string): string {
    if (!url || !url.trim()) return fallback;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return url.startsWith('/') ? `${this.mediaBaseUrl}${url}` : `${this.mediaBaseUrl}/${url}`;
  }

  private loadHotels(): void {
    this.hotelService.getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          const hotels = (res.data ?? []).filter(h => h.isActive);
          this.hotelCards = this.buildHotelCards(hotels);
          this.refreshAchievements();
        },
        error: () => {
          this.hotelCards = this.buildHotelCards([]);
          this.refreshAchievements();
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
          this.refreshAchievements();
        },
        error: () => {
          this.roomCards = this.buildRoomCards([]);
          this.refreshAchievements();
        }
      });
  }

  private refreshAchievements(): void {
    const hotels = this.hotelCards.length;
    const rooms = this.roomCards.length;
    this.achievements = [
      { value: `${hotels}+`, label: 'Khách sạn đối tác', tone: 'a' },
      { value: `${rooms}+`, label: 'Hình ảnh phòng cập nhật', tone: 'b' },
      { value: '24/7', label: 'Nền tảng hoạt động', tone: 'c' },
      { value: '99%', label: 'Khách hàng hài lòng', tone: 'd' }
    ];
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
      tag: room.status === 'Available' ? 'Sẵn sàng' : room.status
    }));
  }
}
