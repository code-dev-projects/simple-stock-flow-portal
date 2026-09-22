import { DATE_PIPE_DEFAULT_OPTIONS } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PagedResultDto, SaleDto } from '../../../../infrastructure/http/dto/api.dto';
import { infrastructureProviders } from '../../../../infrastructure/providers';
import { SaleListPage } from './sale-list.page';

/** Midnight UTC of the given day offset from today, which is how the contract wants a bound. */
function utcMidnight(dayOffset: number): string {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + dayOffset),
  ).toISOString();
}

function firstOfThisMonthUtc(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

describe('SaleListPage', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SaleListPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        // Bogotá, UTC-5. A sale is an instant, so the day it is shown on has to be the reader's
        // day; pinning the offset is the only way to tell that apart from a UTC rendering.
        { provide: DATE_PIPE_DEFAULT_OPTIONS, useValue: { timezone: '-0500' } },
        ...infrastructureProviders,
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('covers the whole current month including today, with an exclusive upper bound (D-C2)', () => {
    const fixture = TestBed.createComponent(SaleListPage);
    fixture.detectChanges();

    const request = httpMock.expectOne((candidate) => candidate.url === '/api/sales');

    expect(request.request.params.get('from')).toBe(firstOfThisMonthUtc());
    expect(request.request.params.get('to')).toBe(utcMidnight(1));
    expect(request.request.params.get('page')).toBe('1');
    expect(request.request.params.get('size')).toBe('20');

    const page: PagedResultDto<SaleDto> = { items: [], page: 1, size: 20, total: 0, totalPages: 0 };
    request.flush(page);
  });

  it('dates a sale by the instant it happened, read in the local timezone', async () => {
    const fixture = TestBed.createComponent(SaleListPage);
    fixture.detectChanges();

    const sale: SaleDto = {
      id: '11111111-1111-4111-8111-111111111111',
      soldAt: '2026-09-01T02:00:00+00:00',
      soldBy: 'admin',
      total: 240000,
      currency: 'COP',
      items: [],
    };
    const page: PagedResultDto<SaleDto> = {
      items: [sale],
      page: 1,
      size: 20,
      total: 1,
      totalPages: 1,
    };
    httpMock.expectOne((candidate) => candidate.url === '/api/sales').flush(page);

    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('8/31/26');
  });

  it('tells the person when the sales could not be loaded', async () => {
    const fixture = TestBed.createComponent(SaleListPage);
    fixture.detectChanges();

    httpMock
      .expectOne((candidate) => candidate.url === '/api/sales')
      .flush(null, { status: 500, statusText: 'Internal Server Error' });

    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
  });
});
