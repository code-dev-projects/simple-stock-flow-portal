import { inject, Injectable } from '@angular/core';
import { CartLine, isConfirmable } from '../../domain/policies/cart.policy';
import { SaleLineRequest, SaleRepositoryPort } from '../ports/sale-repository.port';

/** Exists so the component never talks to the port itself. */
@Injectable({ providedIn: 'root' })
export class PlaceSaleUseCase {
  private readonly sales = inject(SaleRepositoryPort);

  async execute(lines: readonly CartLine[]): Promise<string> {
    if (!isConfirmable(lines)) {
      throw new Error('La venta no es confirmable: revisa cantidades y stock disponible.');
    }

    const payload: SaleLineRequest[] = lines.map((line) => ({
      productId: line.productId,
      quantity: line.quantity,
    }));

    return this.sales.place(payload);
  }
}
