import { inject, Injectable } from '@angular/core';
import { Product } from '../../domain/models/product.model';
import { ProductRepositoryPort } from '../ports/product-repository.port';

@Injectable({ providedIn: 'root' })
export class GetProductUseCase {
  private readonly products = inject(ProductRepositoryPort);

  execute(id: string): Promise<Product | null> {
    return this.products.getById(id);
  }
}
