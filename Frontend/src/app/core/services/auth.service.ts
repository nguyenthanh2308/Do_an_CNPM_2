import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { ApiResponse, LoginRequest, LoginResponse, UserInfo } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<UserInfo | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    // Restore user from localStorage on startup
    const stored = localStorage.getItem('user');
    if (stored) this.currentUserSubject.next(JSON.parse(stored));
  }

  login(dto: LoginRequest): Observable<ApiResponse<LoginResponse>> {
    return this.http.post<ApiResponse<LoginResponse>>(`${this.API}/login`, dto).pipe(
      tap(res => {
        if (res.success) {
          localStorage.setItem('accessToken', res.data.accessToken);
          localStorage.setItem('refreshToken', res.data.refreshToken);
          localStorage.setItem('user', JSON.stringify(res.data.user));
          this.currentUserSubject.next(res.data.user);
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
    localStorage.clear();
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
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
}
