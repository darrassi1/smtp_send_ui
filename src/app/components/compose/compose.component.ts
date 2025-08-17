import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EmailService } from '../../services/email.service';
import { AttachmentService } from '../../services/attachment.service';
import { AuthService } from '../../services/auth.service';
import { Draft, Attachment } from '../../models/draft.model';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-compose',
  templateUrl: './compose.component.html'
})
export class ComposeComponent implements OnInit, OnDestroy {
  emailForm: FormGroup;
  attachments: Attachment[] = [];
  isLoading = false;
  draftId: string | null = null;
  isCodeBlockMode = false;
  showPreview = false;
  previewHtml = '';

  // Admin check properties
  showAdminModal = false;
  isAdmin = false;
  private adminSubscription: Subscription | null = null;

  constructor(
    private fb: FormBuilder,
    private emailService: EmailService,
    private attachmentService: AttachmentService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.emailForm = this.fb.group({
      to: ['', [Validators.required, Validators.email]],
      cc: [''],
      bcc: [''],
      subject: ['', Validators.required],
      senderName: [''],
      html: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // Check admin status first
    this.checkAdminStatus();

    // Check if draft ID is provided in query params
    this.route.queryParams.subscribe(params => {
      if (params['id']) {
        this.loadDraft(params['id']);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.adminSubscription) {
      this.adminSubscription.unsubscribe();
    }
  }

  private checkAdminStatus(): void {
    this.adminSubscription = this.authService.isAdmin$.subscribe(isAdmin => {
      this.isAdmin = isAdmin;
      if (!isAdmin) {
        this.showAdminModal = true;
      }
    });
  }

  // Modal methods
  closeAdminModal(): void {
    this.showAdminModal = false;
  }

  redirectToSettings(): void {
    this.router.navigate(['/settings']);
  }

  // Prevent form actions if not admin
  private checkAdminAccess(): boolean {
    if (!this.isAdmin) {
      this.showAdminModal = true;
      return false;
    }
    return true;
  }

  previewEmail(): void {
    if (!this.checkAdminAccess()) return;

    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }

    const email = this.prepareEmail();
    this.previewHtml = this.formatHtmlForPreview(email.html);
    this.showPreview = true;
  }

  closePreview(): void {
    this.showPreview = false;
    this.previewHtml = '';
  }

  formatHtmlForPreview(html: string): string {
    let formattedHtml = html;

    if (html) {
      if (html.includes('ql-code-block-container')) {
        const matches = html.match(/<div class="ql-code-block">([\s\S]*?)<\/div>/);
        if (matches && matches[1]) {
          formattedHtml = matches[1];
        }

        formattedHtml = formattedHtml
          .replace(/<div class="ql-code-block-container"[^>]*>/g, '')
          .replace(/<\/div>/g, '');
      }

      if (formattedHtml.includes('&lt;')) {
        formattedHtml = formattedHtml
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#039;/g, "'")
          .replace(/&amp;/g, '&');
      }
    } else if (formattedHtml && !formattedHtml.startsWith('<')) {
      formattedHtml = `<p>${formattedHtml.replace(/\n/g, '<br>')}</p>`;
    }

    return formattedHtml;
  }

  loadDraft(id: string): void {
    if (!this.checkAdminAccess()) return;

    this.isLoading = true;
    this.emailService.getDrafts().subscribe({
      next: (drafts) => {
        const draft = drafts.find(d => d.id === id);
        if (draft) {
          this.draftId = id;
          this.emailForm.patchValue({
            to: draft.to,
            cc: draft.cc || '',
            bcc: draft.bcc || '',
            subject: draft.subject,
            senderName: draft.senderName || '',
            html: draft.html
          });
          this.attachments = draft.attachments || [];
        }
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  onFileSelected(event: Event): void {
    if (!this.checkAdminAccess()) return;

    const element = event.target as HTMLInputElement;
    if (element.files && element.files.length > 0) {
      const file = element.files[0];
      this.isLoading = true;

      this.attachmentService.uploadFile(file).subscribe({
        next: (attachment) => {
          this.attachments.push(attachment);
          this.isLoading = false;
          element.value = '';
        },
        error: () => {
          this.isLoading = false;
          element.value = '';
        }
      });
    }
  }

  removeAttachment(filename: string): void {
    if (!this.checkAdminAccess()) return;

    this.attachmentService.deleteFile(filename).subscribe({
      next: () => {
        this.attachments = this.attachments.filter(a => a.filename !== filename);
      }
    });
  }

  onSaveDraft(): void {
    if (!this.checkAdminAccess()) return;

    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }

    const draft: Draft = {
      ...this.emailForm.value,
      attachments: this.attachments,
      id: this.draftId || undefined
    };

    this.isLoading = true;
    this.emailService.saveDraft(draft).subscribe({
      next: (savedDraft) => {
        if (savedDraft.id) {
          this.draftId = savedDraft.id;
        }
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  onSendEmail(): void {
    if (!this.checkAdminAccess()) return;

    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }

    const email = this.prepareEmail();
    this.isLoading = true;

    this.emailService.sendEmail(email).subscribe({
      next: () => {
        this.resetForm();
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  resetForm(): void {
    this.emailForm.reset();
    this.attachments = [];
    this.draftId = null;
    this.isCodeBlockMode = false;
  }

  prepareEmail(): Draft {
    const email = {
      to: this.emailForm.get('to')?.value,
      cc: this.emailForm.get('cc')?.value,
      bcc: this.emailForm.get('bcc')?.value,
      subject: this.emailForm.get('subject')?.value,
      senderName: this.emailForm.get('senderName')?.value,
      html: this.emailForm.get('html')?.value,
      attachments: this.attachments,
      id: this.draftId || undefined
    };

    if (this.isCodeBlockMode && email.html) {
      let htmlContent = email.html;

      if (htmlContent.includes('ql-code-block-container')) {
        const matches = htmlContent.match(/<div class="ql-code-block">([\s\S]*?)<\/div>/);
        if (matches && matches[1]) {
          htmlContent = matches[1];
        }
      }

      htmlContent = htmlContent
        .replace(/<div class="ql-code-block-container"[^>]*>/g, '')
        .replace(/<\/div>/g, '');

      email.html = htmlContent;
    } else if (email.html && !email.html.startsWith('<')) {
      email.html = `<p>${email.html.replace(/\n/g, '<br>')}</p>`;
    }

    return email;
  }
}
