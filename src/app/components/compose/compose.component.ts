import { Component, OnInit} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EmailService } from '../../services/email.service';
import { AttachmentService } from '../../services/attachment.service';
import { Draft, Attachment } from '../../models/draft.model';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-compose',
  templateUrl: './compose.component.html'
})
export class ComposeComponent implements OnInit{
  emailForm: FormGroup;
  attachments: Attachment[] = [];
  isLoading = false;
  draftId: string | null = null;
  isCodeBlockMode = false; // New property for code block checkbox
  showPreview = false;
previewHtml = '';

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
      senderName: [''], // Add sender name field
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
previewEmail(): void {
  if (this.emailForm.invalid) {
    this.emailForm.markAllAsTouched();
    return;
  }

  // Generate the HTML preview using the same logic as when sending
  const email = this.prepareEmail();

  // Format the HTML for preview
  this.previewHtml = this.formatHtmlForPreview(email.html);

  // Show the preview modal
  this.showPreview = true;
}

closePreview(): void {
  this.showPreview = false;
  this.previewHtml = '';
}

formatHtmlForPreview(html: string): string {
  let formattedHtml = html;

  // If using code block mode, process the HTML appropriately
  if (html) {
    // Extract from Quill formatting if needed
    if (html.includes('ql-code-block-container')) {
      const matches = html.match(/<div class="ql-code-block">([\s\S]*?)<\/div>/);
      if (matches && matches[1]) {
        formattedHtml = matches[1];
      }

      // Remove Quill wrappers
      formattedHtml = formattedHtml
        .replace(/<div class="ql-code-block-container"[^>]*>/g, '')
        .replace(/<\/div>/g, '');
    }

    // For code block mode, convert HTML entities if needed
    if (formattedHtml.includes('&lt;')) {
      formattedHtml = formattedHtml
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&amp;/g, '&');
    }
  }
  // Regular content (not code block)
  else if (formattedHtml && !formattedHtml.startsWith('<')) {
    formattedHtml = `<p>${formattedHtml.replace(/\n/g, '<br>')}</p>`;
  }

  return `${formattedHtml}`;
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
          senderName: draft.senderName || '', // Load sender name
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

    const email = this.prepareEmail();
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
    this.isCodeBlockMode = false;
  }



prepareEmail(): Draft {
  const email = {
    to: this.emailForm.get('to')?.value,
    cc: this.emailForm.get('cc')?.value,
    bcc: this.emailForm.get('bcc')?.value,
    subject: this.emailForm.get('subject')?.value,
    senderName: this.emailForm.get('senderName')?.value, // Include sender name
    html: this.emailForm.get('html')?.value,
    attachments: this.attachments,
    id: this.draftId || undefined
  };

  // Handle code block formatting if mode is enabled
  if (this.isCodeBlockMode && email.html) {
    // For code block mode, we need to extract the HTML from any Quill formatting
    let htmlContent = email.html;

    // Check if content is wrapped in Quill code block container
    if (htmlContent.includes('ql-code-block-container')) {
      // Extract the actual code from the Quill container
      const matches = htmlContent.match(/<div class="ql-code-block">([\s\S]*?)<\/div>/);
      if (matches && matches[1]) {
        // Use the extracted content directly (do not escape it)
        htmlContent = matches[1];
      }
    }

    // Remove any additional Quill-specific wrappers if present
    htmlContent = htmlContent
      .replace(/<div class="ql-code-block-container"[^>]*>/g, '')
      .replace(/<\/div>/g, '');

    // Set the extracted HTML directly (no escaping)
    email.html = htmlContent;
  }
  // Regular content (not code block mode)
  else if (email.html && !email.html.startsWith('<')) {
    // If content doesn't start with HTML tag, wrap it in paragraph tags
    email.html = `<p>${email.html.replace(/\n/g, '<br>')}</p>`;
  }

  return email;
}
}
