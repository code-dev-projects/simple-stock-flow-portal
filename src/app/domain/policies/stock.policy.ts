import { Product } from '../models/product.model';

/**
 * Stock rules duplicated on the client. They do not replace backend validation: they exist
 * to give immediate feedback without a round-trip. The server remains the source of truth.
 */
export const LOW_STOCK_THRESHOLD = 5;

export function canSell(product: Product, quantity: number): boolean {
  return Number.isInteger(quantity) && quantity > 0 && quantity <= product.stock;
}

export function isLowStock(product: Product): boolean {
  return product.stock > 0 && product.stock <= LOW_STOCK_THRESHOLD;
}

export function isOutOfStock(product: Product): boolean {
  return product.stock <= 0;
}
