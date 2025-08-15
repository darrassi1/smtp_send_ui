import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EmailService } from '../../services/email.service';
import { AttachmentService } from '../../services/attachment.service';
import { Draft, Attachment } from '../../models/draft.model';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-compose',
  templateUrl: './compose.component.html'
})
export class ComposeComponent implements OnInit {
  emailForm: FormGroup;
  attachments: Attachment[] = [];
  isLoading = false;
  draftId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private emailService: EmailService,
    private attachmentService: AttachmentService,
    private route: ActivatedRoute
  ) {
    this.emailForm = this.fb.group({
      to: ['', [Validators.required, Validators.email]],
      cc: [''],
      bcc: [''],
      subject: ['', Validators.required],
      html: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // Check if draft ID is provided in query params
    this.route.queryParams.subscribe(params => {
      if (params['id']) {
        this.loadDraft(params['id']);
      }
    });
  }

  loadDraft(id: string): void {
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
    const element = event.target as HTMLInputElement;
    if (element.files && element.files.length > 0) {
      const file = element.files[0];
      this.isLoading = true;

      this.attachmentService.uploadFile(file).subscribe({
        next: (attachment) => {
          this.attachments.push(attachment);
          this.isLoading = false;
          // Reset the file input
          element.value = '';
        },
        error: () => {
          this.isLoading = false;
          // Reset the file input
          element.value = '';
        }
      });
    }
  }

  removeAttachment(filename: string): void {
    this.attachmentService.deleteFile(filename).subscribe({
      next: () => {
        this.attachments = this.attachments.filter(a => a.filename !== filename);
      }
    });
  }

  onSaveDraft(): void {
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
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }

    const email: Draft = {
      ...this.emailForm.value,
      attachments: this.attachments
    };

    this.isLoading = true;
    this.emailService.sendEmail(email).subscribe({
      next: () => {
        // Clear form after successful send
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
  }
}
