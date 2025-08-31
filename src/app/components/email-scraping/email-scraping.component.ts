import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ScrapingService, ScrapingParams, ComprehensiveScrapingParams, PaginationInfo, FailedUrl } from '../../services/scraping.service';

@Component({
  selector: 'app-email-scraping',
  templateUrl: './email-scraping.component.html',
  styleUrls: ['./email-scraping.component.css']
})
export class EmailScrapingComponent implements OnInit, OnDestroy {
  // Form inputs - all manually entered
  searchQuery: string = '';
  urlsToScrape: number = 5;
  pageNumber: number = 1;
  resultsLimit: number = 10;

  // Comprehensive search inputs
  maxPages: number = 3;
  urlsPerPage: number = 5;
  maxUrls: number = 50;

  // Component state
  emails: string[] = [];
  isLoading: boolean = false;
  progress: number = 0;
  currentAction: string = '';
  errorMessage: string = '';
  
  // CAPTCHA handling
  captchaUrl: string = '';
  needsCaptcha: boolean = false;

  // Results data
  paginationInfo: PaginationInfo | null = null;
  lastSearchStats: any = null;
  failedUrls: FailedUrl[] = [];

  // Email management
  selectedEmails: Set<string> = new Set();
  emailFilter: string = '';

  private subscriptions: Subscription[] = [];

  constructor(private scrapingService: ScrapingService) {}

