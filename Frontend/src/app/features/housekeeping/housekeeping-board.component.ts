import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatBadgeModule } from '@angular/material/badge';
import { Subject, takeUntil, interval } from 'rxjs';

import { HousekeepingService, CreateHousekeepingTaskDto } from '../../core/services/housekeeping.service';
import { SignalRService } from '../../core/services/signalr.service';
import { HousekeepingTaskDto, TaskStatus, TaskType, TaskPriority } from '../../core/models/models';

@Component({
  selector: 'app-housekeeping-board',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatSnackBarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDialogModule,
    MatBadgeModule
  ],
  templateUrl: './housekeeping-board.component.html',
  styleUrls: ['./housekeeping-board.component.scss']
})
export class HousekeepingBoardComponent implements OnInit, OnDestroy {

  isLoading = true;
  allTasks: HousekeepingTaskDto[] = [];
  filterForm: FormGroup;

  private destroy$ = new Subject<void>();

  // ── Filter options ──────────────────────────────────────────────────────
  taskTypeOptions = [
    { value: '', label: 'Tất cả loại' },
    { value: 'Cleaning',    label: '🧹 Dọn phòng' },
    { value: 'Maintenance', label: '🔧 Bảo trì' },
    { value: 'Inspection',  label: '🔍 Kiểm tra' },
  ];

  priorityOptions: { value: TaskPriority; label: string }[] = [
    { value: 'High',   label: 'Cao' },
    { value: 'Medium', label: 'Trung bình' },
    { value: 'Low',    label: 'Thấp' },
  ];

  // ── Kanban columns config ───────────────────────────────────────────────
  columns: { status: TaskStatus; label: string; icon: string; colorClass: string }[] = [
    { status: 'Pending',    label: 'Chờ thực hiện', icon: 'schedule',         colorClass: 'col-pending' },
    { status: 'InProgress', label: 'Đang thực hiện', icon: 'autorenew',       colorClass: 'col-progress' },
    { status: 'Completed',  label: 'Hoàn thành',     icon: 'check_circle',    colorClass: 'col-done' },
  ];

  constructor(
    private housekeepingService: HousekeepingService,
    private signalRService: SignalRService,
    private snackBar: MatSnackBar,
    private fb: FormBuilder,
  ) {
    this.filterForm = this.fb.group({ taskType: [''] });
  }

  ngOnInit(): void {
    this.loadTasks();

    // Auto-refresh every 30s
    interval(30000).pipe(takeUntil(this.destroy$)).subscribe(() => this.loadTasks(false));

    // SignalR: new housekeeping task notification
    this.signalRService.newHousekeepingTask$
      .pipe(takeUntil(this.destroy$))
      .subscribe((payload: any) => {
        if (payload) {
          this.snackBar.open(`📋 Task mới: Phòng ${payload.roomNumber} - ${payload.taskType}`, 'Đóng', {
            duration: 5000, panelClass: 'snack-info'
          });
          this.loadTasks(false);
        }
      });

    // Filter changes
    this.filterForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.loadTasks());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Data Loading ────────────────────────────────────────────────────────

