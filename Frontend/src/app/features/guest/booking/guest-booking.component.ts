import { Component, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BookingService } from '../../../core/services/booking.service';
import { RoomService } from '../../../core/services/room.service';
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

@Component({
  selector: 'app-guest-booking',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
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
    const checkOut = new Date();
    checkOut.setDate(checkOut.getDate() + 2);

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
      this.selectedRoom = this.preSelectedRoom as AvailableRoomDto;
      this.hasSearched = true;
      // Advance to step 2 after stepper is initialized
      setTimeout(() => {
        if (this.stepper) {
          this.stepper.next();
        }
      }, 100);
      this.showSuccess(`Phòng ${this.preSelectedRoom.roomNumber} đã được chọn!`);
    }
  }

  searchAvailableRooms(): void {
    if (this.searchForm.invalid) return;

    this.isSearching = true;
    this.searchError = '';
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
  }

  createBooking(): void {
    if (!this.selectedRoom || this.bookingForm.invalid || !this.currentUser) return;

    this.isBooking = true;
    this.bookingError = '';
    const formValue = this.searchForm.value;
    const bookingDto: CreateBookingDto = {
      guestId: this.currentUser.userId,
      ratePlanId: 1, // Default rate plan ID
      checkInDate: this.formatDate(formValue.checkInDate),
      checkOutDate: this.formatDate(formValue.checkOutDate),
      numGuests: formValue.guests,
      bookingSource: 'Guest Portal',
      specialRequests: this.bookingForm.get('specialRequests')?.value,
      roomIds: [this.selectedRoom.roomId]
    };

    this.bookingService.create(bookingDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
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
          this.bookingError = err.error?.message || err.error?.errors?.[0] || 'Không thể tạo đặt phòng';
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
    return Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  }

  getTotalPrice(): number {
    if (!this.selectedRoom) return 0;
    return this.getNightCount() * (this.selectedRoom?.pricePerNight || 0);
  }

  onCancel(): void {
    this.router.navigate(['/home']);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
