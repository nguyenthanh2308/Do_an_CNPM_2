import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { RoomService } from '../../../core/services/room.service';
import { AvailableRoomDto } from '../../../core/models/models';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-guest-home',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCardModule
  ],
  templateUrl: './guest-home.component.html',
  styleUrl: './guest-home.component.scss'
})
export class GuestHomeComponent {
  fullName: string;
  searchForm: FormGroup;
  availableRooms: AvailableRoomDto[] = [];
  isLoading = false;
  searchError = '';
  hasSearched = false;
  highlights = [
    'Đặt phòng 24/7',
    'Thanh toán bảo mật',
    'Hỗ trợ đa nền tảng'
  ];

  features = [
    {
      icon: 'event_available',
      title: 'Đặt Phòng Online',
      description: 'Đặt phòng nhanh chóng mọi lúc mọi nơi với quy trình đơn giản.'
    },
    {
      icon: 'credit_card',
      title: 'Thanh Toán Bảo Mật',
      description: 'Nhiều phương thức thanh toán an toàn, bảo mật tuyệt đối.'
    },
    {
      icon: 'local_offer',
      title: 'Khuyến Mãi Hấp Dẫn',
      description: 'Ưu đãi linh hoạt theo mùa, giảm giá độc quyền cho khách hàng.'
    },
    {
      icon: 'support_agent',
      title: 'Hỗ Trợ 24/7',
      description: 'Đội ngũ hỗ trợ sẵn sàng đồng hành cùng bạn trong suốt kỳ nghỉ.'
    }
  ];

  achievements = [
    { icon: 'apartment', value: '5+', label: 'Khách sạn đối tác' },
    { icon: 'meeting_room', value: '100+', label: 'Phòng đang vận hành' },
    { icon: 'event', value: '500+', label: 'Lượt đặt thành công' },
    { icon: 'groups', value: '1000+', label: 'Khách hàng tin dùng' }
  ];

  constructor(
    private authService: AuthService,
    private roomService: RoomService,
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

  signOut() {
    this.authService.logout();
  }

  scrollTo(sectionId: string) {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

  private toApiDate(date: Date): string {
    return new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
      .toISOString()
      .split('T')[0];
  }
}
