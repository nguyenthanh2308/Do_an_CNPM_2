import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PagedResult } from '../models/models';

export interface GuestDto {
  guestId: number;
  userId?: number;
  fullName: string;
  email?: string;
  phone?: string;
  idNumber?: string;
  idType?: string;
  nationality?: string;
  address?: string;
  dateOfBirth?: string;
  createdAt: string;
  totalBookings?: number;
}

export interface GuestFilterDto {
  search?: string;
  page: number;
  pageSize: number;
}

@Injectable({ providedIn: 'root' })
export class GuestService {
  private readonly API = `${environment.apiUrl}/guests`;

  constructor(private http: HttpClient) {}

  getAll(filter: GuestFilterDto): Observable<ApiResponse<PagedResult<GuestDto>>> {
    let params = new HttpParams()
      .set('page', filter.page)
      .set('pageSize', filter.pageSize);
    if (filter.search) params = params.set('search', filter.search);
    return this.http.get<ApiResponse<PagedResult<GuestDto>>>(this.API, { params });
  }

  getById(id: number): Observable<ApiResponse<GuestDto>> {
    return this.http.get<ApiResponse<GuestDto>>(`${this.API}/${id}`);
  }

  create(dto: Partial<GuestDto>): Observable<ApiResponse<GuestDto>> {
    return this.http.post<ApiResponse<GuestDto>>(this.API, dto);
  }

  update(id: number, dto: Partial<GuestDto>): Observable<ApiResponse<GuestDto>> {
    return this.http.put<ApiResponse<GuestDto>>(`${this.API}/${id}`, dto);
  }
}
