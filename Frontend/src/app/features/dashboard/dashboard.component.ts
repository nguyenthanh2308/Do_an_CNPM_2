import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType, Chart, registerables } from 'chart.js';
import { ReportService } from '../../core/services/report.service';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Register all Chart.js registerables once
Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    NgChartsModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  isLoading = true;

  // KPI Metrics
  totalRevenue = 0;
  totalRooms = 0;
  occupiedRooms = 0;
  availableRooms = 0;

  // ── Bar Chart (Revenue) ────────────────────────────────────────────────
  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    scales: {
      x: {},
      y: { min: 0 }
    },
    plugins: {
      legend: { display: true },
    }
  };
  public barChartType: ChartType = 'bar';
  public barChartData: ChartData<'bar'> = {
    labels: [], // Ngày
    datasets: [
      { data: [], label: 'Doanh thu (VND)', backgroundColor: '#6366f1', borderRadius: 6 }
    ]
  };

  // ── Doughnut Chart (Occupancy) ─────────────────────────────────────────
  public doughnutChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: { position: 'right' }
    }
  };
  public doughnutChartType: ChartType = 'doughnut';
  public doughnutChartData: ChartData<'doughnut'> = {
    labels: ['Phòng có khách (Occupied)', 'Phòng trống (Available)', 'Đang dọn/Bảo trì'],
    datasets: [
      {
        data: [0, 0, 0],
        backgroundColor: ['#ef4444', '#10b981', '#f59e0b'],
        borderWidth: 0
      }
    ]
  };

  constructor(private reportService: ReportService) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    // 1. Load Occupancy
    const today = new Date().toISOString().split('T')[0];
    this.reportService.getOccupancyReport(today).subscribe({
      next: (res: { data: any }) => {
        const d = res.data;
        this.totalRooms = d.totalRooms;
        this.occupiedRooms = d.occupiedRooms;
        this.availableRooms = d.availableRooms;
        const other = d.totalRooms - d.occupiedRooms - d.availableRooms;
        
        this.doughnutChartData.datasets[0].data = [
          d.occupiedRooms,
          d.availableRooms,
          other > 0 ? other : 0
        ];
        
        // Force chart update in ng2-charts by creating a new reference
        this.doughnutChartData = { ...this.doughnutChartData };
      }
    });

    // 2. Load Revenue (7 days ago to today)
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 7);
    
    this.reportService.getRevenueReport(start.toISOString().split('T')[0], end.toISOString().split('T')[0]).subscribe({
      next: (res: { data: any }) => {
        this.totalRevenue = res.data.totalRevenue;
        
        // Cập nhật mảng Bar Chart
        const labels = res.data.invoices.map((inv: any) => new Date(inv.issuedAt).toLocaleDateString());
        const data = res.data.invoices.map((inv: any) => inv.totalAmount);
        
        // Nếu có nhiều hóa đơn trong 1 ngày, Backend chưa group by ngày. 
        // Trong dự án đồ án ngắn, ta sẽ hiển thị list dạng thô dọc theo thời gian.
        
        this.barChartData.labels = labels;
        this.barChartData.datasets[0].data = data;
        this.barChartData = { ...this.barChartData };

        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }
}
