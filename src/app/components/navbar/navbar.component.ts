import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html'
})
export class NavbarComponent {
  isAdmin$ = this.authService.isAdmin$;

  constructor(private authService: AuthService) {}

  logout(): void {
    this.authService.logout();
  }
}
