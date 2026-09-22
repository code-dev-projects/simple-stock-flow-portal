/**
 * Nothing outside infrastructure/ may import these types: the rest of the app works with
 * domain models.
 */

export interface PagedResultDto<T> {
  items: T[];
  page: number;
  size: number;
  total: number;
  totalPages: number;
}

export interface ProductDto {
  id: string;
  name: string;
  price: number;
  currency: string;
  stock: number;
  categoryId: string;
  categoryName: string;
  imageUrl: string | null;
}

export interface CategoryDto {
  id: string;
  name: string;
}

export interface SaleItemDto {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface SaleDto {
  id: string;
  soldAt: string;
  soldBy: string;
  total: number;
  currency: string;
  items: SaleItemDto[];
}

export interface SalesReportRowDto {
  productId: string;
  productName: string;
  categoryName: string;
  unitsSold: number;
  revenue: number;
}

export interface SalesReportDto {
  from: string;
  to: string;
  salesCount: number;
  grandTotal: number;
  currency: string;
  rows: SalesReportRowDto[];
}

export interface AuthResultDto {
  accessToken: string;
  expiresAt: string;
  username: string;
  role: string;
}
