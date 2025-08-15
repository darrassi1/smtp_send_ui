import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { Draft } from '../models/draft.model';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class EmailService {
  private sendUrl = '/api/send';
  private draftsUrl = '/api/drafts';

  constructor(
    private http: HttpClient,
    private toastService: ToastService
  ) {}

  sendEmail(email: Draft): Observable<any> {
    return this.http.post(this.sendUrl, email).pipe(
      tap(() => this.toastService.show('Email sent successfully!', 'success')),
      catchError(error => {
        this.toastService.show(`Failed to send email: ${error.error?.message || error.message}`, 'error');
        return throwError(() => error);
      })
    );
  }

  getDrafts(): Observable<Draft[]> {
    return this.http.get<Draft[]>(this.draftsUrl).pipe(
      catchError(error => {
        this.toastService.show('Failed to load drafts', 'error');
        return throwError(() => error);
      })
    );
  }

  saveDraft(draft: Draft): Observable<Draft> {
    return this.http.post<Draft>(this.draftsUrl, draft).pipe(
      tap(() => this.toastService.show('Draft saved', 'success')),
      catchError(error => {
        this.toastService.show('Failed to save draft', 'error');
        return throwError(() => error);
      })
    );
  }

  deleteDraft(id: string): Observable<any> {
    return this.http.delete(`${this.draftsUrl}/${id}`).pipe(
      tap(() => this.toastService.show('Draft deleted', 'success')),
      catchError(error => {
        this.toastService.show('Failed to delete draft', 'error');
        return throwError(() => error);
      })
    );
  }
}
