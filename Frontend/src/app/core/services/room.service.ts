import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiResponse, RoomDto, AvailableRoomDto,
  SearchAvailableRoomsDto, UpdateRoomStatusDto, CreateRoomDto, UpdateRoomDto
} from '../models/models';

@Injectable({ providedIn: 'root' })
export class RoomService {
  private readonly API = `${environment.apiUrl}/rooms`;
  private readonly ROOM_TYPE_API = `${environment.apiUrl}/room-types`;

  constructor(private http: HttpClient) {}

  /** Danh sách tất cả phòng (có filter) */
  getAll(filters?: { hotelId?: number; roomTypeId?: number; status?: string }): Observable<ApiResponse<RoomDto[]>> {
    let params = new HttpParams();
    if (filters?.hotelId)    params = params.set('hotelId', filters.hotelId);
    if (filters?.roomTypeId) params = params.set('roomTypeId', filters.roomTypeId);
    if (filters?.status)     params = params.set('status', filters.status);
    return this.http.get<ApiResponse<RoomDto[]>>(this.API, { params });
  }

  /** Chi tiết phòng */
  getById(id: number): Observable<ApiResponse<RoomDto>> {
    return this.http.get<ApiResponse<RoomDto>>(`${this.API}/${id}`);
  }

  /** RatePlans của phòng */
  getRatePlans(roomId: number): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.API}/${roomId}/rateplans`);
  }

  /** Tìm phòng trống */
  getAvailableRooms(filter: SearchAvailableRoomsDto): Observable<ApiResponse<AvailableRoomDto[]>> {
    let params = new HttpParams()
      .set('checkIn', filter.checkIn)
      .set('checkOut', filter.checkOut);
    if (filter.guests)     params = params.set('guests', filter.guests);
    if (filter.roomTypeId) params = params.set('roomTypeId', filter.roomTypeId);
    if (filter.maxPrice)   params = params.set('maxPrice', filter.maxPrice);
    return this.http.get<ApiResponse<AvailableRoomDto[]>>(
      `${environment.apiUrl}/bookings/available-rooms`, { params });
  }

  /** Cập nhật trạng thái phòng */
  updateStatus(id: number, dto: UpdateRoomStatusDto): Observable<ApiResponse<RoomDto>> {
    return this.http.put<ApiResponse<RoomDto>>(`${this.API}/${id}/status`, dto);
  }

  /** Tạo phòng mới */
  create(dto: CreateRoomDto): Observable<ApiResponse<RoomDto>> {
    return this.http.post<ApiResponse<RoomDto>>(this.API, dto);
  }

  /** Cập nhật phòng */
  update(id: number, dto: UpdateRoomDto): Observable<ApiResponse<RoomDto>> {
    return this.http.put<ApiResponse<RoomDto>>(`${this.API}/${id}`, dto);
  }

  /** Xóa mềm phòng */
  delete(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.API}/${id}`);
  }
}
