import { Sale, SalesReport } from '../../domain/models/sale.model';
import { Money } from '../../domain/value-objects/money';
import { Quantity } from '../../domain/value-objects/quantity';
import { SaleDto, SalesReportDto } from '../http/dto/api.dto';

export function toSale(dto: SaleDto): Sale {
  return {
    id: dto.id,
    soldAt: new Date(dto.soldAt),
    soldBy: dto.soldBy,
    total: Money.of(dto.total, dto.currency),
    items: dto.items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      quantity: Quantity.of(item.quantity),
      unitPrice: Money.of(item.unitPrice, dto.currency),
    })),
  };
}

export function toSalesReport(dto: SalesReportDto): SalesReport {
  return {
    from: new Date(dto.from),
    to: new Date(dto.to),
    salesCount: dto.salesCount,
    grandTotal: Money.of(dto.grandTotal, dto.currency),
    rows: dto.rows.map((row) => ({
      productId: row.productId,
      productName: row.productName,
      categoryName: row.categoryName,
      unitsSold: row.unitsSold,
      revenue: Money.of(row.revenue, dto.currency),
    })),
  };
}
