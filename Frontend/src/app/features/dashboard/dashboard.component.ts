import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType, Chart, registerables } from 'chart.js';
import { ReportService } from '../../core/services/report.service';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatBadgeModule } from '@angular/material/badge';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    NgChartsModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatBadgeModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  isLoading = true;

  // ── KPI Metrics ────────────────────────────────────────────────────────
  totalRevenue = 0;
  totalRooms = 0;
  occupiedRooms = 0;
  availableRooms = 0;
  dirtyRooms = 0;
  checkInsToday = 0;
  checkOutsToday = 0;
  pendingHousekeepingTasks = 0;

  // ── Top Rooms ──────────────────────────────────────────────────────────
  topRooms: { roomNumber: string; roomTypeName: string; bookingCount: number; totalRevenue: number }[] = [];
  topRoomsColumns = ['rank', 'roomNumber', 'roomTypeName', 'bookingCount', 'totalRevenue'];

  // ── Bar Chart (Revenue) ────────────────────────────────────────────────
  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: { color: 'rgba(0,0,0,0.04)' }
      },
      y: {
        min: 0,
        grid: { color: 'rgba(0,0,0,0.04)' },
        ticks: {
          callback: (value) => {
            const num = Number(value);
            if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
            if (num >= 1_000) return (num / 1_000).toFixed(0) + 'K';
            return num.toString();
          }
        }
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${Number(ctx.raw).toLocaleString('vi-VN')} VNĐ`
        }
      }
    }
  };
  public barChartType: ChartType = 'bar';
  public barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Doanh thu (VNĐ)',
        backgroundColor: 'rgba(99,102,241,0.8)',
        hoverBackgroundColor: '#6366f1',
        borderRadius: 8,
        borderSkipped: false
      }
    ]
  };

  // ── Doughnut Chart (Occupancy) ─────────────────────────────────────────
  public doughnutChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right' },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.label}: ${ctx.raw} phòng`
        }
      }
    }
  };
  public doughnutChartType: ChartType = 'doughnut';
  public doughnutChartData: ChartData<'doughnut'> = {
    labels: ['Có khách (Occupied)', 'Trống (Available)', 'Đang dọn/Bảo trì'],
    datasets: [
      {
        data: [0, 0, 0],
        backgroundColor: ['#ef4444', '#10b981', '#f59e0b'],
        hoverBackgroundColor: ['#dc2626', '#059669', '#d97706'],
        borderWidth: 3,
        borderColor: '#ffffff'
      }
    ]
  };

  constructor(private reportService: ReportService) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 7);
    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    let completed = 0;
    const total = 3;
    const done = () => { if (++completed === total) this.isLoading = false; };

    // 1. Dashboard tổng quan (check-ins, check-outs, dirty rooms, pending tasks)
    this.reportService.getDashboardStats().subscribe({
      next: (res: any) => {
        if (res?.data) {
          const d = res.data;
          this.totalRooms = d.totalRooms ?? 0;
          this.occupiedRooms = d.occupiedRooms ?? 0;
          this.availableRooms = d.availableRooms ?? 0;
          this.dirtyRooms = d.dirtyRooms ?? 0;
          this.checkInsToday = d.checkInsToday ?? 0;
          this.checkOutsToday = d.checkOutsToday ?? 0;
          this.pendingHousekeepingTasks = d.pendingHousekeepingTasks ?? 0;

          this.doughnutChartData.datasets[0].data = [
            this.occupiedRooms,
            this.availableRooms,
            (this.dirtyRooms + (this.totalRooms - this.occupiedRooms - this.availableRooms - this.dirtyRooms > 0
              ? this.totalRooms - this.occupiedRooms - this.availableRooms - this.dirtyRooms : 0))
          ];
          this.doughnutChartData = { ...this.doughnutChartData };
        }
        done();
      },
      error: () => done()
    });

    // 2. Revenue 7 ngày
    this.reportService.getRevenueReport(startStr, endStr).subscribe({
      next: (res: any) => {
        if (res?.data) {
          this.totalRevenue = res.data.totalRevenue ?? 0;
          if (Array.isArray(res.data.dailyBreakdown)) {
            const labels = res.data.dailyBreakdown.map((item: any) =>
              new Date(item.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
            );
            const data = res.data.dailyBreakdown.map((item: any) => item.revenue ?? 0);
            this.barChartData = {
              ...this.barChartData,
              labels,
              datasets: [{ ...this.barChartData.datasets[0], data }]
            };
          }
        }
        done();
      },
      error: () => done()
    });

    // 3. Top 5 phòng (7 ngày)
    this.reportService.getTopRooms(startStr, endStr, 5).subscribe({
      next: (res: any) => {
        if (res?.data) {
          this.topRooms = res.data;
        }
        done();
      },
      error: () => done()
    });
  }
}
