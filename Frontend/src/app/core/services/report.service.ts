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
      params: { startDate, endDate }
    });
  }

  getOccupancyReport(date: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.APIUrl}/occupancy`, {
      params: { date }
    });
  }
}
