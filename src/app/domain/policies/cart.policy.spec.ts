import { Money } from '../value-objects/money';
import { CartLine, cartTotal, isConfirmable, lineSubtotal } from './cart.policy';

function aLine(overrides: Partial<CartLine> = {}): CartLine {
  return {
    productId: 'p1',
    productName: 'Mouse',
    unitPrice: Money.of(50000),
    quantity: 2,
    availableStock: 5,
    ...overrides,
  };
}

describe('cart.policy', () => {
  it('computes the subtotal of a line', () => {
    expect(lineSubtotal(aLine()).amount).toBe(100000);
  });

  it('adds up the total of the cart', () => {
    const lines = [aLine(), aLine({ productId: 'p2', unitPrice: Money.of(120000), quantity: 1 })];
    expect(cartTotal(lines).amount).toBe(220000);
  });

  it('is not confirmable when the cart is empty', () => {
    expect(isConfirmable([])).toBe(false);
  });

  it('is not confirmable when a line exceeds the available stock', () => {
    expect(isConfirmable([aLine({ quantity: 9, availableStock: 5 })])).toBe(false);
  });

  it('is confirmable with valid lines', () => {
    expect(isConfirmable([aLine()])).toBe(true);
  });
});
