import { inject, Injectable } from '@angular/core';
import { PagedResult, PageRequest } from '../../domain/models/paged-result.model';
import { Product } from '../../domain/models/product.model';
import { ProductFilter, ProductRepositoryPort } from '../ports/product-repository.port';

@Injectable({ providedIn: 'root' })
export class ListProductsUseCase {
  private readonly products = inject(ProductRepositoryPort);

  execute(filter: ProductFilter, page: PageRequest): Promise<PagedResult<Product>> {
    return this.products.list(filter, page);
  }
}
