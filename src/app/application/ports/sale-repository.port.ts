import { PagedResult, PageRequest } from '../../domain/models/paged-result.model';
import { Sale } from '../../domain/models/sale.model';

export interface SaleLineRequest {
  readonly productId: string;
  readonly quantity: number;
}

export interface DateRange {
  readonly from: Date;
  readonly to: Date;
}

export abstract class SaleRepositoryPort {
  abstract place(lines: readonly SaleLineRequest[]): Promise<string>;
  abstract getById(id: string): Promise<Sale | null>;
  abstract list(range: DateRange, page: PageRequest): Promise<PagedResult<Sale>>;
}
