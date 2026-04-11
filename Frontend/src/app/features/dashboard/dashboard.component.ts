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
    const today = new Date().toISOString().split('T')[0];
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 7);
    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    let completedRequests = 0;
    const totalRequests = 2;

    // 1. Load Occupancy (today)
    this.reportService.getOccupancyReport(today, today).subscribe({
      next: (res: { data: any }) => {
        if (res.data) {
          const d = res.data;
          this.totalRooms = d.totalRooms || 0;
          this.occupiedRooms = d.occupiedRooms || 0;
          this.availableRooms = d.availableRooms || 0;
          const other = this.totalRooms - this.occupiedRooms - this.availableRooms;
          
          this.doughnutChartData.datasets[0].data = [
            this.occupiedRooms,
            this.availableRooms,
            other > 0 ? other : 0
          ];
          
          // Force chart update in ng2-charts by creating a new reference
          this.doughnutChartData = { ...this.doughnutChartData };
        }
        completedRequests++;
        if (completedRequests === totalRequests) this.isLoading = false;
      },
      error: () => {
        completedRequests++;
        if (completedRequests === totalRequests) this.isLoading = false;
      }
    });

    // 2. Load Revenue (7 days)
    this.reportService.getRevenueReport(startStr, endStr).subscribe({
      next: (res: { data: any }) => {
        if (res.data) {
          this.totalRevenue = res.data.totalRevenue || 0;
          
          // Cập nhật mảng Bar Chart - add null check
          if (res.data.dailyBreakdown && Array.isArray(res.data.dailyBreakdown)) {
            const labels = res.data.dailyBreakdown.map((item: any) => new Date(item.date).toLocaleDateString());
            const data = res.data.dailyBreakdown.map((item: any) => item.revenue);
            
            this.barChartData.labels = labels;
            this.barChartData.datasets[0].data = data;
            this.barChartData = { ...this.barChartData };
          }
        }
        completedRequests++;
        if (completedRequests === totalRequests) this.isLoading = false;
      },
      error: () => {
        completedRequests++;
        if (completedRequests === totalRequests) this.isLoading = false;
      }
    });
  }
}
