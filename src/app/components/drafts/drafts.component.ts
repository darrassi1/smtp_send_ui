import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { EmailService } from '../../services/email.service';
import { Draft } from '../../models/draft.model';

@Component({
  selector: 'app-drafts',
  templateUrl: './drafts.component.html'
})
export class DraftsComponent implements OnInit {
  drafts: Draft[] = [];
  isLoading = false;

  constructor(
    private emailService: EmailService,
    public router: Router  // Changed to public so template can access it
  ) {}

  ngOnInit(): void {
    this.loadDrafts();
  }

  loadDrafts(): void {
    this.isLoading = true;
    this.emailService.getDrafts().subscribe({
      next: (drafts) => {
        this.drafts = drafts;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  editDraft(id: string): void {
    this.router.navigate(['/compose'], { queryParams: { id } });
  }

  deleteDraft(id: string): void {
    if (confirm('Are you sure you want to delete this draft?')) {
      this.isLoading = true;
      this.emailService.deleteDraft(id).subscribe({
        next: () => {
          this.drafts = this.drafts.filter(d => d.id !== id);
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        }
      });
    }
  }

  getFormattedDate(date: Date | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  }

  navigateToCompose(): void {
    this.router.navigate(['/compose']);
  }
}
