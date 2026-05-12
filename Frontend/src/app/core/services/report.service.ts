import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private readonly APIUrl = `${environment.apiUrl}/reports`;

  constructor(private http: HttpClient) {}

  getRevenueReport(startDate: string, endDate: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.APIUrl}/revenue`, {
      params: { from: startDate, to: endDate }
    });
  }

  getOccupancyReport(startDate: string, endDate: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.APIUrl}/occupancy`, {
      params: { from: startDate, to: endDate }
    });
  }

  getDashboardStats(hotelId?: number): Observable<ApiResponse<any>> {
    const params: any = {};
    if (hotelId) params['hotelId'] = hotelId;
    return this.http.get<ApiResponse<any>>(`${this.APIUrl}/dashboard`, { params });
  }

  getTopRooms(startDate: string, endDate: string, top: number = 5): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.APIUrl}/top-rooms`, {
      params: { from: startDate, to: endDate, top: top.toString() }
    });
  }
}
