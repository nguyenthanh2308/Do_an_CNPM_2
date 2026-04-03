import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BookingService } from '../../../core/services/booking.service';
import { CheckOutDto } from '../../../core/models/models';

@Component({
  selector: 'app-checkout-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatSelectModule, MatIconModule, MatDividerModule
  ],
  templateUrl: './checkout-dialog.component.html',
  styleUrl: './checkout-dialog.component.scss'
})
export class CheckoutDialogComponent implements OnInit {
  checkoutForm: FormGroup;
  isLoading = false;

  // Invoice calculations
  baseAmount: number = 0;
  discount: number = 0;
  
  constructor(
    private fb: FormBuilder,
    private bookingService: BookingService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<CheckoutDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { bookingId: number, baseAmount: number, discountAmount: number, guestName: string, roomNumbers: string }
  ) {
    this.baseAmount = data.baseAmount || 0;
    this.discount = data.discountAmount || 0;

    this.checkoutForm = this.fb.group({
      surcharges: [0, [Validators.required, Validators.min(0)]],
      taxPercent: [10, [Validators.required, Validators.min(0), Validators.max(100)]], // Default 10% VAT
      paymentMethod: ['Cash', Validators.required],
      amountPaid: [0, [Validators.required, Validators.min(0)]],
      notes: ['']
    });

    // Auto-fill amount paid to suggestion
    this.checkoutForm.valueChanges.subscribe(() => {
      // we can't patch value inside valueChanges directly without emitEvent: false or it loops
    });
  }

  ngOnInit(): void {
    // Set initial amountPaid
    this.checkoutForm.patchValue({ amountPaid: this.getFinalTotal() });
  }

  // Tiền tạm tính trước thuế
  getSubTotal(): number {
    const surcharges = this.checkoutForm.get('surcharges')?.value || 0;
    return Math.max(0, this.baseAmount - this.discount + surcharges);
  }

  getTaxAmount(): number {
    const taxPercent = this.checkoutForm.get('taxPercent')?.value || 0;
    return (this.getSubTotal() * taxPercent) / 100;
  }

  getFinalTotal(): number {
    return this.getSubTotal() + this.getTaxAmount();
  }

  getChangeAmount(): number {
    const amountPaid = this.checkoutForm.get('amountPaid')?.value || 0;
    return amountPaid - this.getFinalTotal();
  }

  suggestAmount() {
    this.checkoutForm.patchValue({ amountPaid: this.getFinalTotal() });
  }

  onSubmit() {
    if (this.checkoutForm.invalid) return;

    if (this.getChangeAmount() < 0) {
      this.snackBar.open('Số tiền khách đưa không đủ để thanh toán!', 'Đóng', { duration: 3000 });
      return;
    }

    this.isLoading = true;
    const formVals = this.checkoutForm.value;

    const payload: CheckOutDto = {
      bookingId: this.data.bookingId,
      notes: formVals.notes,
      surcharges: formVals.surcharges,
      taxAmount: this.getTaxAmount(),
      paymentMethod: formVals.paymentMethod,
      amountPaid: formVals.amountPaid
    };

    this.bookingService.checkOut(payload).subscribe({
      next: (res) => {
        this.snackBar.open('Trả phòng & Thanh toán thành công!', 'OK', { duration: 4000 });
        this.dialogRef.close(true); // Trả về true để báo component gọi refresh danh sách
      },
      error: (err) => {
        this.isLoading = false;
        this.snackBar.open(err.error?.Message || 'Lỗi trả phòng', 'Đóng', { duration: 4000 });
      }
    });
  }
}
