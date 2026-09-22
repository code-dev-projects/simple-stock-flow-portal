import { Money } from '../value-objects/money';
import { Quantity } from '../value-objects/quantity';

export interface SaleItem {
  readonly productId: string;
  readonly productName: string;
  readonly quantity: Quantity;
  readonly unitPrice: Money;
}

export interface Sale {
  readonly id: string;
  readonly soldAt: Date;
  readonly soldBy: string;
  readonly total: Money;
  readonly items: readonly SaleItem[];
}

export interface SalesReportRow {
  readonly productId: string;
  readonly productName: string;
  readonly categoryName: string;
  readonly unitsSold: number;
  readonly revenue: Money;
}

export interface SalesReport {
  readonly from: Date;
  readonly to: Date;
  readonly salesCount: number;
  readonly grandTotal: Money;
  readonly rows: readonly SalesReportRow[];
}
