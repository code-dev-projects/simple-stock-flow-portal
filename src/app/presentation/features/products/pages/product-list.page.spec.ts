import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PagedResultDto, ProductDto } from '../../../../infrastructure/http/dto/api.dto';
import { infrastructureProviders } from '../../../../infrastructure/providers';
import { ProductListPage } from './product-list.page';

function productDto(overrides: Partial<ProductDto> = {}): ProductDto {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Taladro',
    price: 120000,
    currency: 'COP',
    stock: 12,
    categoryId: '22222222-2222-4222-8222-222222222222',
    categoryName: 'Herramientas',
    imageUrl: null,
    ...overrides,
  };
}

describe('ProductListPage', () => {
  let fixture: ComponentFixture<ProductListPage>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductListPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        ...infrastructureProviders,
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ProductListPage);
  });

  afterEach(() => httpMock.verify());

  async function showing(...products: ProductDto[]): Promise<void> {
    fixture.detectChanges();

    const page: PagedResultDto<ProductDto> = {
      items: products,
      page: 1,
      size: 20,
      total: products.length,
      totalPages: 1,
    };
    httpMock.expectOne((candidate) => candidate.url === '/api/products').flush(page);

    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('shows the picture the API serves for the product (CA-03.1)', async () => {
    await showing(productDto({ imageUrl: '/media/9f2ca1.jpg' }));

    const image: HTMLImageElement | null = fixture.nativeElement.querySelector('tbody img');

    expect(image?.getAttribute('src')).toBe('/media/9f2ca1.jpg');
    expect(image?.getAttribute('alt')).toContain('Taladro');
    expect(image?.getAttribute('loading')).toBe('lazy');
  });

  it('draws a placeholder instead of a broken image when there is none (CA-03.2)', async () => {
    await showing(productDto({ imageUrl: null }));

    expect(fixture.nativeElement.querySelector('tbody img')).toBeNull();
    expect(fixture.nativeElement.querySelector('tbody .thumb--empty')).not.toBeNull();
  });

  it('falls back to the placeholder when the picture the API points at cannot be drawn', async () => {
    await showing(productDto({ imageUrl: '/media/corrupta.webp' }));

    const image: HTMLImageElement = fixture.nativeElement.querySelector('tbody img');
    image.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('tbody img')).toBeNull();
    expect(fixture.nativeElement.querySelector('tbody .thumb--empty')).not.toBeNull();
  });

  it('separates low stock from no stock without making the reader read the number', async () => {
    await showing(
      productDto({ id: '11111111-1111-4111-8111-111111111111', stock: 3 }),
      productDto({ id: '22222222-2222-4222-8222-222222222222', stock: 0 }),
    );

    expect(fixture.nativeElement.querySelector('.badge--warning')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.badge--danger')).not.toBeNull();
  });
});
