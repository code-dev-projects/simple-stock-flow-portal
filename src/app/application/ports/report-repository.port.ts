import { SalesReport } from '../../domain/models/sale.model';
import { DateRange } from './sale-repository.port';

export abstract class ReportRepositoryPort {
  abstract salesByRange(range: DateRange): Promise<SalesReport>;
}
