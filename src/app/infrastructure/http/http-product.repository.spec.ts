import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ProductRepositoryPort } from '../../application/ports/product-repository.port';
import { CategoryDto, PagedResultDto, ProductDto } from './dto/api.dto';
import { infrastructureProviders } from '../providers';

/** The five seeded categories, in the order the contract fixes for E-09. */
const SEEDED_CATEGORIES: CategoryDto[] = [
  { id: '33333333-3333-4333-8333-333333333333', name: 'Electricidad' },
  { id: '44444444-4444-4444-8444-444444444444', name: 'Fontanería' },
  { id: '11111111-1111-4111-8111-111111111111', name: 'General' },
  { id: '22222222-2222-4222-8222-222222222222', name: 'Herramientas' },
  { id: '55555555-5555-4555-8555-555555555555', name: 'Pinturas' },
];

describe('HttpProductRepository', () => {
  let repository: ProductRepositoryPort;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), ...infrastructureProviders],
    });

    repository = TestBed.inject(ProductRepositoryPort);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('reads the categories as a flat array, unpaged and unsorted by the client (D-C1)', async () => {
    const pending = repository.listCategories();

    const request = httpMock.expectOne('/api/categories');
    expect(request.request.method).toBe('GET');
    expect(request.request.params.keys().length).toBe(0);
    request.flush(SEEDED_CATEGORIES);

    const categories = await pending;

    expect(categories.map((category) => category.name)).toEqual([
      'Electricidad',
      'Fontanería',
      'General',
      'Herramientas',
      'Pinturas',
    ]);
    expect(categories[0].id).toBe('33333333-3333-4333-8333-333333333333');
  });

  it('accepts an empty category list as 200 with an empty array (D-C1)', async () => {
    const pending = repository.listCategories();
    httpMock.expectOne('/api/categories').flush([]);

    expect(await pending).toEqual([]);
  });

  it('keeps the size and totalPages the backend served, not the ones requested (D-C5)', async () => {
    const pending = repository.list({}, { page: 1, size: 500 });

    const request = httpMock.expectOne((candidate) => candidate.url === '/api/products');
    expect(request.request.params.get('size')).toBe('500');

    const served: PagedResultDto<ProductDto> = {
      items: [],
      page: 1,
      size: 100,
      total: 250,
      totalPages: 3,
    };
    request.flush(served);

    const result = await pending;
    expect(result.size).toBe(100);
    expect(result.totalPages).toBe(3);
  });

  it('maps a product with no image to a null imageUrl', async () => {
    const pending = repository.getById('11111111-1111-4111-8111-111111111111');

    const dto: ProductDto = {
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Martillo',
      price: 35900.5,
      currency: 'COP',
      stock: 7,
      categoryId: '22222222-2222-4222-8222-222222222222',
      categoryName: 'Herramientas',
      imageUrl: null,
    };
    httpMock
      .expectOne('/api/products/11111111-1111-4111-8111-111111111111')
      .flush(dto);

    const product = await pending;
    expect(product?.imageUrl).toBeNull();
    expect(product?.price.amount).toBe(35900.5);
    expect(product?.price.currency).toBe('COP');
  });
});
