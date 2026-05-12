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

- Admin
- Manager
- Receptionist
- Housekeeping
- Guest (khách hàng)

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
- BookingRooms
- RatePlans
- Invoices
- Payments
- Promotions
- HousekeepingTasks
- Guests
- Hotels
- Amenities
- RoomTypeAmenities

Các bảng này được ánh xạ thông qua **Entity Framework Core** để hỗ trợ thao tác dữ liệu dưới dạng đối tượng.

### 2.2. Sơ đồ kiến trúc hệ thống
```
Angular SPA
├── Admin / Manager Interface
├── Receptionist Interface
├── Housekeeping Interface
└── Guest Interface
       ↓ (HTTP / REST API + SignalR)
ASP.NET Core Web API
├── Authentication (JWT)
├── Booking Service (Check-in/Check-out)
├── Room Service
├── RatePlan Service
├── Reporting Service
├── Housekeeping Service (+ Maintenance)
├── Invoice & Payment Service
└── Guest Account Service
       ↓ (Entity Framework Core)
MySQL
```

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

### 3.2. API dành cho Manager / Admin

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
| GET    | `/api/rooms/{id}`     |
| POST   | `/api/rooms`          |
| PUT    | `/api/rooms/{id}`     |
| DELETE | `/api/rooms/{id}`     |

**Quản lý gói giá (RatePlan):**

| Method | Endpoint                    |
|--------|-----------------------------|
| GET    | `/api/rateplans`            |
| GET    | `/api/rateplans/{id}`       |
| POST   | `/api/rateplans`            |
| PUT    | `/api/rateplans/{id}`       |
| DELETE | `/api/rateplans/{id}`       |

**Quản lý khuyến mãi (Promotions):**

| Method | Endpoint                       |
|--------|--------------------------------|
| GET    | `/api/promotions`              |
| GET    | `/api/promotions/{id}`         |
| POST   | `/api/promotions`              |
| PUT    | `/api/promotions/{id}`         |
| DELETE | `/api/promotions/{id}`         |

**Quản lý nhân viên:**

| Method | Endpoint              |
|--------|-----------------------|
| GET    | `/api/staff`          |
| GET    | `/api/staff/{id}`     |
| POST   | `/api/staff`          |
| PUT    | `/api/staff/{id}`     |
| DELETE | `/api/staff/{id}`     |

**Báo cáo thống kê:**

| Method | Endpoint                       | Mô tả                         |
|--------|--------------------------------|-------------------------------|
| GET    | `/api/reports/revenue`         | Doanh thu theo ngày           |
| GET    | `/api/reports/occupancy`       | Công suất phòng theo loại     |
| GET    | `/api/reports/top-rooms`       | Top phòng được đặt nhiều nhất |
| GET    | `/api/reports/dashboard`       | Số liệu tổng quan Dashboard   |

### 3.3. API dành cho Receptionist

**Tìm phòng trống:**

| Method | Endpoint                        | Query Params                          |
|--------|---------------------------------|---------------------------------------|
| GET    | `/api/bookings/available-rooms` | checkin, checkout, guests, roomTypeId |

**Quản lý booking:**

| Method | Endpoint                          | Mô tả                         |
|--------|-----------------------------------|-------------------------------|
| GET    | `/api/bookings`                   | Danh sách booking (có filter) |
| GET    | `/api/bookings/{id}`              | Chi tiết booking              |
| GET    | `/api/bookings/guest/{guestId}`   | Booking theo khách            |
| POST   | `/api/bookings`                   | Tạo đặt phòng mới             |
| PUT    | `/api/bookings/{id}`              | Cập nhật booking              |
| DELETE | `/api/bookings/{id}`              | Hủy booking                   |

**Check-in / Check-out:**

| Method | Endpoint                    | Mô tả                                  |
|--------|-----------------------------|----------------------------------------|
| PUT    | `/api/bookings/checkin`     | Check-in → Room: Occupied              |
| PUT    | `/api/bookings/checkout`    | Check-out → Room: Dirty + tạo task dọn |

**Hóa đơn & Thanh toán:**

