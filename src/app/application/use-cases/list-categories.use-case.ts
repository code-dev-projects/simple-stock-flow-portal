import { inject, Injectable } from '@angular/core';
import { Category } from '../../domain/models/product.model';
import { ProductRepositoryPort } from '../ports/product-repository.port';

@Injectable({ providedIn: 'root' })
export class ListCategoriesUseCase {
  private readonly products = inject(ProductRepositoryPort);

  execute(): Promise<readonly Category[]> {
    return this.products.listCategories();
  }
}
