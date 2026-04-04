import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, HousekeepingTaskDto, TaskStatus, TaskType, TaskPriority } from '../models/models';

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

@Injectable({ providedIn: 'root' })
export class HousekeepingService {
  private readonly APIUrl = `${environment.apiUrl}/housekeeping`;

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
    return this.http.patch<ApiResponse<HousekeepingTaskDto>>(`${this.APIUrl}/${taskId}/status`, dto);
  }

  assignTask(taskId: number, userId: number): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(`${this.APIUrl}/${taskId}/assign`, { userId });
  }
}
