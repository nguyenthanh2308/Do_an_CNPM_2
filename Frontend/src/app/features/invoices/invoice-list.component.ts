import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule,
    ReactiveFormsModule
  ],
  template: `
    <div class="invoice-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Quản lý Hóa đơn</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p>Module Hóa đơn đang được phát triển...</p>
          <button mat-raised-button color="primary">
            <mat-icon>add</mat-icon>
            Tạo Hóa đơn
          </button>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .invoice-container {
      padding: 20px;
    }
  `]
})
export class InvoiceListComponent implements OnInit {
  
  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    // TODO: Implement invoice listing
  }
}
