import { Component, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { BookingService } from '../../../core/services/booking.service';
import { RoomService } from '../../../core/services/room.service';
import { RatePlanService } from '../../../core/services/rate-plan.service';
import { AuthService } from '../../../core/services/auth.service';
import { AvailableRoomDto, CreateBookingDto, UserInfo } from '../../../core/models/models';
import { Subject, takeUntil } from 'rxjs';
import { MatStepper } from '@angular/material/stepper';
import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { GuestHeaderComponent } from '../components/guest-header.component';

@Component({
  selector: 'app-guest-booking',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    GuestHeaderComponent,
    FormsModule,
    ReactiveFormsModule,
    MatStepperModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCardModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './guest-booking.component.html',
  styleUrl: './guest-booking.component.scss'
})
export class GuestBookingComponent implements OnInit, OnDestroy {
  @ViewChild('stepper') stepper!: MatStepper;
  
  searchForm!: FormGroup;
  bookingForm!: FormGroup;
  selectedRoom: AvailableRoomDto | null = null;
  availableRooms: AvailableRoomDto[] = [];
  currentUser: UserInfo | null = null;
  preSelectedRoom: any | null = null;

  // Voucher validation state
  voucherCode = '';
  appliedVoucher: any = null;
  isApplyingVoucher = false;
  voucherError = '';
  voucherSuccess = '';

  // Advanced search and room validation state
  showAdvancedSearch = false;
  roomUnavailableError = '';
  isCheckingAvailability = false;
  
  isSearching = false;
  isBooking = false;
  searchError = '';
  bookingError = '';
  hasSearched = false;
  skipSearchStep = false;  // Flag to skip search step when room is pre-selected

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private bookingService: BookingService,
    private roomService: RoomService,
    private ratePlanService: RatePlanService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.currentUser = this.authService.getCurrentUser();
  }

  ngOnInit(): void {
    // Check if there's a pre-selected room from room listing
    const selectedRoomData = sessionStorage.getItem('selectedRoomForBooking');
    if (selectedRoomData) {
      this.preSelectedRoom = JSON.parse(selectedRoomData);
      // Clear from session storage after reading
      sessionStorage.removeItem('selectedRoomForBooking');
    }

    // Initialize search form
    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 1);
    checkIn.setHours(0, 0, 0, 0);
    const checkOut = new Date();
    checkOut.setDate(checkOut.getDate() + 2);
    checkOut.setHours(0, 0, 0, 0);

    this.searchForm = this.fb.group({
      checkInDate: [checkIn, Validators.required],
      checkOutDate: [checkOut, Validators.required],
      guests: [1, [Validators.required, Validators.min(1), Validators.max(10)]]
    });

    // Initialize booking form
    this.bookingForm = this.fb.group({
      specialRequests: ['']
    });

    // If there's a pre-selected room, skip search step and go directly to details
    if (this.preSelectedRoom) {
      this.skipSearchStep = true;
      // Auto-search to get AvailableRoomDto with pricePerNight
      const ci = checkIn.toISOString().split('T')[0];
      const co = checkOut.toISOString().split('T')[0];
      const searchDto = {
        checkIn: ci,
        checkOut: co,
        guests: 1
      };

      this.roomService.getAvailableRooms(searchDto)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            // Find the pre-selected room in the available rooms
            const foundRoom = res.data?.find(r => r.roomId === this.preSelectedRoom.roomId);
            if (foundRoom) {
              this.selectedRoom = foundRoom;  // Use the AvailableRoomDto with price
              this.availableRooms = [foundRoom];
              this.hasSearched = true;
              this.showSuccess(`Phòng ${this.preSelectedRoom.roomNumber} đã được chọn!`);
            } else {
              // If not available, use the room data with base price as fallback
              this.selectedRoom = {
                ...this.preSelectedRoom,
                pricePerNight: this.preSelectedRoom.roomTypeDetails?.basePrice || 0
              } as AvailableRoomDto;
              this.hasSearched = true;
              this.showInfo(`Phòng ${this.preSelectedRoom.roomNumber} không trống cho khoảng thời gian này, nhưng bạn có thể tiếp tục đặt.`);
            }
          },
          error: (err) => {
            // Use fallback price if search fails
            this.selectedRoom = {
              ...this.preSelectedRoom,
              pricePerNight: this.preSelectedRoom.roomTypeDetails?.basePrice || 0
            } as AvailableRoomDto;
            this.hasSearched = true;
            this.showInfo(`Sử dụng giá cơ bản: ${this.selectedRoom.pricePerNight} VND/đêm`);
          }
        });

      // Advance to step 2 after stepper is initialized
      setTimeout(() => {
        if (this.stepper) {
          this.stepper.next();
        }
      }, 100);
    } else {
      // Auto-trigger search for default dates so available rooms are pre-loaded immediately!
      setTimeout(() => {
        this.searchAvailableRooms();
      }, 100);
    }
  }

  searchAvailableRooms(): void {
    if (this.searchForm.invalid) return;

    this.isSearching = true;
    this.searchError = '';
    this.clearVoucher();
    const formValue = this.searchForm.value;

    const searchDto = {
      checkIn: this.formatDate(formValue.checkInDate),
      checkOut: this.formatDate(formValue.checkOutDate),
      guests: formValue.guests
    };

    this.roomService.getAvailableRooms(searchDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.availableRooms = res.data || [];
          this.hasSearched = true;
          this.isSearching = false;
          
          // Auto-select pre-selected room if found in available rooms
          if (this.preSelectedRoom && this.availableRooms.length > 0) {
            const foundRoom = this.availableRooms.find(r => r.roomId === this.preSelectedRoom.roomId);
            if (foundRoom) {
              this.selectRoom(foundRoom);
              this.showSuccess(`Phòng ${this.preSelectedRoom.roomNumber} đã sẵn có!`);
            } else {
              this.showInfo(`Phòng ${this.preSelectedRoom.roomNumber} không trống trong khoảng thời gian này`);
            }
          }
          
          if (this.availableRooms.length === 0) {
            this.showInfo('Không tìm thấy phòng trống cho khoảng thời gian này');
          }
        },
        error: (err) => {
          this.searchError = err.error?.message || 'Lỗi tìm kiếm phòng';
          this.isSearching = false;
        }
      });
  }

  selectRoom(room: AvailableRoomDto): void {
    this.selectedRoom = room;
    this.clearVoucher();
  }

  createBooking(): void {
    if (!this.selectedRoom || this.bookingForm.invalid || !this.currentUser) return;

    this.isBooking = true;
    this.bookingError = '';

    const selectedRoom = this.selectedRoom; // Store in local variable to avoid null check in nested subscribe

    // First, fetch the rate plan for the selected room type
    this.ratePlanService.getAll(undefined, selectedRoom.roomTypeId)
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res) => {
          if (!res.data || res.data.length === 0) {
            this.bookingError = 'Không tìm thấy gói giá cho phòng này';
            this.isBooking = false;
            return;
          }

          const formValue = this.searchForm.value;
          const selectedRatePlan = res.data[0]; // Use first rate plan
          
          console.log('Select rate plan:', selectedRatePlan);
          
          const bookingDto: CreateBookingDto = {
            guestId: this.currentUser!.userId,
            ratePlanId: (selectedRatePlan as any).RatePlanId || (selectedRatePlan as any).ratePlanId,
            checkInDate: this.formatDate(formValue.checkInDate),
            checkOutDate: this.formatDate(formValue.checkOutDate),
            numGuests: formValue.guests,
            bookingSource: 'Online',
            specialRequests: this.bookingForm.get('specialRequests')?.value,
            roomIds: [selectedRoom.roomId],
            promotionId: this.appliedVoucher?.promotionId || undefined
          };

          console.log('Booking DTO:', bookingDto);

          this.bookingService.create(bookingDto)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (res) => {
                console.log('Booking created successfully:', res);
                this.isBooking = false;
                this.showSuccess(`Đặt phòng thành công! Mã đặt phòng: ${res.data.bookingId}`);
                // Store booking for payment
                sessionStorage.setItem('lastBookingId', res.data.bookingId.toString());
                // Navigate to payment or booking confirmation
                setTimeout(() => {
                  this.router.navigate(['/guest/payment'], { 
                    queryParams: { bookingId: res.data.bookingId } 
                  });
                }, 2000);
              },
              error: (err) => {
                console.error('Booking creation error:', err);
                console.error('Status:', err.status);
                console.error('Error response:', err.error);
                console.error('Full error object:', JSON.stringify(err, null, 2));
                this.bookingError = err.error?.message || err.error?.errors?.[0] || err.message || 'Không thể tạo đặt phòng';
                this.isBooking = false;
              }
            });
        },
        error: (err) => {
          this.bookingError = 'Không thể lấy thông tin giá. Vui lòng thử lại.';
          this.isBooking = false;
        }
      });
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private showSuccess(msg: string): void {
    this.snackBar.open(msg, 'Đóng', { duration: 4000, panelClass: 'snack-success' });
  }

  private showInfo(msg: string): void {
    this.snackBar.open(msg, 'Đóng', { duration: 3000, panelClass: 'snack-info' });
  }

  getNightCount(): number {
    if (!this.searchForm) return 0;
    const checkIn = new Date(this.searchForm.get('checkInDate')?.value);
    const checkOut = new Date(this.searchForm.get('checkOutDate')?.value);
    
    // Normalize times to midnight to ensure exact day difference calculation
    checkIn.setHours(0, 0, 0, 0);
    checkOut.setHours(0, 0, 0, 0);
    
    const diffTime = checkOut.getTime() - checkIn.getTime();
    return Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)));
  }

  changeNights(change: number): void {
    if (!this.searchForm) return;
    const checkIn = new Date(this.searchForm.get('checkInDate')?.value);
    const currentNights = this.getNightCount();
    const newNights = currentNights + change;
    if (newNights < 1) return;

    const newCheckOut = new Date(checkIn.getTime() + newNights * 24 * 60 * 60 * 1000);
    this.searchForm.get('checkOutDate')?.setValue(newCheckOut);
    this.clearVoucher();
    this.checkRoomAvailabilityForNewDates();
  }

  onDatesChanged(): void {
    this.clearVoucher();
    this.checkRoomAvailabilityForNewDates();
  }

  checkRoomAvailabilityForNewDates(): void {
    if (!this.selectedRoom || !this.searchForm) return;

    this.isCheckingAvailability = true;
    this.roomUnavailableError = '';

    const formValue = this.searchForm.value;
    const searchDto = {
      checkIn: this.formatDate(formValue.checkInDate),
      checkOut: this.formatDate(formValue.checkOutDate),
      guests: formValue.guests
    };

    const currentRoomId = this.selectedRoom.roomId;

    this.roomService.getAvailableRooms(searchDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.isCheckingAvailability = false;
          const isStillAvailable = res.data && res.data.some(r => r.roomId === currentRoomId);
          if (!isStillAvailable) {
            this.roomUnavailableError = '⚠️ Rất tiếc, phòng này đã được đặt hoặc không khả dụng trong khoảng thời gian mới chọn. Vui lòng giảm số đêm hoặc chọn ngày khác.';
            this.showInfo('Phòng đã chọn không còn trống trong thời gian này.');
          } else {
            this.roomUnavailableError = '';
          }
        },
        error: (err) => {
          this.isCheckingAvailability = false;
          console.warn('Lỗi kiểm tra tính khả dụng của phòng:', err);
        }
      });
  }

  getTotalPrice(): number {
    if (!this.selectedRoom) return 0;
    return this.getNightCount() * (this.selectedRoom?.pricePerNight || 0);
  }

  clearVoucher(): void {
    this.voucherCode = '';
    this.appliedVoucher = null;
    this.voucherError = '';
    this.voucherSuccess = '';
  }

  applyVoucher(): void {
    if (!this.voucherCode || !this.voucherCode.trim()) {
      this.voucherError = 'Vui lòng nhập mã giảm giá';
      this.voucherSuccess = '';
      return;
    }

    this.isApplyingVoucher = true;
    this.voucherError = '';
    this.voucherSuccess = '';

    const req = {
      code: this.voucherCode.trim().toUpperCase(),
      bookingAmount: this.getTotalPrice()
    };

    this.bookingService.validateVoucher(req)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.isApplyingVoucher = false;
          if (res.success && res.data?.isValid) {
            this.appliedVoucher = res.data;
            this.voucherSuccess = res.data.message || 'Áp dụng mã giảm giá thành công!';
            this.showSuccess(this.voucherSuccess);
          } else {
            this.appliedVoucher = null;
            this.voucherError = res.data?.message || res.message || 'Mã giảm giá không hợp lệ';
            this.showInfo(this.voucherError);
          }
        },
        error: (err) => {
          this.isApplyingVoucher = false;
          this.appliedVoucher = null;
          this.voucherError = err.error?.message || 'Lỗi kiểm tra mã giảm giá';
          this.showInfo(this.voucherError);
        }
      });
  }

  getDiscountAmount(): number {
    return this.appliedVoucher?.discountAmount || 0;
  }

  getFinalTotalPrice(): number {
    return Math.max(0, this.getTotalPrice() - this.getDiscountAmount());
  }

  onCancel(): void {
    this.router.navigate(['/home']);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
