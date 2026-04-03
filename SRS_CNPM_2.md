# ĐẶC TẢ ĐỒ ÁN CÔNG NGHỆ PHẦN MỀM 2

**ĐỀ TÀI:** ỨNG DỤNG QUẢN LÝ VÀ BÁN PHÒNG KHÁCH SẠN

## 1. Tổng quan kiến trúc hệ thống mới

Trong Đồ án 1, hệ thống quản lý và bán phòng khách sạn được xây dựng theo mô hình **ASP.NET Core MVC (Monolithic Architecture)**, trong đó giao diện người dùng (View), xử lý nghiệp vụ (Controller) và truy cập dữ liệu (Model) được triển khai trong cùng một ứng dụng. Mô hình này phù hợp với các ứng dụng quy mô nhỏ, tuy nhiên có một số hạn chế như:

- Giao diện phụ thuộc chặt chẽ vào Backend.
- Khó mở rộng sang các nền tảng khác (mobile app, SPA).
- Khả năng mở rộng hệ thống và tích hợp dịch vụ mới còn hạn chế.

Theo tài liệu đặc tả hệ thống trước đó, hệ thống bao gồm các nghiệp vụ chính như **tìm phòng, đặt phòng, check-in/check-out, quản lý buồng phòng và báo cáo doanh thu**.

Trong Đồ án 2, hệ thống được chuyển đổi sang mô hình **Frontend–Backend tách biệt (Decoupled Architecture)** nhằm tăng khả năng mở rộng và phù hợp với xu hướng phát triển ứng dụng web hiện đại.

Kiến trúc mới được xây dựng dựa trên hai thành phần chính:

- **Frontend**: Angular (Single Page Application – SPA)
- **Backend**: ASP.NET Core Web API (RESTful API)

Ngoài ra hệ thống còn tích hợp:

- **JWT (JSON Web Token)** cho xác thực và phân quyền
- **SignalR** cho các chức năng cập nhật dữ liệu thời gian thực

Mô hình kiến trúc này cho phép Frontend và Backend hoạt động độc lập, giao tiếp với nhau thông qua các API REST.

## 2. Kiến trúc tổng thể hệ thống

### 2.1. Các thành phần chính

#### 2.1.1. Frontend (Angular)

Frontend được xây dựng dưới dạng **Single Page Application (SPA)** sử dụng framework Angular. Giao diện người dùng được chia theo các vai trò:

- Manager
- Receptionist
- Housekeeping

**Nhiệm vụ của Frontend:**
- Hiển thị giao diện người dùng
- Gửi request đến Web API
- Xử lý dữ liệu trả về từ Backend
- Quản lý trạng thái ứng dụng
- Cập nhật dữ liệu real-time khi cần

#### 2.1.2. Backend (ASP.NET Core Web API)

Backend được triển khai dưới dạng **RESTful API** sử dụng ASP.NET Core Web API.

**Nhiệm vụ của Backend:**
- Xử lý logic nghiệp vụ
- Quản lý xác thực và phân quyền người dùng
- Thực hiện truy vấn cơ sở dữ liệu
- Trả dữ liệu dưới dạng JSON cho Frontend
- Cung cấp các API cho các chức năng nghiệp vụ

#### 2.1.3. Database

Hệ thống tiếp tục sử dụng **MySQL** làm hệ quản trị cơ sở dữ liệu, với các bảng chính như:

- Users
- Rooms
- RoomTypes
- Bookings
- RatePlans
- Invoices
- Vouchers

Các bảng này được ánh xạ thông qua **Entity Framework Core** để hỗ trợ thao tác dữ liệu dưới dạng đối tượng.

### 2.2. Sơ đồ kiến trúc hệ thống
Angular SPA
├── Manager Interface
├── Receptionist Interface
└── Housekeeping Interface
↓ (HTTP / REST API)
ASP.NET Core Web API
├── Authentication (JWT)
├── Booking Service
├── Room Service
├── RatePlan Service
├── Reporting Service
└── Housekeeping Service
↓ (Entity Framework Core)
MySQL

**Trong kiến trúc này:**
- Angular đóng vai trò **client application**
- ASP.NET Core Web API đóng vai trò **application server**
- MySQL là **data storage layer**

### 2.3. Luồng dữ liệu hệ thống

Luồng xử lý dữ liệu trong hệ thống mới được mô tả theo các bước sau:

