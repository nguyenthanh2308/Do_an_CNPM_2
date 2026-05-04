import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, firstValueFrom, of, tap } from 'rxjs';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../environments/environment';
import { ApiResponse, LoginRequest, LoginResponse, UserInfo } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API = `${environment.apiUrl}/auth`;
  private readonly SESSION_RUNTIME_ID_KEY = 'sessionRuntimeId';
  private readonly SESSION_STARTED_AT_KEY = 'sessionStartedAt';
  private readonly SESSION_TIMEOUT_MS = (environment.sessionTimeoutMinutes ?? 10) * 60 * 1000;
  private readonly SESSION_WARNING_BEFORE_MS = 2 * 60 * 1000; // Cảnh báo trước 2 phút
  private readonly SESSION_STORAGE_KEYS = [
    'accessToken',
    'refreshToken',
    'user',
    'sessionRuntimeId',
    'sessionStartedAt'
  ];
  private currentUserSubject = new BehaviorSubject<UserInfo | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();
  private autoLogoutTimer: ReturnType<typeof setTimeout> | null = null;
  private warningTimer: ReturnType<typeof setTimeout> | null = null;
  private initialized = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.initializeSession();
  }

  async initializeSession(): Promise<void> {
    if (this.initialized) {
      return;
    }

    this.initialized = true;

    const stored = sessionStorage.getItem('user');
    if (stored) {
      this.currentUserSubject.next(JSON.parse(stored));
    }

    this.enforceSessionTimeoutOnStartup();
    if (!this.getAccessToken()) {
      return;
    }

    await this.validateTokenWithBackend();
    if (!this.getAccessToken()) {
      return;
    }

    await this.enforceBackendRestartOnStartup();
    if (!this.getAccessToken()) {
      return;
    }

    this.scheduleAutoLogout();
  }

  login(dto: LoginRequest): Observable<ApiResponse<LoginResponse>> {
    return this.http.post<ApiResponse<LoginResponse>>(`${this.API}/login`, dto).pipe(
      tap(res => {
        if (res.success) {
          sessionStorage.setItem('accessToken', res.data.accessToken);
          sessionStorage.setItem('refreshToken', res.data.refreshToken);
          sessionStorage.setItem('user', JSON.stringify(res.data.user));
          sessionStorage.setItem(this.SESSION_STARTED_AT_KEY, Date.now().toString());
          this.currentUserSubject.next(res.data.user);
          void this.syncCurrentRuntimeId();
          this.scheduleAutoLogout();
        }
      })
    );
  }

  register(dto: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.API}/register`, dto);
  }

  logout(): void {
    const rt = sessionStorage.getItem('refreshToken');
    if (rt) this.http.post(`${this.API}/logout`, { refreshToken: rt }).subscribe();
    this.clearLocalSession();
  }

  refreshToken(): Observable<ApiResponse<LoginResponse>> {
    const refreshToken = sessionStorage.getItem('refreshToken') ?? '';
    return this.http.post<ApiResponse<LoginResponse>>(`${this.API}/refresh`, { refreshToken }).pipe(
      tap(res => {
        if (res.success) {
          sessionStorage.setItem('accessToken', res.data.accessToken);
          sessionStorage.setItem('refreshToken', res.data.refreshToken);
          if (res.data.user) {
            sessionStorage.setItem('user', JSON.stringify(res.data.user));
            this.currentUserSubject.next(res.data.user);
          }
        }
      })
    );
  }

  getAccessToken(): string | null   { return sessionStorage.getItem('accessToken'); }
  getCurrentUser(): UserInfo | null  { return this.currentUserSubject.value; }
  isLoggedIn(): boolean              { return !!this.getAccessToken(); }
  hasRole(role: string): boolean     { return this.getCurrentUser()?.role === role; }
  isManagerOrAbove(): boolean        { return ['Admin', 'Manager'].includes(this.getCurrentUser()?.role ?? ''); }

  private enforceSessionTimeoutOnStartup(): void {
    if (!this.getAccessToken()) {
      return;
    }

    const startedAtRaw = sessionStorage.getItem(this.SESSION_STARTED_AT_KEY);
    if (!startedAtRaw) {
      sessionStorage.setItem(this.SESSION_STARTED_AT_KEY, Date.now().toString());
      return;
    }

    const startedAt = Number(startedAtRaw);
    if (Number.isNaN(startedAt) || Date.now() - startedAt >= this.SESSION_TIMEOUT_MS) {
      this.clearLocalSession('Phiên làm việc đã quá 10 phút, vui lòng đăng nhập lại để tiếp tục.');
    }
  }

  private scheduleAutoLogout(): void {
    // Hủy tất cả timer cũ
    if (this.autoLogoutTimer) {
      clearTimeout(this.autoLogoutTimer);
      this.autoLogoutTimer = null;
    }
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }

    if (!this.getAccessToken()) {
      return;
    }

    const startedAt = Number(sessionStorage.getItem(this.SESSION_STARTED_AT_KEY) ?? Date.now());
    const remainingMs = this.SESSION_TIMEOUT_MS - (Date.now() - startedAt);

    if (remainingMs <= 0) {
      this.clearLocalSession('Phiên làm việc đã quá 10 phút, vui lòng đăng nhập lại để tiếp tục.');
      return;
    }

    // Lên lịch cảnh báo trước 2 phút
    const warningIn = remainingMs - this.SESSION_WARNING_BEFORE_MS;
    if (warningIn > 0) {
      this.warningTimer = setTimeout(() => {
        this.showSessionWarning();
      }, warningIn);
    } else {
      // Còn dưới 2 phút → hiển thị cảnh báo ngay
      this.showSessionWarning();
    }

    // Lên lịch tự động đăng xuất
    this.autoLogoutTimer = setTimeout(() => {
      this.clearLocalSession('Phiên làm việc đã quá 10 phút, vui lòng đăng nhập lại để tiếp tục.');
    }, remainingMs);
  }

  /** Hiển thị snackbar cảnh báo phiên sắp hết — người dùng có thể chọn Gia hạn */
  private showSessionWarning(): void {
    const snackRef = this.snackBar.open(
      '⚠️ Phiên làm việc còn khoảng 2 phút!',
      'Gia hạn',
      {
        duration: this.SESSION_WARNING_BEFORE_MS,
        panelClass: ['session-warning-snack'],
        horizontalPosition: 'center',
        verticalPosition: 'top'
      }
    );

    snackRef.onAction().subscribe(() => {
      this.renewSession();
    });
  }

  /** Gọi refresh token để gia hạn phiên, reset lại timer */
  renewSession(): void {
    this.refreshToken().subscribe({
      next: (res) => {
        if (res.success) {
          // Reset thời gian bắt đầu phiên
          sessionStorage.setItem(this.SESSION_STARTED_AT_KEY, Date.now().toString());
          this.scheduleAutoLogout();
          this.snackBar.open('✅ Phiên làm việc đã được gia hạn thêm 10 phút.', '', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });
        } else {
          this.clearLocalSession('Không thể gia hạn phiên, vui lòng đăng nhập lại.');
        }
      },
      error: () => {
        this.clearLocalSession('Không thể gia hạn phiên, vui lòng đăng nhập lại.');
      }
    });
  }

  private async enforceBackendRestartOnStartup(): Promise<void> {
    const runtimeId = await this.getCurrentRuntimeId();
    if (!runtimeId) {
      return;
    }

    const storedRuntimeId = sessionStorage.getItem(this.SESSION_RUNTIME_ID_KEY);
    if (!storedRuntimeId) {
      sessionStorage.setItem(this.SESSION_RUNTIME_ID_KEY, runtimeId);
      return;
    }

    if (storedRuntimeId !== runtimeId) {
      this.clearLocalSession('Phiên đã kết thúc do hệ thống được khởi động lại (build/deploy), vui lòng đăng nhập lại.');
    }
  }

  /** F5 không đăng xuất: lỗi mạng / backend tạm lỗi giữ phiên; 401 thử refresh; chỉ xóa khi token thật sự hết hiệu lực. */
  private async validateTokenWithBackend(): Promise<void> {
    try {
      const response = await firstValueFrom(this.http.get<ApiResponse<unknown>>(`${this.API}/me`));
      if (!response?.success) {
        this.clearLocalSession('Token không hợp lệ, vui lòng đăng nhập lại');
      }
    } catch (err: unknown) {
      const status = (err as HttpErrorResponse)?.status;

      if (status === 0) {
        return;
      }

      if (status === 401) {
        const ok = await this.tryRefreshThenValidateMe();
        if (!ok) {
          this.clearLocalSession('Phiên làm việc hết hạn, vui lòng đăng nhập lại.');
        }
        return;
      }

      return;
    }
  }

  private async tryRefreshThenValidateMe(): Promise<boolean> {
    const rt = sessionStorage.getItem('refreshToken');
    if (!rt) {
      return false;
    }

    try {
      const refreshed = await firstValueFrom(this.refreshToken().pipe(catchError(() => of(null))));
      if (!refreshed?.success) {
        return false;
      }

      const me2 = await firstValueFrom(
        this.http.get<ApiResponse<unknown>>(`${this.API}/me`).pipe(catchError(() => of(null)))
      );
      return !!(me2 && me2.success);
    } catch {
      return false;
    }
  }

  private async syncCurrentRuntimeId(): Promise<void> {
    const runtimeId = await this.getCurrentRuntimeId();
    if (runtimeId) {
      sessionStorage.setItem(this.SESSION_RUNTIME_ID_KEY, runtimeId);
    }
  }

  private async getCurrentRuntimeId(): Promise<string | null> {
    const response = await firstValueFrom(
      this.http
        .get<{ runtimeId: string }>(`${environment.apiUrl}/session/runtime-id`)
        .pipe(catchError(() => of(null)))
    );

    return response?.runtimeId ?? null;
  }

  private clearLocalSession(message?: string): void {
    if (this.autoLogoutTimer) {
      clearTimeout(this.autoLogoutTimer);
      this.autoLogoutTimer = null;
    }
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }

    for (const key of this.SESSION_STORAGE_KEYS) {
      sessionStorage.removeItem(key);
    }

    this.currentUserSubject.next(null);
    this.router.navigate(['/login'], {
      queryParams: message ? { message } : undefined
    });
  }
}
