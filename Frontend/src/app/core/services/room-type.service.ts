import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/models';

@Injectable({ providedIn: 'root' })
export class RoomTypeService {
  private readonly API = `${environment.apiUrl}/room-types`;

  constructor(private http: HttpClient) {}

  /** Danh sách tất cả loại phòng */
  getAll(activeOnly: boolean = true): Observable<ApiResponse<any[]>> {
    const params = new HttpParams().set('activeOnly', activeOnly);
    return this.http.get<ApiResponse<any[]>>(this.API, { params });
  }

  /** Chi tiết loại phòng */
  getById(id: number): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.API}/${id}`);
  }

  /** Tạo loại phòng mới */
  create(data: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(this.API, data);
  }

  /** Cập nhật loại phòng */
  update(id: number, data: any): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.API}/${id}`, data);
  }

  /** Xóa loại phòng */
  delete(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.API}/${id}`);
  }
}