| Method | Endpoint                          | Mô tả                     |
|--------|-----------------------------------|---------------------------|
| GET    | `/api/invoices`                   | Danh sách hóa đơn         |
| GET    | `/api/invoices/{id}`              | Chi tiết hóa đơn          |
| GET    | `/api/payments`                   | Danh sách thanh toán      |
| GET    | `/api/payments/{id}`              | Chi tiết thanh toán       |
| GET    | `/api/payments/invoice/{id}`      | Thanh toán theo hóa đơn   |
| POST   | `/api/payments`                   | Ghi nhận thanh toán       |
| PUT    | `/api/payments/{id}/status`       | Cập nhật trạng thái TT    |

**Voucher:**

| Method | Endpoint                          | Mô tả                    |
|--------|-----------------------------------|--------------------------|
| POST   | `/api/bookings/validate-voucher`  | Kiểm tra mã giảm giá     |

### 3.4. API dành cho Housekeeping

**Danh sách task và phòng:**

| Method | Endpoint                                       | Mô tả                         |
|--------|------------------------------------------------|-------------------------------|
| GET    | `/api/housekeeping`                            | Danh sách task (filter được)  |
| GET    | `/api/housekeeping/{id}`                       | Chi tiết task                 |
| GET    | `/api/housekeeping/dirty-rooms`                | Danh sách phòng cần dọn       |

**Tạo và cập nhật task:**

| Method | Endpoint                                       | Mô tả                         |
|--------|------------------------------------------------|-------------------------------|
| POST   | `/api/housekeeping`                            | Tạo task dọn phòng / bảo trì  |
| POST   | `/api/housekeeping/maintenance-report`         | Báo cáo hư hỏng               |
| PUT    | `/api/housekeeping/{id}`                       | Cập nhật thông tin task        |
| PUT    | `/api/housekeeping/{id}/status`                | Cập nhật tiến độ task          |

### 3.5. API dành cho Guest (Khách hàng)

| Chức năng                  | Method | Endpoint                              |
|----------------------------|--------|---------------------------------------|
| Tìm phòng trống            | GET    | `/api/bookings/available-rooms`       |
| Xem thông tin phòng        | GET    | `/api/rooms/{id}`                     |
| Xem gói giá theo loại phòng| GET    | `/api/rateplans?roomTypeId={id}`      |
| Kiểm tra voucher           | POST   | `/api/bookings/validate-voucher`      |
| Đặt phòng                  | POST   | `/api/bookings`                       |
| Xem booking của tôi        | GET    | `/api/bookings/my-bookings`           |
| Xem chi tiết booking       | GET    | `/api/bookings/{id}`                  |
| Hủy booking                | DELETE | `/api/bookings/{id}`                  |
| Đăng ký tài khoản guest    | POST   | `/api/guest-account/register`         |
| Đăng nhập (guest)          | POST   | `/api/guest-account/login`            |

## 4. Phân tích chi tiết các chức năng thực tế

### 4.1. Quy trình Check-in

1. Lễ tân tìm kiếm booking theo mã đặt phòng hoặc tên khách.
2. Xác minh thông tin khách hàng bằng giấy tờ tùy thân (CCCD/Passport).
3. Nếu booking chưa được gán phòng, hệ thống sẽ gán phòng phù hợp.
4. Lễ tân thực hiện check-in trên hệ thống.
5. Hệ thống cập nhật trạng thái:
   - `Booking.Status = CheckedIn`
   - `Room.Status = Occupied`
   - SignalR notify toàn bộ staff dashboard
6. Lễ tân giao chìa khóa phòng cho khách.

### 4.2. Quy trình Check-out

1. Lễ tân chọn phòng đang có khách ở.
2. Kiểm tra các dịch vụ phát sinh (surcharges, tax).
3. Hệ thống tính toán tổng hóa đơn và ghi nhận thanh toán.
4. Khách thực hiện thanh toán (tiền mặt / chuyển khoản / thẻ).
5. Hệ thống cập nhật trạng thái:
   - `Booking.Status = Completed`
   - `Room.Status = Dirty`
   - Tự động tạo `HousekeepingTask` (Cleaning, Priority: High)
6. SignalR notify Housekeeping dashboard về task mới.

### 4.3. Quy trình Báo cáo hư hỏng (Maintenance)

1. Nhân viên Housekeeping phát hiện hư hỏng trong phòng.
2. Gửi báo cáo qua `POST /api/housekeeping/maintenance-report`.
3. Hệ thống tự động:
   - Đổi `Room.Status = Maintenance`
   - Tạo `HousekeepingTask` (TaskType: Maintenance)
