import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { environment } from '../../../environments/environment';
import { RouterModule } from '@angular/router';

// ── Change Role Dialog ──────────────────────────────────────────────────────
import { Component as Comp, Inject } from '@angular/core';

@Comp({
  selector: 'app-change-role-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatSelectModule, MatIconModule],
  template: `
    <div style="background:#ffffff;color:#1e293b;border-radius:14px;overflow:hidden;min-width:360px;box-shadow:0 4px 24px rgba(0,0,0,0.12);">
      <div style="padding:20px 24px;background:linear-gradient(135deg,#eef2ff,#f8fafc);display:flex;align-items:center;gap:12px;border-bottom:1px solid #e2e8f0">
        <mat-icon style="color:#6366f1">manage_accounts</mat-icon>
        <h3 style="margin:0;font-size:1.1rem;font-weight:600;color:#1e293b">Đổi chức vụ — {{data.staff.fullName || data.staff.username}}</h3>
      </div>
      <form [formGroup]="form" (ngSubmit)="save()" style="padding:20px 24px">
        <mat-form-field appearance="fill" style="width:100%">
          <mat-label>Chức vụ mới</mat-label>
          <mat-select formControlName="role">
            <mat-option value="Admin">Admin</mat-option>
            <mat-option value="Manager">Manager</mat-option>
            <mat-option value="Receptionist">Lễ tân (Receptionist)</mat-option>
            <mat-option value="Housekeeping">Dọn phòng (Housekeeping)</mat-option>
          </mat-select>
        </mat-form-field>
        <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:12px;border-top:1px solid #e2e8f0;padding-top:16px">
          <button mat-button type="button" mat-dialog-close>Hủy</button>
          <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid">✅ Lưu</button>
        </div>
      </form>
    </div>
  `
})
export class ChangeRoleDialogComponent {
  form: FormGroup;
  constructor(
    public dialogRef: MatDialogRef<ChangeRoleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { staff: any },
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({ role: [data.staff.role, Validators.required] });
  }
  save() { this.dialogRef.close(this.form.value.role); }
}

// ── Reset Password Dialog ───────────────────────────────────────────────────
@Comp({
  selector: 'app-reset-pwd-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule],
  template: `
    <div style="background:#ffffff;color:#1e293b;border-radius:14px;overflow:hidden;min-width:360px;box-shadow:0 4px 24px rgba(0,0,0,0.12);">
      <div style="padding:20px 24px;background:linear-gradient(135deg,#fef2f2,#fff7ed);display:flex;align-items:center;gap:12px;border-bottom:1px solid #fecaca">
        <mat-icon style="color:#dc2626">lock_reset</mat-icon>
        <h3 style="margin:0;font-size:1.1rem;font-weight:600;color:#1e293b">Đặt lại mật khẩu — {{data.staff.username}}</h3>
      </div>
      <form [formGroup]="form" (ngSubmit)="save()" style="padding:20px 24px">
        <mat-form-field appearance="fill" style="width:100%">
          <mat-label>Mật khẩu mới</mat-label>
          <mat-icon matPrefix>lock</mat-icon>
          <input matInput [type]="showPwd ? 'text' : 'password'" formControlName="newPassword" placeholder="Tối thiểu 6 ký tự">
          <button mat-icon-button matSuffix type="button" (click)="showPwd=!showPwd">
            <mat-icon>{{showPwd ? 'visibility_off' : 'visibility'}}</mat-icon>
          </button>
          <mat-error *ngIf="form.get('newPassword')?.hasError('minlength')">Ít nhất 6 ký tự</mat-error>
        </mat-form-field>
        <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:12px;border-top:1px solid #e2e8f0;padding-top:16px">
          <button mat-button type="button" mat-dialog-close>Hủy</button>
          <button mat-raised-button color="warn" type="submit" [disabled]="form.invalid">🔑 Đặt lại</button>
        </div>
      </form>
    </div>
  `
})
export class ResetPwdDialogComponent {
  form: FormGroup;
  showPwd = false;
  constructor(
    public dialogRef: MatDialogRef<ResetPwdDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { staff: any },
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({ newPassword: ['', [Validators.required, Validators.minLength(6)]] });
  }
  save() { this.dialogRef.close(this.form.value.newPassword); }
}

