import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { QuillModule } from 'ngx-quill';
import { CommonModule } from '@angular/common';
import { HtmlPreviewModalComponent } from './components/html-preview-modal/html-preview-modal.component';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { ComposeComponent } from './components/compose/compose.component';
import { DraftsComponent } from './components/drafts/drafts.component';
import { SettingsComponent } from './components/settings/settings.component';
import { AdminLoginComponent } from './components/admin-login/admin-login.component';
import { ToastComponent } from './components/toast/toast.component';
import { HtmlEditorComponent } from './components/html-editor/html-editor.component';
import { AuthInterceptor } from './services/auth.interceptor';

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    ComposeComponent,
    DraftsComponent,
    SettingsComponent,
    AdminLoginComponent,
    ToastComponent,
    HtmlPreviewModalComponent,
    HtmlEditorComponent
  ],
  imports: [
    BrowserModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    AppRoutingModule,
    QuillModule.forRoot()
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
