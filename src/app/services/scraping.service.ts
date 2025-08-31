import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, forkJoin } from 'rxjs';
import { tap, catchError, concatMap, delay } from 'rxjs/operators';
import { throwError, of } from 'rxjs';

// Interfaces for type safety
export interface ScrapingParams {
  query: string;
  urls?: number;
  page?: number;
  limit?: number;
   hrFocus?: string;  // Add this
}

export interface ComprehensiveScrapingParams {
  query: string;
  maxPages?: number;
  urlsPerPage?: number;
  maxUrls?: number;
  hrFocus?: string;  // Add this
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalEmails: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  emailsOnCurrentPage: number;
}

export interface ScrapingInfo {
  urlsRequested: number;
  urlsFound: number;
  urlsScraped: number;
  urlsFailed: number;
  emailsFromSnippets?: number;
  emailsFromWebsites?: number;
    hrEmailsFound?: number;     // Add this
  generalEmailsFound?: number; // Add this
}

export interface ScrapedUrl {
  url: string;
  searchPage?: number;
  isHRPage?: boolean;
  emailCount: number | {
    hr: number;
    general: number;
    total: number;
  };
  emails: string[] | {
    hr: string[];
    general: string[];
    all: string[];
  };
}

export interface FailedUrl {
  url: string;
  error: string;
  searchPage?: number;
  type?: string;
  page?: number;
}

export interface ScrapingResponse {
  query: string;
  pagination: PaginationInfo;
  scraping: ScrapingInfo;
  emails: string[];
  allEmails: string[];
  details: {
    scrapedUrls: ScrapedUrl[];
    failedUrls: FailedUrl[];
  };
}

export interface ComprehensiveScrapingResponse {
  query: string;
  summary: {
    searchPagesProcessed: number;
    urlsPerPageTarget: number;
    totalUrlsFound: number;
    totalUrlsScraped: number;
    totalUrlsFailed: number;
    totalUniqueEmails: number;
    totalRawEmails: number;
    scrapingDuration: string;
    emailsFromSnippets?: number;
    emailsFromWebsites?: number;
    hrEmailsFound?: number;     // Add this property
    generalEmailsFound?: number; // Add this property
  };
  emails: string[];
  breakdown: {
    emailsByType?: {            // Add this property
      hr: string[];
      general: string[];
    };
    emailsBySearchPage: { [key: string]: number } | { [key: string]: {hr: number, general: number, total: number} } | null;
    scrapedUrls: ScrapedUrl[];
    failedUrls: FailedUrl[];
    allSearchUrls: string[] | string;
  };
}

export interface ScrapingProgress {
  isLoading: boolean;
  progress?: number;
  currentAction?: string;
  estimatedTime?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ScrapingService {
  private readonly baseUrl = '/api/scraping'; // Update this to your server URL
  
  // Observable for tracking scraping progress
  private scrapingProgressSubject = new BehaviorSubject<ScrapingProgress>({ isLoading: false });
  public scrapingProgress$ = this.scrapingProgressSubject.asObservable();
  
  // Observable for storing scraped emails (for accumulation across pages)
  private accumulatedEmailsSubject = new BehaviorSubject<string[]>([]);
  public accumulatedEmails$ = this.accumulatedEmailsSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Paginated scraping - scrapes one search page at a time
   */
  searchEmails(params: ScrapingParams): Observable<ScrapingResponse> {
    this.updateProgress({ isLoading: true, currentAction: 'Starting email search...' });
    
    let httpParams = new HttpParams().set('query', params.query);
    
    if (params.urls) httpParams = httpParams.set('urls', params.urls.toString());
    if (params.page) httpParams = httpParams.set('page', params.page.toString());
    if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());

    return this.http.get<ScrapingResponse>(`${this.baseUrl}/search`, { params: httpParams })
      .pipe(
        tap(response => {
          this.updateProgress({ 
            isLoading: false, 
            currentAction: `Found ${response.allEmails.length} emails from ${response.scraping.urlsScraped} websites` 
          });
        }),
        catchError(error => {
          this.updateProgress({ isLoading: false, currentAction: 'Error occurred during scraping' });
          return throwError(() => error);
        })
      );
  }

