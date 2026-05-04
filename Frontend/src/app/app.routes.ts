import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { AdminLayoutComponent } from './core/layout/admin-layout/admin-layout.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

// Lazy loading features
export const routes: Routes = [
  // Public Route
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'home',
    loadComponent: () => import('./features/guest/home/guest-home.component').then(m => m.GuestHomeComponent),
    canActivate: [roleGuard],
    data: { roles: ['Guest'] }
  },
  {
    path: 'guest/rooms',
    loadComponent: () => import('./features/guest/room-listing/room-listing.component').then(m => m.RoomListingComponent),
    canActivate: [roleGuard],
    data: { roles: ['Guest'] }
  },
  {
    path: 'guest/search',
    loadComponent: () => import('./features/guest/search/guest-search.component').then(m => m.GuestSearchComponent),
    canActivate: [roleGuard],
    data: { roles: ['Guest'] }
  },
  {
    path: 'guest/hotels',
    loadComponent: () => import('./features/guest/hotel-listing/hotel-listing.component').then(m => m.HotelListingComponent),
    canActivate: [roleGuard],
    data: { roles: ['Guest'] }
  },
  {
    path: 'guest/booking',
    loadComponent: () => import('./features/guest/booking/guest-booking.component').then(m => m.GuestBookingComponent),
    canActivate: [roleGuard],
    data: { roles: ['Guest'] }
  },
  {
    path: 'guest/payment',
    loadComponent: () => import('./features/guest/payment/guest-payment.component').then(m => m.GuestPaymentComponent),
    canActivate: [roleGuard],
    data: { roles: ['Guest'] }
  },
  {
    path: 'guest/my-bookings',
    loadComponent: () => import('./features/guest/my-bookings/my-bookings.component').then(m => m.MyBookingsComponent),
    canActivate: [roleGuard],
    data: { roles: ['Guest'] }
  },
  {
    path: 'guest/booking-detail',
    loadComponent: () => import('./features/guest/guest-booking-detail/guest-booking-detail.component').then(m => m.GuestBookingDetailComponent),
    canActivate: [roleGuard],
    data: { roles: ['Guest'] }
  },
  {
    path: 'guest/profile',
    loadComponent: () => import('./features/guest/guest-profile-view/guest-profile-view.component').then(m => m.GuestProfileViewComponent),
    canActivate: [roleGuard],
    data: { roles: ['Guest'] }
  },
  {
    path: 'guest/profile/edit',
    loadComponent: () => import('./features/guest/guest-profile-edit/guest-profile-edit.component').then(m => m.GuestProfileEditComponent),
    canActivate: [roleGuard],
    data: { roles: ['Guest'] }
  },
  // Protected Routes Wrapper
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
        data: { roles: ['Manager', 'Admin'] },
        canActivate: [roleGuard]
      },
      {
        path: 'rooms',
        loadComponent: () => import('./features/rooms/room-list/room-list.component').then(m => m.RoomListComponent)
      },
      {
        path: 'bookings',
        loadComponent: () => import('./features/bookings/booking-list/booking-list.component').then(m => m.BookingListComponent)
      },
      {
        path: 'bookings/new',
        loadComponent: () => import('./features/bookings/create-booking/create-booking.component').then(m => m.CreateBookingComponent)
      },
      {
        path: 'rate-plans',
        loadComponent: () => import('./features/categories/rate-plans/rate-plan-list.component').then(m => m.RatePlanListComponent),
        data: { roles: ['Manager', 'Admin'] },
        canActivate: [roleGuard]
      },
      {
        path: 'promotions',
        loadComponent: () => import('./features/categories/promotions/promotion-list.component').then(m => m.PromotionListComponent),
        data: { roles: ['Manager', 'Admin'] },
        canActivate: [roleGuard]
      },
      {
        path: 'payments',
        loadComponent: () => import('./features/payments/payment-list/payment-list.component').then(m => m.PaymentListComponent),
        data: { roles: ['Admin', 'Manager', 'Receptionist'] },
        canActivate: [roleGuard]
      },
      {
        path: 'housekeeping',
        loadComponent: () => import('./features/housekeeping/housekeeping-board.component').then(m => m.HousekeepingBoardComponent),
        data: { roles: ['Admin', 'Manager', 'Housekeeping'] },
        canActivate: [roleGuard]
      },
      {
        path: 'invoices',
        loadComponent: () => import('./features/invoices/invoice-list.component').then(m => m.InvoiceListComponent),
        data: { roles: ['Admin', 'Manager'] },
        canActivate: [roleGuard]
      },
      {
        path: 'guests',
        loadComponent: () => import('./features/guests/guest-list.component').then(m => m.GuestListComponent),
        data: { roles: ['Admin', 'Manager', 'Receptionist'] },
        canActivate: [roleGuard]
      },
      {
        path: 'hotels',
        loadComponent: () => import('./features/admin/hotel-management/hotel-management.component').then(m => m.HotelManagementComponent),
        data: { roles: ['Admin', 'Manager'] },
        canActivate: [roleGuard]
      },
      {
        path: 'room-types',
        loadComponent: () => import('./features/admin/room-type-management/room-type-management.component').then(m => m.RoomTypeManagementComponent),
        data: { roles: ['Admin', 'Manager'] },
        canActivate: [roleGuard]
      },
      {
        path: 'staff',
        loadComponent: () => import('./features/staff/staff-list.component').then(m => m.StaffListComponent),
        data: { roles: ['Admin'] },
        canActivate: [roleGuard]
      },
      {
        path: 'staff/create',
        loadComponent: () => import('./features/staff/create-staff.component').then(m => m.CreateStaffComponent),
        data: { roles: ['Admin'] },
        canActivate: [roleGuard]
      }
    ]
  },
  // Fallback
  {
    path: '**',
    redirectTo: ''
  }
];
