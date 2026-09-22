import { inject, Injectable } from '@angular/core';
import { SalesReport } from '../../domain/models/sale.model';
import { ReportRepositoryPort } from '../ports/report-repository.port';
import { DateRange } from '../ports/sale-repository.port';

@Injectable({ providedIn: 'root' })
export class GetSalesReportUseCase {
  private readonly reports = inject(ReportRepositoryPort);

  execute(range: DateRange): Promise<SalesReport> {
    if (range.to < range.from) {
      throw new Error('La fecha final no puede ser anterior a la inicial.');
    }
    return this.reports.salesByRange(range);
  }
}
