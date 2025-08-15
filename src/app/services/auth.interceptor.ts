import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Only add auth header for SMTP config endpoints
    if (request.url.includes('/api/smtp-config')) {
      const authHeader = this.authService.getAuthHeader();
      if (authHeader) {
        request = request.clone({
          setHeaders: {
            Authorization: authHeader
          }
        });
      }
    }
    return next.handle(request);
  }
}
