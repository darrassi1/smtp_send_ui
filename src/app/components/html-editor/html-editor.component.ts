import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import * as QuillNamespace from 'quill';

@Component({
  selector: 'app-html-editor',
  templateUrl: './html-editor.component.html'
})
export class HtmlEditorComponent implements OnInit {
  @Input() content: string = '';
  @Output() contentChange = new EventEmitter<string>();

  private editor: any;

  editorConfig = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      ['blockquote', 'code-block'],
      [{ 'header': 1 }, { 'header': 2 }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'direction': 'rtl' }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'font': [] }],
      [{ 'align': [] }],
      ['clean'],
      ['link', 'image']
    ]
  };

  ngOnInit(): void {
    // Initialize any Quill-specific setup if needed
  }

  onEditorCreated(editor: any): void {
    this.editor = editor;
  }

  onContentChanged(event: any): void {
    this.contentChange.emit(event.html);
  }

  // Add method to insert timestamp and user info
  insertTimestampAndUser(): void {
    if (!this.editor) return;

    const now = new Date();
    const formattedDate = now.getUTCFullYear() + '-' +
      String(now.getUTCMonth() + 1).padStart(2, '0') + '-' +
      String(now.getUTCDate()).padStart(2, '0') + ' ' +
      String(now.getUTCHours()).padStart(2, '0') + ':' +
      String(now.getUTCMinutes()).padStart(2, '0') + ':' +
      String(now.getUTCSeconds()).padStart(2, '0');

    const infoHtml = `
      <div style="color: #555; font-size: 12px; padding: 10px; border: 1px solid #ddd; background-color: #f8f8f8; margin-bottom: 15px; border-radius: 4px;">
        <p><strong>Date/Time:</strong> ${formattedDate} (UTC)</p>
        <p><strong>Sent by:</strong> darrassipro</p>
      </div>
    `;

    // Insert at the beginning of the editor
    this.editor.clipboard.dangerouslyPasteHTML(0, infoHtml);
  }
}
