# Do_An_2 - Hotel Management System

Ung dung quan ly va ban phong khach san duoc xay dung theo kien truc Frontend/Backend tach biet. Du an da hoan thanh cac chuc nang chinh cho khach hang, le tan, quan ly, admin va bo phan housekeeping.

## Cong nghe su dung

### Backend

- ASP.NET Core Web API (.NET 8)
- Entity Framework Core
- MySQL
- JWT Authentication va Refresh Token
- SignalR cho cap nhat realtime
- AutoMapper
- FluentValidation
- Serilog
- Swagger/OpenAPI

### Frontend

- Angular 17
- Angular Material
- RxJS
- Chart.js va ng2-charts
- SignalR client

## Cau truc thu muc

```text
Do_An_2/
+-- Backend/      # ASP.NET Core Web API
+-- Frontend/     # Angular application
+-- Document/     # Tai lieu phan tich/thiet ke
+-- Do_An_2.sln   # Visual Studio solution
+-- README.md
```

## Chuc nang chinh

- Dang nhap, dang ky, refresh token, phan quyen theo vai tro.
- Quan ly khach san, loai phong, phong va tien nghi.
- Tim phong trong theo ngay, so khach, loai phong va gia.
- Dat phong, cap nhat booking, huy booking.
- Check-in, check-out, tu dong tao hoa don/thanh toan va task don phong.
- Quan ly khuyen mai/voucher va goi gia phong.
- Quan ly khach hang, nhan vien va vai tro.
- Dashboard bao cao doanh thu, cong suat phong, top phong.
- Bang housekeeping realtime khi phong can don hoac trang thai phong thay doi.
- Upload anh cho khach san/phong/loai phong.

## Vai tro nguoi dung

- `Admin`: quan tri toan bo he thong, nhan vien, cau hinh va du lieu.
- `Manager`: quan ly khach san, phong, booking, bao cao.
- `Receptionist`: xu ly booking, check-in, check-out, khach hang va thanh toan.
- `Housekeeping`: theo doi va cap nhat task don phong.
- `Guest`: tim phong, dat phong, xem booking, thanh toan va cap nhat ho so.

## Yeu cau moi truong

- .NET SDK 8
- Node.js va npm
- Angular CLI 17
- MySQL Server

## Cau hinh database

Backend dang doc chuoi ket noi trong `Backend/appsettings.json`:

```json
"ConnectionStrings": {
  "HotelDb": "Server=localhost;Port=3306;Database=hotel_app;User=root;Password=2308;CharSet=utf8mb4;"
}
```

Neu may cua ban dung tai khoan MySQL khac, hay cap nhat `User` va `Password` cho phu hop.

Khi chay o moi truong Development, backend se tu migrate/tao database can thiet va seed du lieu mau.

Tai khoan admin mac dinh:

```text
Username: admin
Password: admin@123
Email: admin@hotel.com
```

## Cach chay Backend

```bash
cd Backend
dotnet restore
dotnet run --urls "http://localhost:5000"
```

Swagger API se mo tai:

```text
http://localhost:5000
```

API base URL:

```text
http://localhost:5000/api
```

SignalR hub:

```text
http://localhost:5000/hubs/room
```

## Cach chay Frontend

```bash
cd Frontend
npm install
npm start
```

Ung dung Angular chay tai:

```text
http://localhost:4200
```

Frontend dang cau hinh API trong `Frontend/src/environments/environment.ts`:

```ts
apiUrl: 'http://localhost:5000/api'
```

## Cac API chinh

- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/auth/me`
- `GET /api/hotels`
- `GET /api/rooms`
- `GET /api/room-types`
- `GET /api/bookings/available-rooms`
- `POST /api/bookings`
- `PUT /api/bookings/checkin`
- `PUT /api/bookings/checkout`
- `POST /api/bookings/validate-voucher`
- `GET /api/invoices`
- `GET /api/payments`
- `GET /api/housekeeping`
- `GET /api/reports/dashboard`
- `GET /api/reports/revenue`
- `GET /api/reports/occupancy`
- `GET /api/reports/top-rooms`

## Ghi chu

- Backend cho phep CORS tu `http://localhost:4200`.
- Upload anh duoc luu trong `Backend/wwwroot/uploads`.
- Log Serilog duoc luu trong `Backend/Logs`.
- Neu backend restart, frontend co co che kiem tra runtime session va yeu cau dang nhap lai.

## Build

Backend:

```bash
cd Backend
dotnet build
```

Frontend:

```bash
cd Frontend
npm run build
```
