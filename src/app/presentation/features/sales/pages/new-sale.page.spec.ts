import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PagedResultDto, ProductDto } from '../../../../infrastructure/http/dto/api.dto';
import { infrastructureProviders } from '../../../../infrastructure/providers';
import { NewSalePage } from './new-sale.page';

describe('NewSalePage', () => {
  let fixture: ComponentFixture<NewSalePage>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewSalePage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        ...infrastructureProviders,
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(NewSalePage);
  });

  afterEach(() => httpMock.verify());

  it('tells the person when the catalogue could not be loaded', async () => {
    fixture.detectChanges();

    httpMock
      .expectOne((candidate) => candidate.url === '/api/products')
      .flush(null, { status: 500, statusText: 'Internal Server Error' });

    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
  });

  it('keeps a product that is out of stock out of the cart', async () => {
    fixture.detectChanges();

    const product: ProductDto = {
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Taladro',
      price: 120000,
      currency: 'COP',
      stock: 0,
      categoryId: '22222222-2222-4222-8222-222222222222',
      categoryName: 'Herramientas',
      imageUrl: null,
    };
    const page: PagedResultDto<ProductDto> = {
      items: [product],
      page: 1,
      size: 20,
      total: 1,
      totalPages: 1,
    };
    httpMock.expectOne((candidate) => candidate.url === '/api/products').flush(page);

    await fixture.whenStable();
    fixture.detectChanges();

    const add: HTMLButtonElement = fixture.nativeElement.querySelector('tbody button');
    expect(add.disabled).toBeTrue();
  });
});
