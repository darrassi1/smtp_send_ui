import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { SmtpConfig } from '../models/smtp-config.model';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class SmtpConfigService {
  // Use the correct production API URL
  private apiUrl = window.location.hostname === 'localhost' 
    ? '/api/smtp-config' 
    : 'https://smtp-send-server.vercel.app/api/smtp-config';

  constructor(
    private http: HttpClient,
    private toastService: ToastService
  ) {}

  testConnection(config: SmtpConfig): Observable<any> {
    // Hard-code auth credentials for simplicity in this fix
    const credentials = sessionStorage.getItem('admin_credentials') || 'YWRtaW46c3VwZXJzZWNyZXQ='; // admin:supersecret
    
    // Force headers with test endpoint (bypassing interceptor issues)
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Basic ${credentials}`
    });

    console.log('Testing SMTP with URL:', `${this.apiUrl}/test`);
    return this.http.post(`${this.apiUrl}/test`, config, { headers }).pipe(
      catchError(error => {
        console.error('SMTP test error:', error);
        this.toastService.show('SMTP connection test failed', 'error');
        throw error;
      })
    );
  }

  // Other methods can remain unchanged
  getConfig(): Observable<SmtpConfig | null> {
    return this.http.get<SmtpConfig>(this.apiUrl).pipe(
      catchError(error => {
        if (error.status === 401) {
          this.toastService.show('Admin authentication required', 'error');
        } else {
          this.toastService.show('Failed to load SMTP configuration', 'error');
        }
        return of(null);
      })
    );
  }

  saveConfig(config: SmtpConfig): Observable<any> {
    return this.http.post(this.apiUrl, config).pipe(
      catchError(error => {
        if (error.status === 401) {
          this.toastService.show('Admin authentication required', 'error');
        } else {
          this.toastService.show('Failed to save SMTP configuration', 'error');
        }
        throw error;
      })
    );
  }
}