1. Người dùng thực hiện thao tác trên giao diện Angular (ví dụ: tìm phòng).
2. Angular gửi HTTP request đến Web API.
3. Web API tiếp nhận request và chuyển đến tầng Service để xử lý logic nghiệp vụ.
4. Service sử dụng Entity Framework Core để truy vấn dữ liệu từ MySQL.
5. Kết quả được trả về Web API.
6. Web API trả dữ liệu về Angular dưới dạng JSON.
7. Angular cập nhật giao diện người dùng.

Luồng xử lý này giúp tách biệt hoàn toàn giao diện và logic xử lý, giúp hệ thống dễ bảo trì và mở rộng.

## 3. Thiết kế API (RESTful API)

### 3.1. API xác thực hệ thống

| Method | Endpoint              | Description         |
|--------|-----------------------|---------------------|
| POST   | `/api/auth/login`     | Đăng nhập hệ thống  |
| POST   | `/api/auth/refresh`   | Làm mới token       |
| POST   | `/api/auth/logout`    | Đăng xuất           |

### 3.2. API dành cho Manager

**Quản lý loại phòng:**

| Method | Endpoint                     |
|--------|------------------------------|
| GET    | `/api/room-types`            |
| GET    | `/api/room-types/{id}`       |
| POST   | `/api/room-types`            |
| PUT    | `/api/room-types/{id}`       |
| DELETE | `/api/room-types/{id}`       |

**Quản lý phòng:**

| Method | Endpoint              |
|--------|-----------------------|
| GET    | `/api/rooms`          |
| POST   | `/api/rooms`          |
| PUT    | `/api/rooms/{id}`     |
| DELETE | `/api/rooms/{id}`     |

**Quản lý gói giá (RatePlan):**

| Method | Endpoint                    |
|--------|-----------------------------|
| GET    | `/api/rateplans`            |
| POST   | `/api/rateplans`            |
| PUT    | `/api/rateplans/{id}`       |
| DELETE | `/api/rateplans/{id}`       |

**Báo cáo thống kê:**

| Method | Endpoint                     |
|--------|------------------------------|
| GET    | `/api/reports/revenue`       |
| GET    | `/api/reports/occupancy`     |
| GET    | `/api/reports/top-rooms`     |

### 3.3. API dành cho Receptionist

**Tìm phòng trống:**

| Method | Endpoint               |
|--------|------------------------|
| GET    | `/api/rooms/available` |

**Quản lý booking:**

| Method | Endpoint                |
|--------|-------------------------|
| GET    | `/api/bookings`         |
| GET    | `/api/bookings/{id}`    |
| POST   | `/api/bookings`         |
| PUT    | `/api/bookings/{id}`    |

**Check-in:**

| Method | Endpoint                    |
|--------|-----------------------------|
| POST   | `/api/bookings/checkin`     |

### 3.4. API dành cho Housekeeping

**Danh sách phòng cần dọn:**

| Method | Endpoint                          |
|--------|-----------------------------------|
| GET    | `/api/housekeeping/dirty-rooms`   |

**Cập nhật trạng thái phòng:**

| Method | Endpoint                                      |
|--------|-----------------------------------------------|
| PUT    | `/api/housekeeping/rooms/{roomId}/status`     |

**Báo cáo hư hỏng:**

| Method | Endpoint                    |
|--------|-----------------------------|
| POST   | `/api/maintenance/report`   |

## 4. Phân tích chi tiết các chức năng thực tế

### 4.1. Quy trình Check-in

1. Lễ tân tìm kiếm booking theo mã đặt phòng hoặc tên khách.
2. Xác minh thông tin khách hàng bằng giấy tờ tùy thân (CCCD/Passport).
3. Nếu booking chưa được gán phòng, hệ thống sẽ gán phòng phù hợp.
4. Lễ tân thực hiện check-in trên hệ thống.
5. Hệ thống cập nhật trạng thái:
   - `Booking.Status = CheckedIn`
   - `Room.Status = Occupied`
6. Lễ tân giao chìa khóa phòng cho khách.

### 4.2. Quy trình Check-out

1. Lễ tân chọn phòng đang có khách ở.
2. Kiểm tra các dịch vụ phát sinh (minibar, laundry, room service).
3. Hệ thống tính toán tổng hóa đơn.
4. Khách thực hiện thanh toán.
5. Hệ thống cập nhật trạng thái:
   - `Booking.Status = Completed`
   - `Room.Status = Dirty`