// ── Main Component ──────────────────────────────────────────────────────────
@Component({
  selector: 'app-staff-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, RouterModule,
    MatTableModule, MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatTooltipModule, MatSnackBarModule, MatProgressBarModule,
    MatChipsModule, MatDialogModule, MatPaginatorModule,
    MatSlideToggleModule, MatDividerModule,
    ChangeRoleDialogComponent, ResetPwdDialogComponent
  ],
  template: `
    <div class="staff-page">
      <!-- Header -->
      <div class="page-header">
        <div class="header-left">
          <h1 class="page-title">
            <mat-icon>badge</mat-icon>
            Quản lý Nhân viên
          </h1>
          <span class="total-badge">{{ totalCount }} tài khoản</span>
        </div>
        <a mat-raised-button color="primary" routerLink="/staff/create" class="create-btn">
          <mat-icon>person_add</mat-icon> Tạo tài khoản mới
        </a>
      </div>

      <!-- Filters -->
      <mat-card class="filter-card">
        <div class="filter-row">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Tìm theo tên / email / username</mat-label>
            <mat-icon matPrefix>search</mat-icon>
            <input matInput [(ngModel)]="searchText" (ngModelChange)="onSearch()" placeholder="Nguyễn Văn A...">
          </mat-form-field>
          <mat-form-field appearance="outline" style="width:200px">
            <mat-label>Chức vụ</mat-label>
            <mat-select [(ngModel)]="filterRole" (selectionChange)="loadData()">
              <mat-option value="">Tất cả</mat-option>
              <mat-option value="Admin">Admin</mat-option>
              <mat-option value="Manager">Manager</mat-option>
              <mat-option value="Receptionist">Lễ tân</mat-option>
              <mat-option value="Housekeeping">Dọn phòng</mat-option>
            </mat-select>
          </mat-form-field>
          <button mat-icon-button (click)="loadData()" matTooltip="Làm mới" class="refresh-btn">
            <mat-icon>refresh</mat-icon>
          </button>
        </div>
      </mat-card>

      <!-- Loading -->
      <mat-progress-bar *ngIf="isLoading" mode="indeterminate" color="primary"></mat-progress-bar>

      <!-- Table -->
      <mat-card class="table-card">
        <table mat-table [dataSource]="staffList" class="staff-table">

          <!-- Avatar + Name -->
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Nhân viên</th>
            <td mat-cell *matCellDef="let s">
              <div class="staff-cell">
                <div class="staff-avatar" [style.background]="getRoleColor(s.role)">
                  {{ (s.fullName || s.username).charAt(0).toUpperCase() }}
                </div>
                <div class="staff-info">
                  <span class="staff-name">{{ s.fullName || s.username }}</span>
                  <span class="staff-email">{{ s.email }}</span>
                </div>
              </div>
            </td>
          </ng-container>

          <!-- Username -->
          <ng-container matColumnDef="username">
            <th mat-header-cell *matHeaderCellDef>Username</th>
            <td mat-cell *matCellDef="let s">
              <span class="username-badge">{{ s.username }}</span>
            </td>
          </ng-container>

          <!-- Phone -->
          <ng-container matColumnDef="phone">
            <th mat-header-cell *matHeaderCellDef>Điện thoại</th>
            <td mat-cell *matCellDef="let s">{{ s.phone || '—' }}</td>
          </ng-container>

          <!-- Role -->
          <ng-container matColumnDef="role">
            <th mat-header-cell *matHeaderCellDef>Chức vụ</th>
            <td mat-cell *matCellDef="let s">
              <span class="role-badge" [ngClass]="'role-' + s.role.toLowerCase()">
                {{ getRoleLabel(s.role) }}
              </span>
            </td>
          </ng-container>

          <!-- Status -->
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Trạng thái</th>
            <td mat-cell *matCellDef="let s">
              <span class="status-dot" [class.active]="s.isActive">
                {{ s.isActive ? '✅ Hoạt động' : '🔒 Đã khóa' }}
              </span>
            </td>
          </ng-container>

          <!-- Created -->
          <ng-container matColumnDef="createdAt">
            <th mat-header-cell *matHeaderCellDef>Ngày tạo</th>
            <td mat-cell *matCellDef="let s">{{ formatDate(s.createdAt) }}</td>
          </ng-container>

          <!-- Actions -->
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef class="text-right">Thao tác</th>
            <td mat-cell *matCellDef="let s" class="text-right">
              <button mat-icon-button color="primary" (click)="openChangeRole(s)" matTooltip="Đổi chức vụ">
                <mat-icon>manage_accounts</mat-icon>
              </button>
              <button mat-icon-button color="warn" (click)="openResetPwd(s)" matTooltip="Đặt lại mật khẩu">
                <mat-icon>lock_reset</mat-icon>
              </button>
              <button mat-icon-button [color]="s.isActive ? 'warn' : 'primary'"
                      (click)="toggleActive(s)"
                      [matTooltip]="s.isActive ? 'Khóa tài khoản' : 'Kích hoạt'">
                <mat-icon>{{ s.isActive ? 'person_off' : 'person' }}</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr mat-row *matRowDef="let row; columns: cols;" class="table-row"></tr>
        </table>

        <div *ngIf="staffList.length === 0 && !isLoading" class="empty-state">
          <mat-icon>group_off</mat-icon>
          <p>Không tìm thấy tài khoản nhân viên nào.</p>
        </div>

        <mat-paginator [length]="totalCount" [pageSize]="pageSize"
                       [pageSizeOptions]="[10, 20, 50]"
                       (page)="onPage($event)" showFirstLastButtons>
        </mat-paginator>
      </mat-card>
    </div>
  `,
  styles: [`
    .staff-page { padding: 0; }
    .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
    .header-left { display: flex; align-items: center; gap: 14px; }
    .page-title { display: flex; align-items: center; gap: 10px; font-size: 1.5rem; font-weight: 700; color: #1e293b; margin: 0; }
    .page-title mat-icon { color: #6366f1; }
    .total-badge { background: rgba(99,102,241,0.1); color: #6366f1; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; border: 1px solid rgba(99,102,241,0.2); }
    .create-btn { background: linear-gradient(135deg, #6366f1, #8b5cf6) !important; color: white !important; border-radius: 8px !important; }
    .filter-card { background: #ffffff !important; border: 1px solid #e2e8f0 !important; border-radius: 12px !important; margin-bottom: 16px; padding: 16px 20px !important; box-shadow: 0 1px 4px rgba(0,0,0,0.06) !important; }
    .filter-row { display: flex; gap: 12px; align-items: flex-start; flex-wrap: wrap; }
    .search-field { flex: 1; min-width: 250px; }
    .refresh-btn { color: #64748b; margin-top: 8px; }
    .table-card { background: #ffffff !important; border: 1px solid #e2e8f0 !important; border-radius: 12px !important; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.06) !important; }
    .staff-table { width: 100%; background: transparent; }
    /* Mat table overrides */
    .mat-mdc-header-cell { background: #f8fafc !important; color: #64748b !important; font-size: 0.75rem !important; font-weight: 600 !important; text-transform: uppercase !important; letter-spacing: 0.05em !important; border-bottom: 1px solid #e2e8f0 !important; }
    .mat-mdc-cell { color: #1e293b !important; border-bottom: 1px solid #f1f5f9 !important; }
    .mat-mdc-row:hover { background: #f8fafc !important; }
    .mat-mdc-paginator { background: transparent !important; color: #64748b !important; }
    .staff-cell { display: flex; align-items: center; gap: 12px; }
    .staff-avatar { width: 38px; height: 38px; border-radius: 50%; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1rem; flex-shrink: 0; }
    .staff-info { display: flex; flex-direction: column; }
    .staff-name { font-weight: 600; color: #1e293b; font-size: 0.9rem; }
    .staff-email { font-size: 0.75rem; color: #64748b; }
    .username-badge { font-family: monospace; background: rgba(99,102,241,0.08); color: #6366f1; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; border: 1px solid rgba(99,102,241,0.15); }
    .role-badge { padding: 3px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; }
    .role-admin { background: rgba(239,68,68,0.1); color: #b91c1c; }
    .role-manager { background: rgba(245,158,11,0.1); color: #92400e; }
    .role-receptionist { background: rgba(59,130,246,0.1); color: #1d4ed8; }
    .role-housekeeping { background: rgba(16,185,129,0.1); color: #047857; }
    .status-dot { font-size: 0.8rem; }
    .text-right { text-align: right; }
    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 48px; gap: 12px; color: #94a3b8; }
    .empty-state mat-icon { font-size: 3rem; width: 3rem; height: 3rem; }
  `]
})
export class StaffListComponent implements OnInit {
  cols = ['name', 'username', 'phone', 'role', 'status', 'createdAt', 'actions'];
  staffList: any[] = [];
  isLoading = false;
  totalCount = 0;
  pageSize = 20;
  currentPage = 1;
  searchText = '';
  filterRole = '';
  private searchTimer: any;

