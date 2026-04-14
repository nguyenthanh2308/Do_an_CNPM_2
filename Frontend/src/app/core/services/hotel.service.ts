import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PagedResult, HotelDto, CreateHotelDto, UpdateHotelDto } from '../models/models';

@Injectable({ providedIn: 'root' })
export class HotelService {
  private readonly apiUrl = `${environment.apiUrl}/hotels`;

  constructor(private http: HttpClient) {}

  /** Get paginated hotels */
  getPaged(page: number = 1, pageSize: number = 20): Observable<ApiResponse<PagedResult<HotelDto>>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    return this.http.get<ApiResponse<PagedResult<HotelDto>>>(this.apiUrl, { params });
  }

  /** Get all hotels */
  getAll(): Observable<ApiResponse<HotelDto[]>> {
    return this.http.get<ApiResponse<HotelDto[]>>(`${this.apiUrl}/all`);
  }

  /** Get hotel by ID */
  getById(id: number): Observable<ApiResponse<HotelDto>> {
    return this.http.get<ApiResponse<HotelDto>>(`${this.apiUrl}/${id}`);
  }

  /** Create hotel */
  create(dto: CreateHotelDto): Observable<ApiResponse<HotelDto>> {
    return this.http.post<ApiResponse<HotelDto>>(this.apiUrl, dto);
  }

  /** Update hotel */
  update(id: number, dto: UpdateHotelDto): Observable<ApiResponse<HotelDto>> {
    return this.http.put<ApiResponse<HotelDto>>(`${this.apiUrl}/${id}`, dto);
  }

  /** Delete hotel */
  delete(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`);
  }
}
