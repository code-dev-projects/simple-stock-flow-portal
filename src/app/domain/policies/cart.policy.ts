import { Money } from '../value-objects/money';

export interface CartLine {
  readonly productId: string;
  readonly productName: string;
  readonly unitPrice: Money;
  readonly quantity: number;
  readonly availableStock: number;
}

export function lineSubtotal(line: CartLine): Money {
  return line.unitPrice.times(line.quantity);
}

export function cartTotal(lines: readonly CartLine[]): Money {
  return lines.reduce((total, line) => total.plus(lineSubtotal(line)), Money.zero());
}

/** Same invariant as the backend Sale aggregate: no lines, no sale. */
export function isConfirmable(lines: readonly CartLine[]): boolean {
  return lines.length > 0 && lines.every((line) => line.quantity > 0 && line.quantity <= line.availableStock);
}
