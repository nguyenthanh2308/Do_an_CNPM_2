import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UploadService } from '../../../core/services/upload.service';

@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <div class="upload-wrap">
      <div class="preview" *ngIf="imageUrl">
        <img [src]="imageUrl" alt="Uploaded image preview" />
      </div>

      <div class="actions">
        <input type="file" accept="image/*" hidden #fileInput (change)="onFileSelected($event)" />
        <button mat-stroked-button type="button" (click)="fileInput.click()" [disabled]="isUploading">
          <mat-icon>upload</mat-icon>
          {{ buttonText }}
        </button>
        <mat-spinner *ngIf="isUploading" [diameter]="20"></mat-spinner>
      </div>

      <small class="hint">Ho tro: JPG, PNG, WEBP, GIF. Toi da 10MB.</small>
    </div>
  `,
  styles: [`
    .upload-wrap { display: flex; flex-direction: column; gap: 8px; }
    .preview img {
      width: 100%;
      max-height: 180px;
      object-fit: cover;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
    }
    .actions { display: flex; align-items: center; gap: 10px; }
    .hint { color: #6b7280; }
  `]
})
export class ImageUploadComponent {
  @Input() imageUrl: string | null = null;
  @Input() buttonText = 'Tai anh';
  @Output() imageUrlChange = new EventEmitter<string>();

  isUploading = false;

  constructor(private uploadService: UploadService, private snackBar: MatSnackBar) {}

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    this.isUploading = true;
    this.uploadService.uploadImage(file).subscribe({
      next: (res) => {
        this.imageUrl = res.data.url;
        this.imageUrlChange.emit(res.data.url);
        this.snackBar.open('Tai anh thanh cong.', 'Dong', { duration: 2500 });
        this.isUploading = false;
      },
      error: (err) => {
        const msg = err?.error?.errors?.[0] ?? 'Tai anh that bai.';
        this.snackBar.open(msg, 'Dong', { duration: 3500 });
        this.isUploading = false;
      }
    });
  }
}
