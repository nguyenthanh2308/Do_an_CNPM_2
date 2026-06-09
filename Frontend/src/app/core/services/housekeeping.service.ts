import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, HousekeepingTaskDto, TaskStatus, TaskType, TaskPriority, PagedResult } from '../models/models';

export interface CreateHousekeepingTaskDto {
  roomId: number;
  taskType: TaskType;
  priority: TaskPriority;
  notes?: string;
  scheduledAt?: string;
  assignedToUserId?: number;
}

export interface UpdateTaskStatusDto {
  status: TaskStatus;
  notes?: string;
}

export interface HousekeepingStaffDto {
  userId: number;
  username: string;
  fullName?: string;
  email: string;
  role: string;
  isActive: boolean;
}

@Injectable({ providedIn: 'root' })
export class HousekeepingService {
  private readonly APIUrl = `${environment.apiUrl}/housekeeping`;
  private readonly StaffUrl = `${environment.apiUrl}/staff`;

  constructor(private http: HttpClient) {}

  getTasks(filters?: { status?: string; taskType?: string; roomId?: number }): Observable<ApiResponse<HousekeepingTaskDto[]>> {
    let params = new HttpParams();
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.taskType) params = params.set('taskType', filters.taskType);
    if (filters?.roomId) params = params.set('roomId', filters.roomId.toString());
    return this.http.get<ApiResponse<HousekeepingTaskDto[]>>(this.APIUrl, { params });
  }

  createTask(dto: CreateHousekeepingTaskDto): Observable<ApiResponse<HousekeepingTaskDto>> {
    return this.http.post<ApiResponse<HousekeepingTaskDto>>(this.APIUrl, dto);
  }

  updateStatus(taskId: number, dto: UpdateTaskStatusDto): Observable<ApiResponse<HousekeepingTaskDto>> {
    return this.http.put<ApiResponse<HousekeepingTaskDto>>(`${this.APIUrl}/${taskId}/status`, dto);
  }

  /** Phân công task cho nhân viên (userId = null để hủy phân công) */
  assignTask(taskId: number, userId: number | null): Observable<ApiResponse<HousekeepingTaskDto>> {
    return this.http.patch<ApiResponse<HousekeepingTaskDto>>(`${this.APIUrl}/${taskId}/assign`, { userId });
  }

  /** Lấy danh sách nhân viên có role Housekeeping (và Manager) để phân công */
  getHousekeepingStaff(): Observable<ApiResponse<PagedResult<HousekeepingStaffDto>>> {
    const params = new HttpParams().set('role', 'Housekeeping').set('pageSize', '100');
    return this.http.get<ApiResponse<PagedResult<HousekeepingStaffDto>>>(this.StaffUrl, { params });
  }
}