  /**
   * Comprehensive scraping - scrapes multiple search pages in single request
   */
  searchAllEmails(params: ComprehensiveScrapingParams): Observable<ComprehensiveScrapingResponse> {
    this.updateProgress({ 
      isLoading: true, 
      currentAction: `Starting comprehensive scrape (${params.maxPages || 3} pages)...` 
    });
    
    let httpParams = new HttpParams().set('query', params.query);
    
    if (params.maxPages) httpParams = httpParams.set('maxPages', params.maxPages.toString());
    if (params.urlsPerPage) httpParams = httpParams.set('urlsPerPage', params.urlsPerPage.toString());
    if (params.maxUrls) httpParams = httpParams.set('maxUrls', params.maxUrls.toString());

    return this.http.get<ComprehensiveScrapingResponse>(`${this.baseUrl}/search-all`, { params: httpParams })
      .pipe(
        tap(response => {
          this.updateProgress({ 
            isLoading: false, 
            currentAction: `Completed! Found ${response.summary.totalUniqueEmails} emails in ${response.summary.scrapingDuration}` 
          });
        }),
        catchError(error => {
          this.updateProgress({ isLoading: false, currentAction: 'Error occurred during comprehensive scraping' });
          return throwError(() => error);
        })
      );
  }

  /**
   * Search multiple pages sequentially and accumulate results
   */
  searchMultiplePages(params: ScrapingParams, maxPages: number = 5): Observable<ScrapingResponse[]> {
    this.clearAccumulatedEmails();
    this.updateProgress({ 
      isLoading: true, 
      currentAction: `Starting multi-page search (${maxPages} pages)...` 
    });

    return new Observable(observer => {
      const results: ScrapingResponse[] = [];
      let currentPage = 1;

      const searchNextPage = () => {
        if (currentPage > maxPages) {
          this.updateProgress({ 
            isLoading: false, 
            currentAction: `Completed all ${maxPages} pages!` 
          });
          observer.next(results);
          observer.complete();
          return;
        }

        const pageParams = { ...params, page: currentPage };
        
        this.updateProgress({
          isLoading: true,
          progress: ((currentPage - 1) / maxPages) * 100,
          currentAction: `Searching page ${currentPage}/${maxPages}...`
        });

        this.searchEmails(pageParams).subscribe({
          next: (response) => {
            results.push(response);
            this.accumulateEmails(response.allEmails);
            
            this.updateProgress({
              isLoading: currentPage < maxPages,
              progress: (currentPage / maxPages) * 100,
              currentAction: `Completed page ${currentPage}/${maxPages} - Found ${response.allEmails.length} emails`
            });

            currentPage++;
            
            // Add delay between requests to be respectful
            setTimeout(() => {
              searchNextPage();
            }, 1500); // 1.5 second delay
          },
          error: (error) => {
            this.updateProgress({ isLoading: false, currentAction: 'Error occurred during multi-page search' });
            observer.error(error);
          }
        });
      };

      searchNextPage();
    });
  }

  /**
   * Accumulate emails across multiple paginated requests
   */
  accumulateEmails(newEmails: string[]): void {
    const currentEmails = this.accumulatedEmailsSubject.value;
    const allEmails = [...currentEmails, ...newEmails];
    const uniqueEmails = [...new Set(allEmails)]; // Remove duplicates
    this.accumulatedEmailsSubject.next(uniqueEmails);
  }

  /**
   * Clear accumulated emails
   */
  clearAccumulatedEmails(): void {
    this.accumulatedEmailsSubject.next([]);
  }

  /**
   * Get current accumulated emails
   */
  getCurrentAccumulatedEmails(): string[] {
    return this.accumulatedEmailsSubject.value;
  }

  /**
   * Get health status of scraping endpoints
   */
  getHealthStatus(): Observable<any> {
    return this.http.get(`${this.baseUrl}/health`);
  }

  /**
   * Validate email format
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}$/;
    return emailRegex.test(email);
  }

  /**
   * Filter and clean email list
   */
  cleanEmailList(emails: string[]): string[] {
    return emails
      .filter(email => this.isValidEmail(email))
      .map(email => email.toLowerCase().trim())
      .filter((email, index, arr) => arr.indexOf(email) === index); // Remove duplicates
  }

  /**
   * Export emails to CSV format
   */
  exportEmailsToCSV(emails: string[], filename: string = 'scraped_emails.csv'): void {
    const csvContent = 'Email\n' + emails.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Update scraping progress
   */
  private updateProgress(progress: ScrapingProgress): void {
    this.scrapingProgressSubject.next(progress);
  }

  /**
   * Reset progress state
   */
  resetProgress(): void {
    this.updateProgress({ isLoading: false });
  }
}