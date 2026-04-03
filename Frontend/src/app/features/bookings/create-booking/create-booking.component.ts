import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';

import { BookingService } from '../../../core/services/booking.service';
import { RoomService } from '../../../core/services/room.service';
import { RatePlanService } from '../../../core/services/rate-plan.service';

@Component({
  selector: 'app-create-booking',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatStepperModule,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatSelectModule, MatDatepickerModule, MatNativeDateModule,
    MatIconModule, MatCardModule, MatDividerModule
  ],
  templateUrl: './create-booking.component.html',
  styleUrl: './create-booking.component.scss'
})
export class CreateBookingComponent implements OnInit {
  isLinear = true; // Bắt buộc hoàn thành bước trước mới qua bước sau

  // 1. Bước 1: Thời gian & Tìm Phòng
  searchFormGroup: FormGroup;
  availableRooms: any[] = [];
  ratePlans: any[] = [];
  roomsLoading = false;

  // 2. Bước 2: Thông tin & Voucher
  guestFormGroup: FormGroup;
  voucherMessage = '';
  discountAmount = 0;
  promotionId?: number;

  // 3. Bước 3: Xác nhận tổng kết được binding từ HTML trực tiếp qua form data.

  constructor(
    private fb: FormBuilder,
    private bookingService: BookingService,
    private roomService: RoomService,
    private ratePlanService: RatePlanService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    // Bước 1
    this.searchFormGroup = this.fb.group({
      checkInDate: ['', Validators.required],
      checkOutDate: ['', Validators.required],
      numGuests: [1, [Validators.required, Validators.min(1)]],
      roomId: [null, Validators.required],
      ratePlanId: [null, Validators.required]
    });

    // Bước 2
    this.guestFormGroup = this.fb.group({
      guestId: [1, Validators.required], // Tạm thời hardcode cho Demo, Lễ tân thường gõ ID khách hàng CRM
      voucherCode: [''],
      specialRequests: ['']
    });
  }

  ngOnInit() {
    this.loadRatePlans();
  }

  loadRatePlans() {
    this.ratePlanService.getAll().subscribe(res => {
      this.ratePlans = res.data;
    });
  }

  onSearchRooms() {
    if (this.searchFormGroup.get('checkInDate')?.invalid || this.searchFormGroup.get('checkOutDate')?.invalid) {
      this.snackBar.open('Vui lòng chọn ngày nhận/trả phòng hợp lệ.', 'OK', { duration: 3000 });
      return;
    }
    this.roomsLoading = true;
    
    // Formatting Date for API
    const ci = this.searchFormGroup.value.checkInDate.toISOString().split('T')[0];
    const co = this.searchFormGroup.value.checkOutDate.toISOString().split('T')[0];

    // Mượn tạm API filter phòng trống của system
    this.roomService.getAvailableRooms({ checkIn: ci, checkOut: co }).subscribe({
      next: (res) => {
        this.availableRooms = res.data;
        this.roomsLoading = false;
        if(this.availableRooms.length === 0) {
          this.snackBar.open('Không có phòng trống trong giai đoạn này.', 'Đóng', { duration: 3000 });
        }
      },
      error: () => this.roomsLoading = false
    });
  }

  applyVoucher() {
    const code = this.guestFormGroup.value.voucherCode;
    if (!code) return;

    // Giả lập lấy tiền phòng tạm tính
    const ratePlanId = this.searchFormGroup.value.ratePlanId;
    const plan = this.ratePlans.find(r => r.ratePlanId === ratePlanId);
    let tempAmount = plan ? plan.price : 1000000; 

    this.bookingService.validateVoucher({ code, bookingAmount: tempAmount }).subscribe({
      next: (res) => {
        if (res.data.isValid) {
          this.voucherMessage = `Voucher hợp lệ: Giảm ${res.data.discountAmount} VND`;
          this.discountAmount = res.data.discountAmount;
          this.promotionId = res.data.promotionId;
        } else {
          this.voucherMessage = `❌ Voucher không hợp lệ: ${res.data.message}`;
          this.discountAmount = 0;
          this.promotionId = undefined;
        }
      },
      error: (err) => {
         this.voucherMessage = "Lỗi xác thực Voucher";
      }
    });
  }

  getTempTotal(): number {
    const ratePlanId = this.searchFormGroup.value.ratePlanId;
    const plan = this.ratePlans.find(r => r.ratePlanId === ratePlanId);
    return plan ? plan.price : 0;
  }

  getFinalTotal(): number {
    return Math.max(0, this.getTempTotal() - this.discountAmount);
  }

  submitBooking() {
    if (this.searchFormGroup.invalid || this.guestFormGroup.invalid) return;

    const payload = {
      guestId: this.guestFormGroup.value.guestId,
      ratePlanId: this.searchFormGroup.value.ratePlanId,
      promotionId: this.promotionId,
      checkInDate: this.searchFormGroup.value.checkInDate.toISOString().split('T')[0],
      checkOutDate: this.searchFormGroup.value.checkOutDate.toISOString().split('T')[0],
      numGuests: this.searchFormGroup.value.numGuests,
      bookingSource: 'Direct',
      specialRequests: this.guestFormGroup.value.specialRequests,
      roomIds: [this.searchFormGroup.value.roomId]
    };

    this.bookingService.create(payload as any).subscribe({
      next: () => {
        this.snackBar.open('Khởi tạo đặt phòng thành công!', 'Tuyệt vời', { duration: 4000 });
        this.router.navigate(['/bookings']);
      },
      error: (err) => {
        this.snackBar.open(err.error?.Message || 'Có lỗi xảy ra khi đặt phòng!', 'OK', { duration: 5000 });
      }
    });
  }
}
