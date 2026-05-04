import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/models';

export interface GuestProfileDto {
  guestId: number;
  userId?: number | null;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  idNumber?: string | null;
  idType: string;
  nationality?: string | null;
  dateOfBirth?: string | null;
  address?: string | null;
  createdAt: string;
  totalBookings: number;
}

export interface UpdateGuestProfileDto {
  fullName?: string;
  email?: string;
  phone?: string;
  idNumber?: string;
  idType?: string;
  nationality?: string;
  dateOfBirth?: string | null;
  address?: string;
}

@Injectable({ providedIn: 'root' })
export class GuestAccountService {
  private readonly API = `${environment.apiUrl}/guest-account`;

  constructor(private readonly http: HttpClient) {}

  getProfile(): Observable<ApiResponse<GuestProfileDto>> {
    return this.http.get<ApiResponse<GuestProfileDto>>(`${this.API}/profile`);
  }

  updateProfile(dto: UpdateGuestProfileDto): Observable<ApiResponse<GuestProfileDto>> {
    return this.http.put<ApiResponse<GuestProfileDto>>(`${this.API}/profile`, dto);
  }
}
