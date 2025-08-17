import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SmtpConfigService } from '../../services/smtp-config.service';
import { ToastService } from '../../services/toast.service';
import { SmtpConfig } from '../../models/smtp-config.model';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html'
})
export class SettingsComponent implements OnInit {
  isAdmin$ = this.authService.isAdmin$;
  smtpForm: FormGroup;
  isLoading = false;
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private smtpConfigService: SmtpConfigService,
    private toastService: ToastService,
    private router: Router // Add Router injection
  ) {
    this.smtpForm = this.fb.group({
      host: ['', Validators.required],
      port: [465, [Validators.required, Validators.min(1), Validators.max(65535)]],
      secure: [false],
      auth: this.fb.group({
        user: ['', Validators.required],
        pass: ['', Validators.required]
      }),
      from: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit(): void {
    this.loadSmtpConfig();
  }

  loadSmtpConfig(): void {
    this.isLoading = true;
    this.smtpConfigService.getConfig().subscribe({
      next: (config) => {
        if (config) {
          this.smtpForm.patchValue(config);
        }
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  onAdminLogin(): void {
    // Called when admin login is successful
    this.loadSmtpConfig();
  }

  onSubmit(): void {
    if (this.smtpForm.invalid) {
      this.smtpForm.markAllAsTouched();
      return;
    }

    const config: SmtpConfig = this.smtpForm.value;
    this.isLoading = true;

    this.smtpConfigService.saveConfig(config).subscribe({
      next: () => {
        this.toastService.show('SMTP configuration saved successfully', 'success');
        this.isLoading = false;

        // Redirect to compose route after successful save
        setTimeout(() => {
          this.router.navigate(['/compose']);
        }, 1500); // Wait 1.5 seconds to let user see the success toast
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }



  testConnection(): void {
    if (this.smtpForm.invalid) {
      this.smtpForm.markAllAsTouched();
      return;
    }

    const config: SmtpConfig = this.smtpForm.value;
    this.isLoading = true;

    this.smtpConfigService.testConnection(config).subscribe({
      next: () => {
        this.toastService.show('SMTP connection test successful!', 'success');
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
}
