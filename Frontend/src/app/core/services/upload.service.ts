import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, UploadImageResult } from '../models/models';

@Injectable({ providedIn: 'root' })
export class UploadService {
  private readonly uploadImageUrl = `${environment.apiUrl}/uploads/image`;

  constructor(private http: HttpClient) {}

  uploadImage(file: File): Observable<ApiResponse<UploadImageResult>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<UploadImageResult>>(this.uploadImageUrl, formData);
  }
}
