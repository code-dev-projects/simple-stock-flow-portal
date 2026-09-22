import { TestBed } from '@angular/core/testing';
import { PagedResult, PageRequest } from '../../domain/models/paged-result.model';
import { Category, Product, ProductDraft } from '../../domain/models/product.model';
import { ProductFilter, ProductRepositoryPort } from '../ports/product-repository.port';
import { ProductsStore } from './products.store';

class StubProductRepository extends ProductRepositoryPort {
  served: PagedResult<Product> = { items: [], page: 1, size: 20, total: 0, totalPages: 0 };
  lastRequest?: PageRequest;

  list(_filter: ProductFilter, page: PageRequest): Promise<PagedResult<Product>> {
    this.lastRequest = page;
    return Promise.resolve(this.served);
  }
  getById(): Promise<Product | null> {
    return Promise.reject(new Error('not used in this test'));
  }
  create(_draft: ProductDraft): Promise<string> {
    return Promise.reject(new Error('not used in this test'));
  }
  update(): Promise<void> {
    return Promise.reject(new Error('not used in this test'));
  }
  remove(): Promise<void> {
    return Promise.reject(new Error('not used in this test'));
  }
  uploadImage(): Promise<string> {
    return Promise.reject(new Error('not used in this test'));
  }
  listCategories(): Promise<readonly Category[]> {
    return Promise.reject(new Error('not used in this test'));
  }
}

describe('ProductsStore', () => {
  let store: ProductsStore;
  let repository: StubProductRepository;

  beforeEach(() => {
    repository = new StubProductRepository();
    TestBed.configureTestingModule({
      providers: [{ provide: ProductRepositoryPort, useValue: repository }],
    });
    store = TestBed.inject(ProductsStore);
  });

  it('paginates with the size the backend served, not the one asked for (D-C5)', async () => {
    repository.served = { items: [], page: 1, size: 100, total: 250, totalPages: 3 };

    await store.load({}, { page: 1, size: 500 });

    expect(repository.lastRequest?.size).toBe(500);
    expect(store.page().size).toBe(100);
    expect(store.totalPages()).toBe(3);
  });

  it('trusts the page number the backend served (D-C5)', async () => {
    repository.served = { items: [], page: 1, size: 20, total: 5, totalPages: 1 };

    await store.load({}, { page: 0, size: 20 });

    expect(store.page().page).toBe(1);
  });

  it('shows no pages at all when the backend reports none (D-C11)', async () => {
    repository.served = { items: [], page: 1, size: 20, total: 0, totalPages: 0 };

    await store.load({}, { page: 1, size: 20 });

    expect(store.totalPages()).toBe(0);
  });
});
