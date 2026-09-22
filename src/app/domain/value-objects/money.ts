/**
 * No decorators, no Angular: this folder is plain TypeScript and must be able to run in a
 * Node test without TestBed.
 */
export class Money {
  static readonly DEFAULT_CURRENCY = 'COP';

  private constructor(
    readonly amount: number,
    readonly currency: string,
  ) {}

  static of(amount: number, currency?: string | null): Money {
    if (!Number.isFinite(amount) || amount < 0) {
      throw new Error('El monto no puede ser negativo.');
    }
    return new Money(Math.round(amount * 100) / 100, Money.normalizeCurrency(currency));
  }

  static zero(currency?: string | null): Money {
    return new Money(0, Money.normalizeCurrency(currency));
  }

  plus(other: Money): Money {
    this.assertSameCurrency(other);
    return Money.of(this.amount + other.amount, this.currency);
  }

  times(factor: number): Money {
    return Money.of(this.amount * factor, this.currency);
  }

  isZero(): boolean {
    return this.amount === 0;
  }

  /**
   * D-C10 promises the currency always travels as "COP", and the front end still does not trust
   * it: a report of a range with no sales has to render (CA-06.2), not die on a null.
   */
  private static normalizeCurrency(currency: string | null | undefined): string {
    const normalized = typeof currency === 'string' ? currency.trim().toUpperCase() : '';
    return normalized === '' ? Money.DEFAULT_CURRENCY : normalized;
  }

  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new Error(`No se pueden operar montos en ${this.currency} y ${other.currency}.`);
    }
  }
}
