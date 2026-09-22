import { inject, Injectable } from '@angular/core';
import { PagedResult, PageRequest } from '../../domain/models/paged-result.model';
import { Sale } from '../../domain/models/sale.model';
import { DateRange, SaleRepositoryPort } from '../ports/sale-repository.port';

@Injectable({ providedIn: 'root' })
export class ListSalesUseCase {
  private readonly sales = inject(SaleRepositoryPort);

  execute(range: DateRange, page: PageRequest): Promise<PagedResult<Sale>> {
    if (range.to < range.from) {
      throw new Error('La fecha final no puede ser anterior a la inicial.');
    }
    return this.sales.list(range, page);
  }
}
