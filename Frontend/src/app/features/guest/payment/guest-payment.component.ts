import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BookingService } from '../../../core/services/booking.service';
import { PaymentService } from '../../../core/services/payment.service';
import { BookingDto, CreatePaymentDto } from '../../../core/models/models';
import { Subject, takeUntil } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatPrefix, MatSuffix } from '@angular/material/form-field';

@Component({
  selector: 'app-guest-payment',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatCheckboxModule,
    MatPrefix,
    MatSuffix
  ],
  templateUrl: './guest-payment.component.html',
  styleUrl: './guest-payment.component.scss'
})
export class GuestPaymentComponent implements OnInit, OnDestroy {
  paymentForm!: FormGroup;
  booking: BookingDto | null = null;
  isLoadingBooking = true;
  isProcessing = false;
  
  bookingError = '';
  paymentMethods = [
    { value: 'Cash', label: 'Tiền mặt' },
    { value: 'CreditCard', label: 'Thẻ tín dụng' },
    { value: 'BankTransfer', label: 'Chuyển khoản ngân hàng' },
    { value: 'Online', label: 'Thanh toán online' }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private bookingService: BookingService,
    private paymentService: PaymentService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.paymentForm = this.fb.group({
      paymentMethod: ['Online', Validators.required],
      amount: ['', [Validators.required, Validators.min(0)]],
      cardNumber: [''],
      cardHolder: [''],
      expiryMonth: [''],
      expiryYear: [''],
      cvv: [''],
      transactionId: [''],
      acceptTerms: [false, Validators.requiredTrue]
    });

    // Get booking ID from query params or session storage
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const bookingId = params['bookingId'] || sessionStorage.getItem('lastBookingId');
      if (bookingId) {
        this.loadBooking(parseInt(bookingId));
      } else {
        this.bookingError = 'Không tìm thấy mã đặt phòng';
        this.isLoadingBooking = false;
      }
    });

    // Update validation based on payment method
    this.paymentForm.get('paymentMethod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(method => this.updatePaymentValidation(method));
  }

  loadBooking(bookingId: number): void {
    this.isLoadingBooking = true;
    this.bookingService.getById(bookingId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.booking = res.data;
          this.paymentForm.patchValue({
            amount: this.booking?.finalAmount || 0
          });
          this.isLoadingBooking = false;
        },
        error: (err) => {
          this.bookingError = err.error?.message || 'Không thể tải thông tin đặt phòng';
          this.isLoadingBooking = false;
        }
      });
  }

  updatePaymentValidation(method: string): void {
    const cardNumberControl = this.paymentForm.get('cardNumber');
    const cardHolderControl = this.paymentForm.get('cardHolder');
    const expiryMonthControl = this.paymentForm.get('expiryMonth');
    const expiryYearControl = this.paymentForm.get('expiryYear');
    const cvvControl = this.paymentForm.get('cvv');

    if (method === 'CreditCard') {
      cardNumberControl?.setValidators([
        Validators.required,
        Validators.minLength(13),
        Validators.maxLength(19),
        Validators.pattern(/^\d+$/)
      ]);
      cardHolderControl?.setValidators([Validators.required]);
      expiryMonthControl?.setValidators([
        Validators.required,
        Validators.min(1),
        Validators.max(12)
      ]);
      expiryYearControl?.setValidators([Validators.required]);
      cvvControl?.setValidators([
        Validators.required,
        Validators.pattern(/^\d{3,4}$/)
      ]);
    } else {
      cardNumberControl?.clearValidators();
      cardHolderControl?.clearValidators();
      expiryMonthControl?.clearValidators();
      expiryYearControl?.clearValidators();
      cvvControl?.clearValidators();
    }

    cardNumberControl?.updateValueAndValidity();
    cardHolderControl?.updateValueAndValidity();
    expiryMonthControl?.updateValueAndValidity();
    expiryYearControl?.updateValueAndValidity();
    cvvControl?.updateValueAndValidity();
  }

  processPayment(): void {
    if (!this.paymentForm.valid || !this.booking) return;

    this.isProcessing = true;
    const formValue = this.paymentForm.value;
    
    // Create payment DTO for booking
    // Note: In a real system, an invoice would be created first
    const paymentDto: CreatePaymentDto = {
      invoiceId: Math.floor(Date.now() / 1000), // Use a temporary ID
      amount: formValue.amount,
      paymentMethod: formValue.paymentMethod,
      transactionId: formValue.transactionId || this.generateTransactionId(),
      notes: `Thanh toán cho đặt phòng ID: ${this.booking.bookingId}`
    };

    this.paymentService.create(paymentDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.isProcessing = false;
          this.showSuccess('Thanh toán thành công! Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi.');
          sessionStorage.removeItem('lastBookingId');
          setTimeout(() => {
            this.router.navigate(['/home']);
          }, 2500);
        },
        error: (err) => {
          this.isProcessing = false;
          this.showError(err.error?.message || 'Lỗi trong quá trình thanh toán');
        }
      });
  }

  private generateTransactionId(): string {
    return `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  getPaymentMethodLabel(value: string): string {
    return this.paymentMethods.find(m => m.value === value)?.label || value;
  }

  getTotalAmount(): number {
    return this.booking?.finalAmount || 0;
  }

  getNightCount(): number {
    if (!this.booking) return 0;
    const checkIn = new Date(this.booking.checkInDate);
    const checkOut = new Date(this.booking.checkOutDate);
    return Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  }

  onCancel(): void {
    if (confirm('Bạn có chắc muốn hủy thanh toán?')) {
      this.router.navigate(['/home']);
    }
  }

  private showSuccess(msg: string): void {
    this.snackBar.open(msg, 'Đóng', { duration: 4000, panelClass: 'snack-success' });
  }

  private showError(msg: string): void {
    this.snackBar.open(msg, 'Đóng', { duration: 4000, panelClass: 'snack-error' });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
