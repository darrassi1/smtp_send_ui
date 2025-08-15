import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import * as Quill from 'quill';

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
    // Any initialization logic
  }

  onEditorCreated(editor: any): void {
    this.editor = editor;
  }

  onContentChanged(event: any): void {
    // Important: This needs to preserve the HTML formatting correctly
    this.contentChange.emit(event.html);
  }




}
