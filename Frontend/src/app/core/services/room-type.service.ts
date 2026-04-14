import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, RoomTypeDto, CreateRoomTypeDto, UpdateRoomTypeDto } from '../models/models';

@Injectable({ providedIn: 'root' })
export class RoomTypeService {
  private readonly apiUrl = `${environment.apiUrl}/room-types`;

  constructor(private http: HttpClient) {}

  /** Lấy danh sách loại phòng (phân trang) */
  getPaged(pageIndex: number = 0, pageSize: number = 10): Observable<ApiResponse<any>> {
    const params = new HttpParams()
      .set('pageIndex', pageIndex)
      .set('pageSize', pageSize);
    return this.http.get<ApiResponse<any>>(this.apiUrl, { params });
  }

  /** Lấy tất cả loại phòng (không phân trang) */
  getAll(): Observable<ApiResponse<RoomTypeDto[]>> {
    return this.http.get<ApiResponse<RoomTypeDto[]>>(`${this.apiUrl}/all`);
  }

  /** Lấy chi tiết loại phòng */
  getById(id: number): Observable<ApiResponse<RoomTypeDto>> {
    return this.http.get<ApiResponse<RoomTypeDto>>(`${this.apiUrl}/${id}`);
  }

  /** Lấy các loại phòng theo khách sạn */
  getByHotel(hotelId: number): Observable<ApiResponse<RoomTypeDto[]>> {
    return this.http.get<ApiResponse<RoomTypeDto[]>>(`${this.apiUrl}/hotel/${hotelId}`);
  }

  /** Tạo loại phòng mới */
  create(dto: CreateRoomTypeDto): Observable<ApiResponse<RoomTypeDto>> {
    return this.http.post<ApiResponse<RoomTypeDto>>(this.apiUrl, dto);
  }

  /** Cập nhật loại phòng */
  update(id: number, dto: UpdateRoomTypeDto): Observable<ApiResponse<RoomTypeDto>> {
    return this.http.put<ApiResponse<RoomTypeDto>>(`${this.apiUrl}/${id}`, dto);
  }

  /** Xóa loại phòng */
  delete(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`);
  }
}
