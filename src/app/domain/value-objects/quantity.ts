export class Quantity {
  private constructor(readonly value: number) {}

  static of(value: number): Quantity {
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error('La cantidad debe ser un entero mayor a cero.');
    }
    return new Quantity(value);
  }
}
