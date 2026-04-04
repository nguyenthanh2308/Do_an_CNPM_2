// ── Auth DTOs ─────────────────────────────────────────────────────────────
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: UserInfo;
}

export interface UserInfo {
  userId: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
}

// ── Common ────────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  errors: string[];
}

export interface PagedResult<T> {
  data: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// ── Room Models ───────────────────────────────────────────────────────────
export type RoomStatus = 'Available' | 'Occupied' | 'Dirty' | 'Maintenance' | 'OutOfService';

export interface RoomDto {
  roomId: number;
  hotelId: number;
  hotelName: string;
  roomTypeId: number;
  roomTypeName: string;
  roomNumber: string;
  floor: number;
  status: RoomStatus;
  notes?: string;
  isActive: boolean;
  roomTypeDetails?: RoomTypeSummaryDto;
}

export interface RoomSummaryDto {
  roomId: number;
  roomNumber: string;
  floor: number;
  status: RoomStatus;
  roomTypeName: string;
  basePrice: number;
}

export interface AvailableRoomDto {
  roomId: number;
  roomNumber: string;
  floor: number;
  roomTypeId: number;
  roomTypeName: string;
  thumbnailUrl?: string;
  maxOccupancy: number;
  areaSqm?: number;
  pricePerNight: number;
}

export interface RoomTypeSummaryDto {
  roomTypeId: number;
  name: string;
  basePrice: number;
  maxOccupancy: number;
  thumbnailUrl?: string;
  areaSqm?: number;
}

export interface AmenityDto {
  amenityId: number;
  name: string;
  icon?: string;
  description?: string;
}

export interface SearchAvailableRoomsDto {
  checkIn: string;
  checkOut: string;
  guests?: number;
  roomTypeId?: number;
  maxPrice?: number;
}

export interface UpdateRoomStatusDto {
  status: RoomStatus;
  notes?: string;
}

export interface CreateRoomDto {
  hotelId: number;
  roomTypeId: number;
  roomNumber: string;
  floor: number;
  notes?: string;
}

// ── Booking Models ────────────────────────────────────────────────────────
export type BookingStatus = 'Pending' | 'Confirmed' | 'CheckedIn' | 'Completed' | 'Cancelled';

export interface BookingDto {
  bookingId: number;
  guestId: number;
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  ratePlanId: number;
  ratePlanName: string;
  roomTypeName: string;
  promotionId?: number;
  promotionCode?: string;
  checkInDate: string;
  checkOutDate: string;
  actualCheckIn?: string;
  actualCheckOut?: string;
  numGuests: number;
  nightCount: number;
  status: BookingStatus;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  bookingSource: string;
  specialRequests?: string;
  notes?: string;
  createdAt: string;
  createdByUserName?: string;
  rooms: BookingRoomDto[];
}

export interface BookingSummaryDto {
  bookingId: number;
  guestName: string;
  guestPhone?: string;
  roomTypeName: string;
  roomNumbers: string;
  checkInDate: string;
  checkOutDate: string;
  status: BookingStatus;
  finalAmount: number;
  createdAt: string;
}

export interface BookingRoomDto {
  bookingRoomId: number;
  roomId: number;
  roomNumber: string;
  floor: number;
  roomTypeName: string;
  pricePerNight: number;
}

export interface CreateBookingDto {
  guestId: number;
  ratePlanId: number;
  promotionId?: number;
  checkInDate: string;
  checkOutDate: string;
  numGuests: number;
  bookingSource: string;
  specialRequests?: string;
  roomIds: number[];
}

export interface CheckInDto {
  bookingId: number;
  notes?: string;
}

export interface CheckOutDto {
  bookingId: number;
  notes?: string;
  surcharges: number;
  taxAmount: number;
  paymentMethod: string;
  amountPaid: number;
}

export interface CancelBookingDto {
  bookingId: number;
  reason?: string;
}

export interface BookingFilterDto {
  guestName?: string;
  status?: string;
  checkInFrom?: string;
  checkInTo?: string;
  page: number;
  pageSize: number;
}

export interface ValidateVoucherRequest {
  code: string;
  bookingAmount: number;
}

export interface ValidateVoucherResponse {
  isValid: boolean;
  message?: string;
  promotionId?: number;
  discountAmount: number;
  finalAmount: number;
}

// ── Payment Models ────────────────────────────────────────────────────────
export interface PaymentDto {
  paymentId: number;
  invoiceId: number;
  invoiceNumber: string;
  guestName: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  transactionId?: string;
  status: string;
  notes?: string;
  createdAt: string;
}

export interface CreatePaymentDto {
  invoiceId: number;
  amount: number;
  paymentMethod: string;
  transactionId?: string;
  notes?: string;
}

export interface UpdatePaymentStatusDto {
  status: string;
  transactionId?: string;
  notes?: string;
}

// ── Housekeeping Models ───────────────────────────────────────────────────
export type TaskStatus = 'Pending' | 'InProgress' | 'Completed' | 'Cancelled';
export type TaskType = 'Cleaning' | 'Maintenance' | 'Inspection';
export type TaskPriority = 'Low' | 'Medium' | 'High';

export interface HousekeepingTaskDto {
  taskId: number;
  roomId: number;
  roomNumber: string;
  floor: number;
  roomTypeName: string;
  currentRoomStatus: string;
  assignedToUserId?: number;
  assignedToUserName?: string;
  createdByUserId: number;
  createdByUserName: string;
  taskType: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  notes?: string;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

// ── Report Models ─────────────────────────────────────────────────────────
export interface DashboardDto {
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  dirtyRooms: number;
  maintenanceRooms: number;
  checkInsToday: number;
  checkOutsToday: number;
  totalBookingsToday: number;
  pendingHousekeepingTasks: number;
  occupancyRate: number;
}
