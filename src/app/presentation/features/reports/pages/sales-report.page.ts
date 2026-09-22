import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SalesReport } from '../../../../domain/models/sale.model';
import { dayRange, inclusiveEnd } from '../../../../domain/value-objects/date-range';
import { GetSalesReportUseCase } from '../../../../application/use-cases/get-sales-report.use-case';
import { MoneyPipe } from '../../../shared/ui/money.pipe';

@Component({
  selector: 'app-sales-report-page',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe, MoneyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <div class="page-header">
        <div class="page-header__text">
          <h1 class="page-title">Reporte de ventas</h1>
          <p class="page-subtitle">Unidades vendidas e ingresos por producto en el rango que elijas.</p>
        </div>
      </div>

      <form class="toolbar" [formGroup]="form" (ngSubmit)="run()">
        <label class="field">
          <span class="field__label">Desde</span>
          <input type="date" formControlName="from" />
        </label>
        <label class="field">
          <span class="field__label">Hasta</span>
          <input type="date" formControlName="to" />
        </label>
        <button class="btn btn--primary" type="submit" [disabled]="form.invalid || loading()">
          {{ loading() ? 'Generando...' : 'Generar' }}
        </button>
      </form>

      @if (loading()) {
        <p class="loading"><span class="spinner"></span> Generando el reporte...</p>
      } @else if (error(); as message) {
        <p class="alert alert--error" role="alert">{{ message }}</p>
      } @else if (report(); as data) {
        <div class="stats">
          <div class="stat">
            <span class="stat__label">Período</span>
            <!-- from and to are the calendar days the person picked, built in UTC. Read back in
                 the browser's timezone they slide a day west and name a range nobody asked for. -->
            <span class="stat__value period">
              {{ data.from | date: 'shortDate' : 'UTC' }} a
              {{ lastDayOf(data.to) | date: 'shortDate' : 'UTC' }}
            </span>
          </div>
          <div class="stat">
            <span class="stat__label">Ventas</span>
            <span class="stat__value">{{ data.salesCount }}</span>
          </div>
          <div class="stat">
            <span class="stat__label">Productos</span>
            <span class="stat__value">{{ data.rows.length }}</span>
          </div>
          <div class="stat">
            <span class="stat__label">Ingresos</span>
            <span class="stat__value">{{ data.grandTotal | money }}</span>
          </div>
        </div>

        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Categoría</th>
                <th class="table__num">Unidades</th>
                <th class="table__num">Ingresos</th>
              </tr>
            </thead>
            <tbody>
              @for (row of data.rows; track row.productId) {
                <tr>
                  <td class="table__name">{{ row.productName }}</td>
                  <td>
                    @if (row.categoryName) {
                      <span class="badge badge--neutral">{{ row.categoryName }}</span>
                    } @else {
                      <span class="muted" title="Sin categoría">—</span>
                    }
                  </td>
                  <td class="table__num">{{ row.unitsSold }}</td>
                  <td class="table__num">{{ row.revenue | money }}</td>
                </tr>
              } @empty {
                <tr>
                  <td class="table__empty" colspan="4">Sin movimientos en el rango.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else {
        <div class="empty-state">
          <p class="empty-state__title">Todavía no has generado ningún reporte</p>
          <p class="empty-state__text">
            Elige una fecha de inicio y una de fin, y pulsa Generar.
          </p>
        </div>
      }
    </div>
  `,
  styles: `
    /* The period is two dates, not one figure: it needs to wrap instead of overflowing its card. */
    .period {
      font-size: var(--text-md);
    }
  `,
})
export class SalesReportPage {
  private readonly getReport = inject(GetSalesReportUseCase);

  protected readonly lastDayOf = inclusiveEnd;

  protected readonly report = signal<SalesReport | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    from: ['', Validators.required],
    to: ['', Validators.required],
  });

  protected async run(): Promise<void> {
    if (this.form.invalid) return;

    this.loading.set(true);
    this.error.set(null);

    try {
      const { from, to } = this.form.getRawValue();
      this.report.set(await this.getReport.execute(dayRange(from, to)));
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No se pudo generar el reporte.');
    } finally {
      this.loading.set(false);
    }
  }
}
