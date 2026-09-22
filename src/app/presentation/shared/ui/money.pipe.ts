import { Pipe, PipeTransform } from '@angular/core';
import { Money } from '../../../domain/value-objects/money';

@Pipe({ name: 'money' })
export class MoneyPipe implements PipeTransform {
  transform(value: Money | null | undefined): string {
    if (!value) return '';

    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: value.currency,
      maximumFractionDigits: 2,
    }).format(value.amount);
  }
}
