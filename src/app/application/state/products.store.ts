import { inject, Injectable, signal } from '@angular/core';
import { DEFAULT_PAGE, PageRequest } from '../../domain/models/paged-result.model';
import { Product } from '../../domain/models/product.model';
import { ProductFilter } from '../ports/product-repository.port';
import { ListProductsUseCase } from '../use-cases/list-products.use-case';

@Injectable({ providedIn: 'root' })
export class ProductsStore {
  private readonly listProducts = inject(ListProductsUseCase);

  private readonly _items = signal<readonly Product[]>([]);
  private readonly _total = signal(0);
  private readonly _page = signal<PageRequest>(DEFAULT_PAGE);
  private readonly _totalPages = signal(0);
  private readonly _filter = signal<ProductFilter>({});
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly items = this._items.asReadonly();
  readonly total = this._total.asReadonly();
  readonly page = this._page.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly totalPages = this._totalPages.asReadonly();

  async load(filter: ProductFilter = this._filter(), page: PageRequest = this._page()): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const result = await this.listProducts.execute(filter, page);
      this._items.set(result.items);
      this._total.set(result.total);
      this._totalPages.set(result.totalPages);
      this._filter.set(filter);
      // D-C5: the backend clamps page and size, so what paginates is what it served, not what
      // was asked for. Asking for 500 and paginating by 500 would skip rows.
      this._page.set({ page: result.page, size: result.size });
    } catch (error) {
      this._error.set(error instanceof Error ? error.message : 'No se pudo cargar el catálogo.');
    } finally {
      this._loading.set(false);
    }
  }
}
