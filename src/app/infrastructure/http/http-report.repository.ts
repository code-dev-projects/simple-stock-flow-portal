import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { SalesReport } from '../../domain/models/sale.model';
import { ReportRepositoryPort } from '../../application/ports/report-repository.port';
import { DateRange } from '../../application/ports/sale-repository.port';
import { environment } from '../../../environments/environment';
import { SalesReportDto } from './dto/api.dto';
import { toSalesReport } from '../mappers/sale.mapper';

@Injectable()
export class HttpReportRepository extends ReportRepositoryPort {
  private readonly http = inject(HttpClient);

  async salesByRange(range: DateRange): Promise<SalesReport> {
    const params = new HttpParams()
      .set('from', range.from.toISOString())
      .set('to', range.to.toISOString());

    const dto = await firstValueFrom(
      this.http.get<SalesReportDto>(`${environment.apiUrl}/reports/sales`, { params }),
    );

    return toSalesReport(dto);
  }
}