4. Manager xem và xử lý task trên dashboard.
5. Khi hoàn thành, phòng chuyển về `Available`.

## 5. Cập nhật dữ liệu thời gian thực (Real-time)

Hệ thống sử dụng **SignalR** để cập nhật trạng thái phòng ngay lập tức:
- Check-out → phòng chuyển sang trạng thái *Dirty* → Housekeeping thấy ngay
- Task dọn phòng mới được tạo → Housekeeping nhận thông báo
- Trạng thái phòng thay đổi → Staff dashboard cập nhật tức thì

## 6. Security và Authentication

### 6.1. Cơ chế xác thực
- Sử dụng **JWT (JSON Web Token)**.
- Các request sau khi đăng nhập phải gửi token trong header:  
  `Authorization: Bearer {JWT_TOKEN}`
- Hỗ trợ **Refresh Token** để duy trì phiên đăng nhập.

### 6.2. Phân quyền hệ thống
Hệ thống sử dụng **Role-based Authorization** với các vai trò:

| Vai trò        | Quyền hạn chính                                        |
|----------------|--------------------------------------------------------|
| Admin          | Toàn quyền hệ thống, quản lý khách sạn                 |
| Manager        | Báo cáo, quản lý phòng, booking, nhân viên              |
| Receptionist   | Booking, check-in/out, hóa đơn, thanh toán             |
| Housekeeping   | Xem và cập nhật task được giao                          |
| Guest          | Tìm phòng, đặt phòng, xem/hủy booking của mình         |

## 7. Công nghệ sử dụng

### 7.1. Frontend

| Công nghệ             | Mục đích                          |
|-----------------------|-----------------------------------|
| Angular 17+           | Framework phát triển SPA          |
| Angular Material      | Thư viện UI                       |
| RxJS                  | Reactive Programming              |
| Angular HttpClient    | Gọi REST API                      |
| SignalR Client        | Nhận dữ liệu real-time            |
| ng2-charts / Chart.js | Hiển thị biểu đồ Dashboard        |
| Angular Router        | Điều hướng SPA                    |

### 7.2. Backend

| Công nghệ                  | Mục đích                          |
|----------------------------|-----------------------------------|
| ASP.NET Core Web API       | Xây dựng REST API                 |
| Entity Framework Core      | ORM                               |
| MySQL                      | Hệ quản trị cơ sở dữ liệu         |
| JWT Bearer                 | Authentication                    |
| AutoMapper                 | Mapping DTO                       |
| FluentValidation           | Kiểm tra dữ liệu                  |
| Swagger / OpenAPI          | Tài liệu API tự động              |
| SignalR                    | Real-time communication           |
| Serilog                    | Structured Logging                |

## 8. Chức năng dành cho khách hàng (Guest)

### 8.1. Tổng quan chức năng khách hàng
Khách hàng có thể:
- Tìm kiếm phòng trống theo ngày lưu trú
- Xem thông tin chi tiết phòng và loại phòng
- So sánh giá giữa các gói giá (RatePlan)
- Đặt phòng trực tuyến (có hoặc không cần tài khoản)
- Áp dụng mã giảm giá (Promotion/Voucher)
- Theo dõi trạng thái đặt phòng
- Hủy đặt phòng (nếu chưa check-in)
- Quản lý hồ sơ cá nhân

### 8.2. Luồng nghiệp vụ đặt phòng

**Bước 1: Tìm kiếm phòng**  
`GET /api/bookings/available-rooms?checkin=...&checkout=...&guests=...`

**Bước 2: Xem thông tin phòng**  
`GET /api/rooms/{id}`

**Bước 3: Chọn gói giá**  
`GET /api/rateplans?roomTypeId={roomTypeId}`

**Bước 4: Nhập thông tin khách hàng**

**Bước 5: Áp dụng mã giảm giá (tùy chọn)**  
`POST /api/bookings/validate-voucher`

**Bước 6: Thanh toán**

**Bước 7: Xác nhận đặt phòng**  
`POST /api/bookings`

### 8.3. Lợi ích khi chuyển sang kiến trúc mới
- Giao diện mượt mà nhờ Angular SPA
- Dễ mở rộng sang mobile app
- Tích hợp thanh toán trực tuyến trong tương lai
- Hoàn thiện cả **Booking System** và **Property Management System**
- Real-time notifications qua SignalR cho toàn bộ staff

---