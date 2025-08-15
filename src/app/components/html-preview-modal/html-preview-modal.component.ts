import { Component, Input, Output, EventEmitter } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-html-preview-modal',
  templateUrl: './html-preview-modal.component.html'
})
export class HtmlPreviewModalComponent {
  @Input() html: string = '';
  @Input() subject: string = '';
  @Output() close = new EventEmitter<void>();

  constructor(private sanitizer: DomSanitizer) {}

  get safeHtml(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.html);
  }

  onClose(): void {
    this.close.emit();
  }

}