  loadTasks(showSpinner = true): void {
    if (showSpinner) this.isLoading = true;
    const { taskType } = this.filterForm.value;

    this.housekeepingService.getTasks({ taskType: taskType || undefined })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: { data: HousekeepingTaskDto[] }) => {
          this.allTasks = res.data || [];
          this.isLoading = false;
        },
        error: () => {
          // Demo data nếu API chưa sẵn sàng
          this.allTasks = this.getDemoTasks();
          this.isLoading = false;
        }
      });
  }

  // ── Kanban helpers ──────────────────────────────────────────────────────

  getTasksByStatus(status: TaskStatus): HousekeepingTaskDto[] {
    return this.allTasks.filter(t => t.status === status);
  }

  getColumnCount(status: TaskStatus): number {
    return this.getTasksByStatus(status).length;
  }

  // ── Status transition ───────────────────────────────────────────────────

  moveToNext(task: HousekeepingTaskDto): void {
    const nextMap: Record<string, TaskStatus> = {
      Pending: 'InProgress',
      InProgress: 'Completed',
    };
    const nextStatus = nextMap[task.status];
    if (!nextStatus) return;
    this.updateStatus(task, nextStatus);
  }

  moveToPrev(task: HousekeepingTaskDto): void {
    const prevMap: Record<string, TaskStatus> = {
      InProgress: 'Pending',
      Completed: 'InProgress',
    };
    const prevStatus = prevMap[task.status];
    if (!prevStatus) return;
    this.updateStatus(task, prevStatus);
  }

  confirmMaintenanceDone(task: HousekeepingTaskDto): void {
    // Mark task completed AND note maintenance done
    this.housekeepingService.updateStatus(task.taskId, {
      status: 'Completed',
      notes: (task.notes || '') + ' [Bảo trì hoàn thành - phòng sẵn sàng]'
    }).subscribe({
      next: () => {
        this.snackBar.open(`✅ Bảo trì phòng ${task.roomNumber} hoàn thành — Phòng chuyển về Available`, 'Đóng', {
          duration: 5000, panelClass: 'snack-success'
        });
        this.loadTasks(false);
      },
      error: (err: { error?: { errors?: string[] } }) => this.showError(err?.error?.errors?.[0] ?? 'Cập nhật thất bại')
    });
  }

  private updateStatus(task: HousekeepingTaskDto, status: TaskStatus): void {
    this.housekeepingService.updateStatus(task.taskId, { status })
      .subscribe({
        next: () => {
          task.status = status;
          this.snackBar.open(`Task phòng ${task.roomNumber} → ${this.getStatusLabel(status)}`, 'Đóng', {
            duration: 3000, panelClass: 'snack-success'
          });
        },
        error: (err: { error?: { errors?: string[] } }) => this.showError(err?.error?.errors?.[0] ?? 'Cập nhật thất bại')
      });
  }

  // ── UI Helpers ──────────────────────────────────────────────────────────

  getTypeIcon(type: string): string {
    return { Cleaning: '🧹', Maintenance: '🔧', Inspection: '🔍' }[type] ?? '📋';
  }

  getTypeLabel(type: string): string {
    return { Cleaning: 'Dọn phòng', Maintenance: 'Bảo trì', Inspection: 'Kiểm tra' }[type] ?? type;
  }

  getPriorityClass(priority: string): string {
    return { High: 'priority-high', Medium: 'priority-medium', Low: 'priority-low' }[priority] ?? '';
  }

  getPriorityLabel(priority: string): string {
    return { High: '🔴 Cao', Medium: '🟡 Trung bình', Low: '🟢 Thấp' }[priority] ?? priority;
  }

  getStatusLabel(status: string): string {
    return { Pending: 'Chờ thực hiện', InProgress: 'Đang làm', Completed: 'Hoàn thành', Cancelled: 'Hủy' }[status] ?? status;
  }

  canMoveNext(status: string): boolean {
    return status === 'Pending' || status === 'InProgress';
  }

  canMovePrev(status: string): boolean {
    return status === 'InProgress' || status === 'Completed';
  }

  isMaintenanceInProgress(task: HousekeepingTaskDto): boolean {
    return task.taskType === 'Maintenance' && task.status === 'InProgress';
  }

  getTimeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} phút trước`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} giờ trước`;
    return `${Math.floor(hours / 24)} ngày trước`;
  }

  private showError(msg: string): void {
    this.snackBar.open(msg, 'Đóng', { duration: 4000, panelClass: 'snack-error' });
  }

  // ── Demo fallback data ──────────────────────────────────────────────────
  private getDemoTasks(): HousekeepingTaskDto[] {
    const now = new Date().toISOString();
    return [
      { taskId: 1, roomId: 101, roomNumber: '101', floor: 1, roomTypeName: 'Standard', currentRoomStatus: 'Dirty',
        createdByUserId: 1, createdByUserName: 'Manager', taskType: 'Cleaning', status: 'Pending',
        priority: 'High', notes: 'Khách vừa check-out', createdAt: now, assignedToUserName: 'Lan' },
      { taskId: 2, roomId: 202, roomNumber: '202', floor: 2, roomTypeName: 'Deluxe', currentRoomStatus: 'Maintenance',
        createdByUserId: 1, createdByUserName: 'Manager', taskType: 'Maintenance', status: 'InProgress',
        priority: 'High', notes: 'Điều hòa hỏng', createdAt: now, assignedToUserName: 'Hùng' },
      { taskId: 3, roomId: 305, roomNumber: '305', floor: 3, roomTypeName: 'Suite', currentRoomStatus: 'Dirty',
        createdByUserId: 1, createdByUserName: 'Manager', taskType: 'Cleaning', status: 'Pending',
        priority: 'Medium', notes: '', createdAt: now, assignedToUserName: 'Mai' },
      { taskId: 4, roomId: 103, roomNumber: '103', floor: 1, roomTypeName: 'Standard', currentRoomStatus: 'Available',
        createdByUserId: 1, createdByUserName: 'Manager', taskType: 'Inspection', status: 'Completed',
        priority: 'Low', notes: 'Kiểm tra định kỳ', createdAt: now, assignedToUserName: 'Lan' },
      { taskId: 5, roomId: 201, roomNumber: '201', floor: 2, roomTypeName: 'Deluxe', currentRoomStatus: 'Dirty',
        createdByUserId: 1, createdByUserName: 'Manager', taskType: 'Cleaning', status: 'InProgress',
        priority: 'Medium', notes: '', createdAt: now, assignedToUserName: 'Mai' },
    ];
  }
}
