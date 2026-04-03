import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiResponse, PagedResult, BookingDto, BookingSummaryDto,
  CreateBookingDto, CheckInDto, CheckOutDto, CancelBookingDto,
  BookingFilterDto, ValidateVoucherRequest, ValidateVoucherResponse
} from '../models/models';

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly API = `${environment.apiUrl}/bookings`;

  constructor(private http: HttpClient) {}

  /** Danh sách booking có phân trang */
  getAll(filter: BookingFilterDto): Observable<ApiResponse<PagedResult<BookingSummaryDto>>> {
    let params = new HttpParams()
      .set('page', filter.page)
      .set('pageSize', filter.pageSize);
    if (filter.guestName)   params = params.set('guestName', filter.guestName);
    if (filter.status)      params = params.set('status', filter.status);
    if (filter.checkInFrom) params = params.set('checkInFrom', filter.checkInFrom);
    if (filter.checkInTo)   params = params.set('checkInTo', filter.checkInTo);
    return this.http.get<ApiResponse<PagedResult<BookingSummaryDto>>>(this.API, { params });
  }

  /** Chi tiết booking */
  getById(id: number): Observable<ApiResponse<BookingDto>> {
    return this.http.get<ApiResponse<BookingDto>>(`${this.API}/${id}`);
  }

  /** Booking theo guest */
  getByGuest(guestId: number): Observable<ApiResponse<BookingSummaryDto[]>> {
    return this.http.get<ApiResponse<BookingSummaryDto[]>>(`${this.API}/guest/${guestId}`);
  }

  /** Tạo booking */
  create(dto: CreateBookingDto): Observable<ApiResponse<BookingDto>> {
    return this.http.post<ApiResponse<BookingDto>>(this.API, dto);
  }

  /** Check-in */
  checkIn(dto: CheckInDto): Observable<ApiResponse<BookingDto>> {
    return this.http.put<ApiResponse<BookingDto>>(`${this.API}/checkin`, dto);
  }

  /** Check-out */
  checkOut(dto: CheckOutDto): Observable<ApiResponse<BookingDto>> {
    return this.http.put<ApiResponse<BookingDto>>(`${this.API}/checkout`, dto);
  }

  /** Hủy booking */
  cancel(id: number, reason?: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.API}/${id}`,
      { body: { bookingId: id, reason } as CancelBookingDto });
  }

  /** Validate voucher */
  validateVoucher(dto: ValidateVoucherRequest): Observable<ApiResponse<ValidateVoucherResponse>> {
    return this.http.post<ApiResponse<ValidateVoucherResponse>>(`${this.API}/validate-voucher`, dto);
  }
}
