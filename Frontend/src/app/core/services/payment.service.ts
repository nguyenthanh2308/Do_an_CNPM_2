import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiResponse,
  PagedResult,
  PaymentDto,
  CreatePaymentDto,
  UpdatePaymentStatusDto
} from '../models/models';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly API = `${environment.apiUrl}/payments`;

  constructor(private http: HttpClient) {}

  getPaged(page = 1, pageSize = 20): Observable<ApiResponse<PagedResult<PaymentDto>>> {
    const params = new HttpParams()
      .set('page', page)
      .set('pageSize', pageSize);
    return this.http.get<ApiResponse<PagedResult<PaymentDto>>>(this.API, { params });
  }

  getById(id: number): Observable<ApiResponse<PaymentDto>> {
    return this.http.get<ApiResponse<PaymentDto>>(`${this.API}/${id}`);
  }

  getByInvoice(invoiceId: number): Observable<ApiResponse<PaymentDto[]>> {
    return this.http.get<ApiResponse<PaymentDto[]>>(`${this.API}/invoice/${invoiceId}`);
  }

  create(dto: CreatePaymentDto): Observable<ApiResponse<PaymentDto>> {
    return this.http.post<ApiResponse<PaymentDto>>(this.API, dto);
  }

  updateStatus(id: number, dto: UpdatePaymentStatusDto): Observable<ApiResponse<PaymentDto>> {
    return this.http.put<ApiResponse<PaymentDto>>(`${this.API}/${id}/status`, dto);
  }
}
