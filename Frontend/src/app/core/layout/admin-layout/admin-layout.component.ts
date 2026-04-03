import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { AuthService } from '../../services/auth.service';
import { SignalRService } from '../../services/signalr.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatBadgeModule
  ],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss'
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  userName = 'User';
  userRole = '';
  
  notificationCount = 0;
  isRinging = false;
  
  private statusSub?: Subscription;
  private taskSub?: Subscription;

  menuItems = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard', roles: ['Manager', 'Admin'] },
    { label: 'Room List', icon: 'meeting_room', route: '/rooms', roles: ['Admin', 'Manager', 'Receptionist', 'Housekeeping'] },
    { label: 'Bookings', icon: 'book_online', route: '/bookings', roles: ['Admin', 'Manager', 'Receptionist'] },
    { label: 'Invoices', icon: 'receipt_long', route: '/invoices', roles: ['Admin', 'Manager', 'Receptionist'] },
    { label: 'Guests', icon: 'group', route: '/guests', roles: ['Admin', 'Manager', 'Receptionist'] },
    { label: 'Rate Plans', icon: 'price_change', route: '/rate-plans', roles: ['Admin', 'Manager'] },
    { label: 'Promotions', icon: 'local_offer', route: '/promotions', roles: ['Admin', 'Manager'] }
  ];

  filteredMenu: any[] = [];

  constructor(
    private authService: AuthService,
    private signalRService: SignalRService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.userName = user?.fullName || 'User';
    this.userRole = user?.role || '';

    // Lọc menu theo role
    this.filteredMenu = this.menuItems.filter(item => item.roles.includes(this.userRole));

    // Bật SignalR
    this.signalRService.startConnection();

    // Lắng nghe sự kiện phòng (đặc biệt hữu ích cho Receptionist, Housekeeping)
    this.statusSub = this.signalRService.roomStatusChanged$.subscribe((payload: any) => {
      if (payload) {
        this.triggerBell();
      }
    });

    // Lắng nghe task mới (Housekeeping)
    this.taskSub = this.signalRService.newHousekeepingTask$.subscribe((payload: any) => {
      if (payload) {
        this.triggerBell();
      }
    });
  }

  triggerBell() {
    this.notificationCount++;
    this.isRinging = true;
    setTimeout(() => {
      this.isRinging = false;
    }, 1000); // Rung chuông 1 giây rồi dừng
  }

  clearNotifications() {
    this.notificationCount = 0;
  }

  logout() {
    this.authService.logout();
    this.signalRService.stopConnection();
    this.router.navigate(['/login']);
  }

  ngOnDestroy(): void {
    this.statusSub?.unsubscribe();
    this.taskSub?.unsubscribe();
  }
}
