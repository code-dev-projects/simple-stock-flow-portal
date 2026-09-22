import { computed, Injectable, signal } from '@angular/core';
import { Product } from '../../domain/models/product.model';
import { cartTotal, CartLine, isConfirmable } from '../../domain/policies/cart.policy';
import { canSell } from '../../domain/policies/stock.policy';

/**
 * The store holds state and delegates EVERY rule to domain/policies: business arithmetic
 * showing up here means it is in the wrong place.
 */
@Injectable({ providedIn: 'root' })
export class CartStore {
  private readonly _lines = signal<readonly CartLine[]>([]);

  readonly lines = this._lines.asReadonly();
  readonly total = computed(() => cartTotal(this._lines()));
  readonly count = computed(() => this._lines().length);
  readonly confirmable = computed(() => isConfirmable(this._lines()));

  add(product: Product, quantity: number): void {
    if (!canSell(product, quantity)) {
      throw new Error(`Cantidad no válida para ${product.name}.`);
    }

    this._lines.update((lines) => {
      if (lines.some((line) => line.productId === product.id)) {
        return lines.map((line) =>
          line.productId === product.id ? { ...line, quantity: line.quantity + quantity } : line,
        );
      }

      return [
        ...lines,
        {
          productId: product.id,
          productName: product.name,
          unitPrice: product.price,
          quantity,
          availableStock: product.stock,
        },
      ];
    });
  }

  changeQuantity(productId: string, quantity: number): void {
    this._lines.update((lines) =>
      lines.map((line) => (line.productId === productId ? { ...line, quantity } : line)),
    );
  }

  remove(productId: string): void {
    this._lines.update((lines) => lines.filter((line) => line.productId !== productId));
  }

  clear(): void {
    this._lines.set([]);
  }
}
