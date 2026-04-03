import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class PromotionService {
  private readonly APIUrl = `${environment.apiUrl}/promotions`;

  constructor(private http: HttpClient) {}

  getAll(searchCode?: string, isActiveOnly?: boolean): Observable<ApiResponse<any>> {
    const params: any = {};
    if (searchCode) params.searchCode = searchCode;
    if (isActiveOnly !== undefined) params.isActiveOnly = isActiveOnly;
    return this.http.get<ApiResponse<any>>(this.APIUrl, { params });
  }

  getById(id: number): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.APIUrl}/${id}`);
  }

  create(data: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(this.APIUrl, data);
  }

  update(id: number, data: any): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.APIUrl}/${id}`, data);
  }

  delete(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.APIUrl}/${id}`);
  }
}
