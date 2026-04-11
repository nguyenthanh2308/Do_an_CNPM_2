import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/models';

export interface InvoiceDto {
  invoiceId: number;
  bookingId: number;
  invoiceNumber: string;
  issuedAt: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  status: string;
  notes?: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  private apiUrl = '/api/invoices';

  constructor(private http: HttpClient) {}

  getByBooking(bookingId: number): Observable<ApiResponse<InvoiceDto[]>> {
    return this.http.get<ApiResponse<InvoiceDto[]>>(`${this.apiUrl}/booking/${bookingId}`);
  }

  getById(invoiceId: number): Observable<ApiResponse<InvoiceDto>> {
    return this.http.get<ApiResponse<InvoiceDto>>(`${this.apiUrl}/${invoiceId}`);
  }
}