  private readonly api = `${environment.apiUrl}/staff`;

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void { this.loadData(); }

  loadData(): void {
    this.isLoading = true;
    const params: any = { page: this.currentPage, pageSize: this.pageSize };
    if (this.searchText.trim()) params.search = this.searchText.trim();
    if (this.filterRole) params.role = this.filterRole;

    this.http.get<any>(this.api, { params }).subscribe({
      next: res => {
        this.staffList  = res.data.data ?? [];
        this.totalCount = res.data.totalCount ?? 0;
        this.isLoading  = false;
      },
      error: err => {
        this.isLoading = false;
        this.snackBar.open(err.error?.errors?.[0] ?? 'Không thể tải danh sách nhân viên.', 'Đóng', { duration: 3000 });
      }
    });
  }

  onSearch(): void {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => { this.currentPage = 1; this.loadData(); }, 400);
  }

  onPage(e: PageEvent): void {
    this.currentPage = e.pageIndex + 1;
    this.pageSize    = e.pageSize;
    this.loadData();
  }

  openChangeRole(staff: any): void {
    const ref = this.dialog.open(ChangeRoleDialogComponent, { data: { staff }, panelClass: 'dark-dialog' });
    ref.afterClosed().subscribe((newRole: string) => {
      if (!newRole || newRole === staff.role) return;
      this.http.put<any>(`${this.api}/${staff.userId}/role`, { role: newRole }).subscribe({
        next: () => {
          this.snackBar.open(`✅ Đã đổi chức vụ ${staff.username} → ${newRole}`, 'OK', { duration: 3000, panelClass: 'snack-success' });
          this.loadData();
        },
        error: err => this.snackBar.open(err.error?.errors?.[0] ?? 'Cập nhật thất bại', 'Đóng', { duration: 3500 })
      });
    });
  }

  openResetPwd(staff: any): void {
    const ref = this.dialog.open(ResetPwdDialogComponent, { data: { staff }, panelClass: 'dark-dialog' });
    ref.afterClosed().subscribe((newPwd: string) => {
      if (!newPwd) return;
      this.http.put<any>(`${this.api}/${staff.userId}/password`, { newPassword: newPwd }).subscribe({
        next: () => this.snackBar.open(`🔑 Mật khẩu của ${staff.username} đã được đặt lại.`, 'OK', { duration: 3000, panelClass: 'snack-success' }),
        error: err => this.snackBar.open(err.error?.errors?.[0] ?? 'Đặt lại thất bại', 'Đóng', { duration: 3500 })
      });
    });
  }

  toggleActive(staff: any): void {
    const msg = staff.isActive ? `Khóa tài khoản ${staff.username}?` : `Kích hoạt lại ${staff.username}?`;
    if (!confirm(msg)) return;
    this.http.put<any>(`${this.api}/${staff.userId}/toggle-active`, {}).subscribe({
      next: () => { this.snackBar.open('✅ Đã cập nhật trạng thái.', 'OK', { duration: 2500 }); this.loadData(); },
      error: err => this.snackBar.open(err.error?.errors?.[0] ?? 'Thao tác thất bại', 'Đóng', { duration: 3500 })
    });
  }

  getRoleLabel(role: string): string {
    const map: Record<string, string> = {
      Admin: 'Admin', Manager: 'Quản lý', Receptionist: 'Lễ tân', Housekeeping: 'Dọn phòng'
    };
    return map[role] ?? role;
  }

  getRoleColor(role: string): string {
    const map: Record<string, string> = {
      Admin: 'linear-gradient(135deg,#ef4444,#b91c1c)',
      Manager: 'linear-gradient(135deg,#f59e0b,#d97706)',
      Receptionist: 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
      Housekeeping: 'linear-gradient(135deg,#10b981,#059669)'
    };
    return map[role] ?? 'linear-gradient(135deg,#6366f1,#4f46e5)';
  }

  formatDate(d: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
}
