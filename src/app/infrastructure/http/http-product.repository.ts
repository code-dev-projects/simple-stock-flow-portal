import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { PagedResult, PageRequest } from '../../domain/models/paged-result.model';
import { Category, Product, ProductDraft } from '../../domain/models/product.model';
import { ProductFilter, ProductRepositoryPort } from '../../application/ports/product-repository.port';
import { environment } from '../../../environments/environment';
import { CategoryDto, PagedResultDto, ProductDto } from './dto/api.dto';
import { toCategory, toProduct } from '../mappers/product.mapper';

@Injectable()
export class HttpProductRepository extends ProductRepositoryPort {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/products`;

  async list(filter: ProductFilter, page: PageRequest): Promise<PagedResult<Product>> {
    let params = new HttpParams().set('page', page.page).set('size', page.size);
    if (filter.search) params = params.set('search', filter.search);
    if (filter.categoryId) params = params.set('categoryId', filter.categoryId);

    const dto = await firstValueFrom(
      this.http.get<PagedResultDto<ProductDto>>(this.baseUrl, { params }),
    );

    return {
      items: dto.items.map(toProduct),
      page: dto.page,
      size: dto.size,
      total: dto.total,
      totalPages: dto.totalPages,
    };
  }

  async getById(id: string): Promise<Product | null> {
    const dto = await firstValueFrom(this.http.get<ProductDto>(`${this.baseUrl}/${id}`));
    return dto ? toProduct(dto) : null;
  }

  async create(draft: ProductDraft): Promise<string> {
    const created = await firstValueFrom(this.http.post<{ id: string }>(this.baseUrl, draft));
    return created.id;
  }

  async update(id: string, draft: ProductDraft): Promise<void> {
    await firstValueFrom(this.http.put<void>(`${this.baseUrl}/${id}`, draft));
  }

  async remove(id: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.baseUrl}/${id}`));
  }

  async uploadImage(id: string, file: File): Promise<string> {
    const form = new FormData();
    form.append('file', file, file.name);

    const result = await firstValueFrom(
      this.http.post<{ url: string }>(`${this.baseUrl}/${id}/image`, form),
    );

    return result.url;
  }

  async listCategories(): Promise<readonly Category[]> {
    const dtos = await firstValueFrom(
      this.http.get<CategoryDto[]>(`${environment.apiUrl}/categories`),
    );
    return dtos.map(toCategory);
  }
}
