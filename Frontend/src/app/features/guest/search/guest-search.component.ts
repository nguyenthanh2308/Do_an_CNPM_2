import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { RoomService } from '../../../core/services/room.service';
import { AvailableRoomDto } from '../../../core/models/models';
import { environment } from '../../../../environments/environment';
import { GuestHeaderComponent } from '../components/guest-header.component';

@Component({
  selector: 'app-guest-search',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    GuestHeaderComponent,
    MatButtonModule,
    MatCardModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatNativeDateModule
  ],
  templateUrl: './guest-search.component.html',
  styleUrl: './guest-search.component.scss'
})
export class GuestSearchComponent {
  private readonly mediaBaseUrl = environment.apiUrl.replace(/\/api\/?$/, '');

  searchForm: FormGroup;
  availableRooms: AvailableRoomDto[] = [];
  isLoading = false;
  searchError = '';
  hasSearched = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly roomService: RoomService
  ) {
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

  searchRooms(): void {
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

  resolveImageUrl(url: string | undefined): string {
    if (!url || !url.trim()) {
      return 'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1200&q=80';
    }

    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    return url.startsWith('/') ? `${this.mediaBaseUrl}${url}` : `${this.mediaBaseUrl}/${url}`;
  }

  private toApiDate(date: Date): string {
    return new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
      .toISOString()
      .split('T')[0];
  }
}