  ngOnInit(): void {
    // Subscribe to progress updates
    const progressSub = this.scrapingService.scrapingProgress$.subscribe(progress => {
      this.isLoading = progress.isLoading;
      this.progress = progress.progress || 0;
      this.currentAction = progress.currentAction || '';
    });
    this.subscriptions.push(progressSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // Getter for filtered emails
  get filteredEmails(): string[] {
    if (!this.emailFilter.trim()) {
      return this.emails;
    }
    return this.emails.filter(email => 
      email.toLowerCase().includes(this.emailFilter.toLowerCase())
    );
  }

  // Method 1: Single page scraping with manual parameters
searchSinglePage(): void {
  if (!this.searchQuery.trim()) {
    this.setError('Please enter a search query');
    return;
  }
  this.clearError();
  this.clearCaptcha();

  const params: ScrapingParams = {
    query: this.searchQuery.trim(),
    urls: this.urlsToScrape,
    page: this.pageNumber,
    limit: this.resultsLimit,
    hrFocus: 'true'  // Add HR focus parameter
  };

  console.log('🔍 Starting single page search with params:', params);

  this.scrapingService.searchEmails(params).subscribe({
    next: (response) => {
      console.log('✅ Single page search completed:', response);
      
      // Make sure we're using allEmails from the response
      this.emails = response.allEmails || [];
      
      // Ensure we have emails
      if (this.emails.length === 0 && response.emails && response.emails.length > 0) {
        this.emails = response.emails;
      }
      
      this.paginationInfo = response.pagination;
      this.failedUrls = response.details.failedUrls;
      
      // Update stats with the correct email count and FROM WEBSITES count
      this.lastSearchStats = {
        totalEmails: this.emails.length,
        urlsScraped: response.scraping.urlsScraped,
        emailsFromSnippets: response.scraping.emailsFromSnippets || 0,
        emailsFromWebsites: response.scraping.emailsFromWebsites || 0,
        hrEmailsFound: response.scraping.hrEmailsFound || 0,
        duration: null
      };
      
      console.log(`Found ${this.emails.length} emails in total (${this.lastSearchStats.emailsFromWebsites} from websites)`);
    },
    error: (error) => {
      console.error('❌ Single page search failed:', error);
      this.handleError(error);
    }
  });
}


  // Method 2: Comprehensive scraping with manual parameters
searchAllPages(): void {
  if (!this.searchQuery.trim()) {
    this.setError('Please enter a search query');
    return;
  }
  this.clearError();
  this.clearCaptcha();

  const params: ComprehensiveScrapingParams = {
    query: this.searchQuery.trim(),
    maxPages: this.maxPages,
    urlsPerPage: this.urlsPerPage,
    maxUrls: this.maxUrls,
    hrFocus: 'true'  // Add HR focus parameter
  };

  console.log('🚀 Starting comprehensive search with params:', params);

  this.scrapingService.searchAllEmails(params).subscribe({
    next: (response) => {
      console.log('✅ Comprehensive search completed:', response);
      
      // Make sure we're using emails from the response
      this.emails = response.emails || [];
      
      this.paginationInfo = null; // No pagination for comprehensive search
      this.failedUrls = response.breakdown.failedUrls;
      
      // Update stats with the correct email count and FROM WEBSITES count
      // Use optional chaining and nullish coalescing to handle both old and new response formats
      this.lastSearchStats = {
        totalEmails: this.emails.length,
        urlsScraped: response.summary.totalUrlsScraped,
        emailsFromSnippets: response.summary.emailsFromSnippets || 0,
        emailsFromWebsites: response.summary.emailsFromWebsites || 0,
        // Only include HR stats if they exist in the response
        ...(response.summary.hrEmailsFound !== undefined && {
          hrEmailsFound: response.summary.hrEmailsFound
        }),
        duration: response.summary.scrapingDuration
      };
      
      console.log(`Found ${this.emails.length} emails in total (${this.lastSearchStats.emailsFromWebsites} from websites)`);
      
      // If HR emails were found, log them
      if (response.summary.hrEmailsFound) {
        console.log(`Found ${response.summary.hrEmailsFound} likely HR/recruitment emails`);
      }
    },
    error: (error) => {
      console.error('❌ Comprehensive search failed:', error);
      this.handleError(error);
    }
  });
}

  // Method 3: Sequential multiple pages (uses single page params)
searchMultipleSequential(): void {
  if (!this.searchQuery.trim()) {
    this.setError('Please enter a search query');
    return;
  }
  this.clearError();
  this.clearCaptcha();

  const params: ScrapingParams = {
    query: this.searchQuery.trim(),
    urls: this.urlsToScrape,
    limit: this.resultsLimit
    // Don't set page parameter as it will be set by the service
  };
  const pagesToSearch = 3; // Fixed at 3 for sequential

  console.log(`📚 Starting sequential search for ${pagesToSearch} pages with params:`, params);

  this.scrapingService.searchMultiplePages(params, pagesToSearch).subscribe({
    next: (responses) => {
      console.log('✅ Sequential search completed:', responses);
      // Get accumulated emails from service
      this.emails = this.scrapingService.getCurrentAccumulatedEmails();
      this.paginationInfo = null;

      // Calculate combined stats
      const totalUrlsScraped = responses.reduce((sum, r) => sum + r.scraping.urlsScraped, 0);
      const totalSnippetEmails = responses.reduce((sum, r) => sum + (r.scraping.emailsFromSnippets || 0), 0);
      const totalWebsiteEmails = responses.reduce((sum, r) => sum + (r.scraping.emailsFromWebsites || 0), 0);

      this.lastSearchStats = {
        totalEmails: this.emails.length,
        urlsScraped: totalUrlsScraped,
        emailsFromSnippets: totalSnippetEmails,
        emailsFromWebsites: totalWebsiteEmails,
        duration: null
      };

      // Collect all failed URLs
      this.failedUrls = responses.flatMap(r => r.details.failedUrls);
    },
    error: (error) => {
      console.error('❌ Sequential search failed:', error);
      this.handleError(error);
    }
  });
}

  // Handle errors including CAPTCHA
  private handleError(error: any): void {
    if (error.status === 429 && error.error?.needsCaptcha) {
      this.needsCaptcha = true;
      this.captchaUrl = error.error.captchaUrl;
      this.setError('CAPTCHA detected. Please solve it manually by clicking the link below.');
    } else {
      this.setError(`Search failed: ${error.error?.message || error.message || 'Unknown error'}`);
    }
  }

  // Open CAPTCHA URL in new tab
  openCaptchaUrl(): void {
    if (this.captchaUrl) {
      window.open(this.captchaUrl, '_blank');
    }
  }

  // Clear CAPTCHA state
  clearCaptcha(): void {
    this.needsCaptcha = false;
    this.captchaUrl = '';
  }

  // Pagination methods
  goToPreviousPage(): void {
    if (this.paginationInfo && this.paginationInfo.hasPrevPage) {
      this.pageNumber--;
      this.searchSinglePage();
    }
  }

  goToNextPage(): void {
    if (this.paginationInfo && this.paginationInfo.hasNextPage) {
      this.pageNumber++;
      this.searchSinglePage();
    }
  }

  // Email management methods
  toggleEmailSelection(email: string): void {
    if (this.selectedEmails.has(email)) {
      this.selectedEmails.delete(email);
    } else {
      this.selectedEmails.add(email);
    }
  }

  selectAllEmails(): void {
    this.filteredEmails.forEach(email => this.selectedEmails.add(email));
  }

  copyEmail(email: string): void {
    navigator.clipboard.writeText(email).then(() => {
      console.log(`📋 Copied: ${email}`);
      // You might want to show a toast notification here
    });
  }

  copyAllEmails(): void {
    const emailsText = this.selectedEmails.size > 0 
      ? Array.from(this.selectedEmails).join('\n') 
      : this.filteredEmails.join('\n');
    
    navigator.clipboard.writeText(emailsText).then(() => {
      console.log(`📋 Copied ${emailsText.split('\n').length} emails`);
    });
  }

  exportEmails(): void {
    const emailsToExport = this.selectedEmails.size > 0 
      ? Array.from(this.selectedEmails) 
      : this.emails;
    
    const cleanedEmails = this.scrapingService.cleanEmailList(emailsToExport);
    const filename = `${this.searchQuery.replace(/\s+/g, '_')}_emails_${new Date().toISOString().split('T')[0]}.csv`;
    
    this.scrapingService.exportEmailsToCSV(cleanedEmails, filename);
    console.log(`📥 Exported ${cleanedEmails.length} emails to ${filename}`);
  }

  clearEmails(): void {
    this.emails = [];
    this.selectedEmails.clear();
    this.paginationInfo = null;
    this.lastSearchStats = null;
    this.failedUrls = [];
    this.scrapingService.clearAccumulatedEmails();
    this.clearError();
    this.clearCaptcha();
    console.log('🗑️ Cleared all results');
  }

  // Error handling
  private setError(message: string): void {
    this.errorMessage = message;
    console.error('❌', message);
  }

  clearError(): void {
    this.errorMessage = '';
  }

  // Utility methods
  resetToDefaults(): void {
    this.searchQuery = '';
    this.urlsToScrape = 5;
    this.pageNumber = 1;
    this.resultsLimit = 10;
    this.maxPages = 3;
    this.urlsPerPage = 5;
    this.maxUrls = 50;
    this.clearEmails();
  }

  // Preset configurations
  setLightScraping(): void {
    this.urlsToScrape = 3;
    this.maxPages = 2;
    this.urlsPerPage = 3;
    this.maxUrls = 10;
  }

  setMediumScraping(): void {
    this.urlsToScrape = 8;
    this.maxPages = 4;
    this.urlsPerPage = 6;
    this.maxUrls = 30;
  }

  setHeavyScraping(): void {
    this.urlsToScrape = 15;
    this.maxPages = 8;
    this.urlsPerPage = 10;
    this.maxUrls = 80;
  }
}