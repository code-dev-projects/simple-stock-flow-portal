import { DATE_PIPE_DEFAULT_OPTIONS } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SalesReportDto } from '../../../../infrastructure/http/dto/api.dto';
import { infrastructureProviders } from '../../../../infrastructure/providers';
import { SalesReportPage } from './sales-report.page';

function fillDate(fixture: ComponentFixture<SalesReportPage>, position: number, value: string): void {
  const inputs: NodeListOf<HTMLInputElement> =
    fixture.nativeElement.querySelectorAll('input[type="date"]');
  const input = inputs[position];
  input.value = value;
  input.dispatchEvent(new Event('input'));
}

function submit(fixture: ComponentFixture<SalesReportPage>): void {
  const form: HTMLFormElement = fixture.nativeElement.querySelector('form');
  form.dispatchEvent(new Event('submit'));
}

describe('SalesReportPage', () => {
  let fixture: ComponentFixture<SalesReportPage>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalesReportPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        // Bogotá, UTC-5. Pinned so the suite reproduces the shift that hides the first day of a
        // range; in UTC every assertion below passes whether or not the page got it right.
        { provide: DATE_PIPE_DEFAULT_OPTIONS, useValue: { timezone: '-0500' } },
        ...infrastructureProviders,
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(SalesReportPage);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('asks for the day after the last day chosen, because to is exclusive (D-C2)', () => {
    fillDate(fixture, 0, '2026-01-01');
    fillDate(fixture, 1, '2026-01-31');
    submit(fixture);

    const request = httpMock.expectOne((candidate) => candidate.url === '/api/reports/sales');

    expect(request.request.params.get('from')).toBe('2026-01-01T00:00:00.000Z');
    expect(request.request.params.get('to')).toBe('2026-02-01T00:00:00.000Z');

    request.flush(emptyReport('2026-01-01T00:00:00+00:00', '2026-02-01T00:00:00+00:00'));
  });

  it('reads back the last day included, not the exclusive bound that travelled', async () => {
    fillDate(fixture, 0, '2026-01-01');
    fillDate(fixture, 1, '2026-01-31');
    submit(fixture);

    httpMock
      .expectOne((candidate) => candidate.url === '/api/reports/sales')
      .flush(emptyReport('2026-01-01T00:00:00+00:00', '2026-02-01T00:00:00+00:00'));

    await fixture.whenStable();
    fixture.detectChanges();

    const summary: string = fixture.nativeElement.textContent;
    expect(summary).toContain('1/31/26');
    expect(summary).not.toContain('2/1/26');
  });

  it('renders the empty report even if currency does not travel (CA-06.2, D-C10)', async () => {
    fillDate(fixture, 0, '2026-01-01');
    fillDate(fixture, 1, '2026-01-31');
    submit(fixture);

    const withoutCurrency = {
      from: '2026-01-01T00:00:00+00:00',
      to: '2026-02-01T00:00:00+00:00',
      salesCount: 0,
      grandTotal: 0,
      currency: null,
      rows: [],
    } as unknown as SalesReportDto;

    httpMock
      .expectOne((candidate) => candidate.url === '/api/reports/sales')
      .flush(withoutCurrency);

    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Sin movimientos en el rango.');
  });

  it('names the calendar days that were picked, not the ones a negative timezone shifts them to', async () => {
    fillDate(fixture, 0, '2026-09-01');
    fillDate(fixture, 1, '2026-09-30');
    submit(fixture);

    httpMock
      .expectOne((candidate) => candidate.url === '/api/reports/sales')
      .flush(emptyReport('2026-09-01T00:00:00+00:00', '2026-10-01T00:00:00+00:00'));

    await fixture.whenStable();
    fixture.detectChanges();

    const summary: string = fixture.nativeElement.textContent;
    expect(summary).toContain('9/1/26');
    expect(summary).toContain('9/30/26');
    expect(summary).not.toContain('8/31/26');
  });

  it('shows the category the sale froze, now that T-11 puts one on every line', async () => {
    fillDate(fixture, 0, '2026-01-01');
    fillDate(fixture, 1, '2026-01-31');
    submit(fixture);

    httpMock.expectOne((candidate) => candidate.url === '/api/reports/sales').flush({
      from: '2026-01-01T00:00:00+00:00',
      to: '2026-02-01T00:00:00+00:00',
      salesCount: 1,
      grandTotal: 240000,
      currency: 'COP',
      rows: [
        {
          productId: '11111111-1111-4111-8111-111111111111',
          productName: 'Taladro',
          categoryName: 'Herramientas',
          unitsSold: 2,
          revenue: 240000,
        },
      ],
    } as SalesReportDto);

    await fixture.whenStable();
    fixture.detectChanges();

    const cells: NodeListOf<HTMLTableCellElement> =
      fixture.nativeElement.querySelectorAll('tbody td');
    expect(cells[1].textContent?.trim()).toBe('Herramientas');

    // The notice that explained the gap has to be gone with it: a warning nobody can trigger is a
    // sentence that only gets read when it is already wrong.
    expect(fixture.nativeElement.querySelector('.alert--info')).toBeNull();
  });
});

function emptyReport(from: string, to: string): SalesReportDto {
  return { from, to, salesCount: 0, grandTotal: 0, currency: 'COP', rows: [] };
}
