import { inject, Injectable } from '@angular/core';
import { ProductDraft } from '../../domain/models/product.model';
import { ProductRepositoryPort } from '../ports/product-repository.port';

@Injectable({ providedIn: 'root' })
export class SaveProductUseCase {
  private readonly products = inject(ProductRepositoryPort);

  async execute(draft: ProductDraft, id?: string, image?: File): Promise<string> {
    const productId = id ? (await this.products.update(id, draft), id) : await this.products.create(draft);

    if (image) {
      await this.products.uploadImage(productId, image);
    }

    return productId;
  }
}
