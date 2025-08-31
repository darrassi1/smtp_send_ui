import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmailScrapingComponent } from './email-scraping.component';

describe('EmailScrapingComponent', () => {
  let component: EmailScrapingComponent;
  let fixture: ComponentFixture<EmailScrapingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EmailScrapingComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmailScrapingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