6. Phòng được chuyển sang trạng thái cần dọn cho bộ phận Housekeeping.

## 5. Cập nhật dữ liệu thời gian thực (Real-time)

Hệ thống sử dụng **SignalR** để cập nhật trạng thái phòng ngay lập tức (ví dụ: khi check-out → phòng chuyển sang trạng thái *Dirty* và Housekeeping thấy ngay).

## 6. Security và Authentication

### 6.1. Cơ chế xác thực
- Sử dụng **JWT (JSON Web Token)**.
- Các request sau khi đăng nhập phải gửi token trong header:  
  `Authorization: Bearer {JWT_TOKEN}`

### 6.2. Phân quyền hệ thống
Hệ thống sử dụng **Role-based Authorization** với các vai trò:

- Admin
- Manager
- Receptionist
- Housekeeping

Ví dụ annotation trong Backend:  
`[Authorize(Roles = "Manager")]`

## 7. Công nghệ sử dụng

### 7.1. Frontend

| Công nghệ             | Mục đích                          |
|-----------------------|-----------------------------------|
| Angular               | Framework phát triển SPA          |
| Angular Material      | Thư viện UI                       |
| RxJS                  | Reactive Programming              |
| Angular HttpClient    | Gọi REST API                      |
| SignalR Client        | Nhận dữ liệu real-time            |
| Chart.js              | Hiển thị biểu đồ                  |

### 7.2. Backend

| Công nghệ                  | Mục đích                          |
|----------------------------|-----------------------------------|
| ASP.NET Core Web API       | Xây dựng REST API                 |
| Entity Framework Core      | ORM                               |
| MySQL                      | Hệ quản trị cơ sở dữ liệu         |
| JWT Bearer                 | Authentication                    |
| AutoMapper                 | Mapping DTO                       |
| FluentValidation           | Kiểm tra dữ liệu                  |
| Swagger                    | Tài liệu API                      |
| SignalR                    | Real-time communication           |
| Serilog                    | Logging                           |

## 8. Chức năng dành cho khách hàng (Guest)

### 8.1. Tổng quan chức năng khách hàng
Khách hàng có thể:
- Tìm kiếm phòng trống theo ngày lưu trú
- Xem thông tin chi tiết phòng
- So sánh giá giữa các gói giá (RatePlan)
- Đặt phòng trực tuyến
- Áp dụng mã giảm giá (Voucher)
- Theo dõi trạng thái đặt phòng
- Hủy/chỉnh sửa đặt phòng (nếu chính sách cho phép)

### 8.2. Luồng nghiệp vụ đặt phòng

**Bước 1: Tìm kiếm phòng**  
`GET /api/rooms/available?checkin=...&checkout=...&guests=...`

**Bước 2: Xem thông tin phòng**  
`GET /api/rooms/{id}`

**Bước 3: Chọn gói giá**  
`GET /api/rooms/{roomId}/rateplans`

**Bước 4: Nhập thông tin khách hàng**

**Bước 5: Áp dụng mã giảm giá**  
`POST /api/vouchers/validate`

**Bước 6: Thanh toán**

**Bước 7: Xác nhận đặt phòng**  
`POST /api/bookings`

### 8.3. API dành cho khách hàng (Guest)

| Chức năng                  | Method | Endpoint                              |
|----------------------------|--------|---------------------------------------|
| Tìm phòng                  | GET    | `/api/rooms/available`                |
| Xem thông tin phòng        | GET    | `/api/rooms/{id}`                     |
| Xem gói giá                | GET    | `/api/rooms/{roomId}/rateplans`       |
| Kiểm tra voucher           | POST   | `/api/vouchers/validate`              |
| Đặt phòng                  | POST   | `/api/bookings`                       |
| Xem booking của khách      | GET    | `/api/bookings/{bookingId}`           |
| Hủy booking                | POST   | `/api/bookings/{bookingId}/cancel`    |

### 8.4. Luồng dữ liệu đặt phòng
1. Khách truy cập Angular SPA.
2. Gửi request tìm phòng → Web API → MySQL.
3. Chọn phòng → gửi request đặt phòng.
4. Web API tạo booking và trả kết quả JSON.

### 8.5. Lợi ích khi chuyển sang kiến trúc mới
- Giao diện mượt mà nhờ Angular SPA
- Dễ mở rộng sang mobile app
- Tích hợp thanh toán trực tuyến trong tương lai
- Hoàn thiện cả **Booking System** và **Property Management System**

---