import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { PagedResult, PageRequest } from '../../domain/models/paged-result.model';
import { Sale } from '../../domain/models/sale.model';
import { DateRange, SaleLineRequest, SaleRepositoryPort } from '../../application/ports/sale-repository.port';
import { environment } from '../../../environments/environment';
import { PagedResultDto, SaleDto } from './dto/api.dto';
import { toSale } from '../mappers/sale.mapper';

@Injectable()
export class HttpSaleRepository extends SaleRepositoryPort {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/sales`;

  async place(lines: readonly SaleLineRequest[]): Promise<string> {
    const created = await firstValueFrom(this.http.post<{ id: string }>(this.baseUrl, { lines }));
    return created.id;
  }

  async getById(id: string): Promise<Sale | null> {
    const dto = await firstValueFrom(this.http.get<SaleDto>(`${this.baseUrl}/${id}`));
    return dto ? toSale(dto) : null;
  }

  async list(range: DateRange, page: PageRequest): Promise<PagedResult<Sale>> {
    const params = new HttpParams()
      .set('from', range.from.toISOString())
      .set('to', range.to.toISOString())
      .set('page', page.page)
      .set('size', page.size);

    const dto = await firstValueFrom(
      this.http.get<PagedResultDto<SaleDto>>(this.baseUrl, { params }),
    );

    return {
      items: dto.items.map(toSale),
      page: dto.page,
      size: dto.size,
      total: dto.total,
      totalPages: dto.totalPages,
    };
  }
}
