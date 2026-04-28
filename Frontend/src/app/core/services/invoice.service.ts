import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, PagedResult } from '../models/models';
import { environment } from '../../../environments/environment';

export interface InvoiceDto {
  invoiceId: number;
  bookingId: number;
  invoiceNumber: string;
  guestName?: string;
  roomNumbers?: string;
  issuedAt: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  status: string;       // Draft | Issued | Paid | Cancelled | Overdue
  notes?: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class InvoiceService {
  private readonly apiUrl = `${environment.apiUrl}/invoices`;

  constructor(private http: HttpClient) {}

  getAll(page = 1, pageSize = 20, status?: string): Observable<ApiResponse<PagedResult<InvoiceDto>>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (status) params = params.set('status', status);
    return this.http.get<ApiResponse<PagedResult<InvoiceDto>>>(this.apiUrl, { params });
  }

  getById(invoiceId: number): Observable<ApiResponse<InvoiceDto>> {
    return this.http.get<ApiResponse<InvoiceDto>>(`${this.apiUrl}/${invoiceId}`);
  }

  getByBooking(bookingId: number): Observable<ApiResponse<InvoiceDto[]>> {
    return this.http.get<ApiResponse<InvoiceDto[]>>(`${this.apiUrl}/booking/${bookingId}`);
  }

  updateStatus(invoiceId: number, status: string): Observable<ApiResponse<InvoiceDto>> {
    return this.http.put<ApiResponse<InvoiceDto>>(`${this.apiUrl}/${invoiceId}/status`, { status });
  }
}
