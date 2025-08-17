import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAdminSubject = new BehaviorSubject<boolean>(this.checkAdminStatus());
  isAdmin$ = this.isAdminSubject.asObservable();

  constructor() {}

  login(username: string, password: string): boolean {
    // In a real app, you would validate credentials with backend
    // For demo, we'll use a simple check
    if (username === 'admin' && password === 'supersecret') {
      const credentials = btoa(`${username}:${password}`);
      sessionStorage.setItem('admin_credentials', credentials);
      this.isAdminSubject.next(true);
      return true;
    }
    return false;
  }

  logout(): void {
    sessionStorage.removeItem('admin_credentials');
    this.isAdminSubject.next(false);
  }
canMakeAuthenticatedRequest(): boolean {
  return !!this.getAuthHeader();
}
  getAuthHeader(): string | null {
    const credentials = sessionStorage.getItem('admin_credentials');
    return credentials ? `Basic ${credentials}` : null;
  }

  private checkAdminStatus(): boolean {
    return !!sessionStorage.getItem('admin_credentials');
  }
}

