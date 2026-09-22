import { PagedResult, PageRequest } from '../../domain/models/paged-result.model';
import { Category, Product, ProductDraft } from '../../domain/models/product.model';

export interface ProductFilter {
  readonly search?: string;
  readonly categoryId?: string;
}

/**
 * Abstract class and not an interface on purpose: in Angular an interface disappears at
 * compile time and cannot act as a DI token. This is what enables
 * { provide: ProductRepositoryPort, useClass: HttpProductRepository }.
 */
export abstract class ProductRepositoryPort {
  abstract list(filter: ProductFilter, page: PageRequest): Promise<PagedResult<Product>>;
  abstract getById(id: string): Promise<Product | null>;
  abstract create(draft: ProductDraft): Promise<string>;
  abstract update(id: string, draft: ProductDraft): Promise<void>;
  abstract remove(id: string): Promise<void>;
  abstract uploadImage(id: string, file: File): Promise<string>;
  abstract listCategories(): Promise<readonly Category[]>;
}
