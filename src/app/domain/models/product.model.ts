import { Money } from '../value-objects/money';

export interface Category {
  readonly id: string;
  readonly name: string;
}

export interface Product {
  readonly id: string;
  readonly name: string;
  readonly price: Money;
  readonly stock: number;
  readonly categoryId: string;
  readonly categoryName: string;
  readonly imageUrl: string | null;
}

export interface ProductDraft {
  readonly name: string;
  readonly price: number;
  readonly stock: number;
  readonly categoryId: string;
}
