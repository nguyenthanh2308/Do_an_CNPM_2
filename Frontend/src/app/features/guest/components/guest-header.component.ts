import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-guest-header',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, MatMenuModule],
  template: `
    <div class="guest-header-wrap">
      <header class="guest-header">
        <a class="brand" [routerLink]="['/home']">
          <mat-icon>apartment</mat-icon>
          <span>Hotel Management</span>
        </a>

        <nav class="main-nav">
          <a mat-button [routerLink]="['/home']" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Trang chủ</a>
          <a mat-button [routerLink]="['/guest/search']" routerLinkActive="active">Tìm kiếm</a>
          <a mat-button [routerLink]="['/guest/rooms']" routerLinkActive="active">Phòng</a>
          <a mat-button [routerLink]="['/guest/hotels']" routerLinkActive="active">Khách sạn</a>
        </nav>

        <div class="top-actions">
          <button mat-stroked-button class="profile-trigger" [matMenuTriggerFor]="accountMenu">
            <mat-icon>expand_more</mat-icon>
            <span>Xin chào, {{ fullName }}</span>
          </button>

          <mat-menu #accountMenu="matMenu" xPosition="before">
            <button mat-menu-item [routerLink]="['/guest/profile']">
              <mat-icon>person</mat-icon>
              <span>Hồ sơ</span>
            </button>
            <button mat-menu-item [routerLink]="['/guest/my-bookings']">
              <mat-icon>history</mat-icon>
              <span>Lịch sử đặt phòng</span>
            </button>
            <button mat-menu-item (click)="signOut()">
              <mat-icon>logout</mat-icon>
              <span>Đăng xuất</span>
            </button>
          </mat-menu>
        </div>
      </header>
      <div class="guest-header-spacer"></div>
    </div>
  `,
  styles: [`
    .guest-header {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 30;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 14px 28px;
      backdrop-filter: blur(14px);
      background: rgba(255, 255, 255, 0.9);
      border-bottom: 1px solid rgba(59, 130, 246, 0.12);
    }

    .guest-header-spacer {
      height: 76px;
    }

    .brand {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      color: #1e293b;
      font-size: 1.25rem;
      font-weight: 700;
      letter-spacing: 0.3px;
    }

    .brand mat-icon {
      color: #06b6d4;
    }

    .main-nav {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .main-nav a {
      color: #1f2f4a !important;
      font-weight: 600;
      border-radius: 999px;
      padding: 6px 16px;
    }

    .main-nav a.active,
    .main-nav a:hover {
      background: rgba(14, 165, 166, 0.13);
    }

    .profile-trigger {
      color: #1f2f4a !important;
      border-color: rgba(59, 130, 246, 0.35) !important;
      border-radius: 12px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    @media (max-width: 760px) {
      .guest-header {
        flex-wrap: wrap;
        padding: 10px 16px;
      }

      .guest-header-spacer {
        height: 120px;
      }

      .main-nav {
        width: 100%;
        justify-content: center;
        order: 3;
      }
    }
  `]
})
export class GuestHeaderComponent {
  fullName = this.authService.getCurrentUser()?.fullName || 'Khách';

  constructor(private readonly authService: AuthService) {}

  signOut(): void {
    this.authService.logout();
  }
}
