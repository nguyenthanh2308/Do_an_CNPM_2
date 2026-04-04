import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, firstValueFrom, of, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { ApiResponse, LoginRequest, LoginResponse, UserInfo } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API = `${environment.apiUrl}/auth`;
  private readonly SESSION_RUNTIME_ID_KEY = 'sessionRuntimeId';
  private readonly SESSION_STARTED_AT_KEY = 'sessionStartedAt';
  private readonly SESSION_TIMEOUT_MS = (environment.sessionTimeoutMinutes ?? 30) * 60 * 1000;
  private currentUserSubject = new BehaviorSubject<UserInfo | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();
  private autoLogoutTimer: ReturnType<typeof setTimeout> | null = null;
  private initialized = false;

  constructor(private http: HttpClient, private router: Router) {
    this.initializeSession();
  }

  async initializeSession(): Promise<void> {
    if (this.initialized) {
      return;
    }

    this.initialized = true;

    // Restore user from localStorage on startup
    const stored = localStorage.getItem('user');
    if (stored) {
      this.currentUserSubject.next(JSON.parse(stored));
    }

    this.enforceSessionTimeoutOnStartup();
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
          localStorage.setItem('accessToken', res.data.accessToken);
          localStorage.setItem('refreshToken', res.data.refreshToken);
          localStorage.setItem('user', JSON.stringify(res.data.user));
          localStorage.setItem(this.SESSION_STARTED_AT_KEY, Date.now().toString());
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
    const rt = localStorage.getItem('refreshToken');
    if (rt) this.http.post(`${this.API}/logout`, { refreshToken: rt }).subscribe();
    this.clearLocalSession();
  }

  refreshToken(): Observable<ApiResponse<LoginResponse>> {
    const refreshToken = localStorage.getItem('refreshToken') ?? '';
    return this.http.post<ApiResponse<LoginResponse>>(`${this.API}/refresh`, { refreshToken }).pipe(
      tap(res => {
        if (res.success) {
          localStorage.setItem('accessToken', res.data.accessToken);
          localStorage.setItem('refreshToken', res.data.refreshToken);
        }
      })
    );
  }

  getAccessToken(): string | null   { return localStorage.getItem('accessToken'); }
  getCurrentUser(): UserInfo | null  { return this.currentUserSubject.value; }
  isLoggedIn(): boolean              { return !!this.getAccessToken(); }
  hasRole(role: string): boolean     { return this.getCurrentUser()?.role === role; }
  isManagerOrAbove(): boolean        { return ['Admin', 'Manager'].includes(this.getCurrentUser()?.role ?? ''); }

  private enforceSessionTimeoutOnStartup(): void {
    if (!this.getAccessToken()) {
      return;
    }

    const startedAtRaw = localStorage.getItem(this.SESSION_STARTED_AT_KEY);
    if (!startedAtRaw) {
      // Backward compatibility for old sessions created before timeout key existed.
      localStorage.setItem(this.SESSION_STARTED_AT_KEY, Date.now().toString());
      return;
    }

    const startedAt = Number(startedAtRaw);
    if (Number.isNaN(startedAt) || Date.now() - startedAt >= this.SESSION_TIMEOUT_MS) {
      this.clearLocalSession('Phiên làm việc kết thúc, vui lòng đăng nhập lại');
    }
  }

  private scheduleAutoLogout(): void {
    if (this.autoLogoutTimer) {
      clearTimeout(this.autoLogoutTimer);
      this.autoLogoutTimer = null;
    }

    if (!this.getAccessToken()) {
      return;
    }

    const startedAt = Number(localStorage.getItem(this.SESSION_STARTED_AT_KEY) ?? Date.now());
    const remainingMs = this.SESSION_TIMEOUT_MS - (Date.now() - startedAt);

    if (remainingMs <= 0) {
      this.clearLocalSession('Phiên làm việc kết thúc, vui lòng đăng nhập lại');
      return;
    }

    this.autoLogoutTimer = setTimeout(() => {
      this.clearLocalSession('Phiên làm việc kết thúc, vui lòng đăng nhập lại');
    }, remainingMs);
  }

  private async enforceBackendRestartOnStartup(): Promise<void> {
    const runtimeId = await this.getCurrentRuntimeId();
    if (!runtimeId) {
      return;
    }

    const storedRuntimeId = localStorage.getItem(this.SESSION_RUNTIME_ID_KEY);
    if (!storedRuntimeId) {
      localStorage.setItem(this.SESSION_RUNTIME_ID_KEY, runtimeId);
      return;
    }

    if (storedRuntimeId !== runtimeId) {
      this.clearLocalSession('Phiên đã kết thúc do hệ thống được khởi động lại, vui lòng đăng nhập lại');
    }
  }

  private async syncCurrentRuntimeId(): Promise<void> {
    const runtimeId = await this.getCurrentRuntimeId();
    if (runtimeId) {
      localStorage.setItem(this.SESSION_RUNTIME_ID_KEY, runtimeId);
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

    localStorage.clear();
    this.currentUserSubject.next(null);
    this.router.navigate(['/login'], {
      queryParams: message ? { message } : undefined
    });
  }
}
