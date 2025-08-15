import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { Attachment } from '../models/draft.model';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class AttachmentService {
  private apiUrl = '/api/attachments';

  constructor(
    private http: HttpClient,
    private toastService: ToastService
  ) {}

  uploadFile(file: File): Observable<Attachment> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<Attachment>(this.apiUrl, formData).pipe(
      catchError(error => {
        this.toastService.show(`Failed to upload file: ${error.error?.message || error.message}`, 'error');
        return throwError(() => error);
      })
    );
  }

  deleteFile(filename: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${filename}`).pipe(
      catchError(error => {
        this.toastService.show('Failed to delete file', 'error');
        return throwError(() => error);
      })
    );
  }
}
