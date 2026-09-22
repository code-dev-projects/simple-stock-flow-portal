import { Money } from './money';

describe('Money', () => {
  it('rejects a negative amount', () => {
    expect(() => Money.of(-1)).toThrowError();
  });

  it('refuses to operate on two currencies', () => {
    expect(() => Money.of(10, 'COP').plus(Money.of(10, 'USD'))).toThrowError();
  });

  it('rounds the amount to two decimals', () => {
    expect(Money.of(10.005).amount).toBe(10.01);
  });

  it('multiplies the amount by a quantity', () => {
    expect(Money.of(1500).times(3).amount).toBe(4500);
  });

  /**
   * D-C10 promises currency always travels as "COP". The report screen must survive the promise
   * being broken (CA-06.2), so the guard is here and not in the caller.
   */
  it('falls back to the default currency when the backend sends null', () => {
    expect(Money.of(1500, null as unknown as string).currency).toBe('COP');
  });

  it('falls back to the default currency when the backend sends an empty string', () => {
    expect(Money.of(1500, '').currency).toBe('COP');
  });

  it('falls back to the default currency on a zero amount too', () => {
    expect(Money.zero(null as unknown as string).currency).toBe('COP');
  });
});
