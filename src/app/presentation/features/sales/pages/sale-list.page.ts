import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DEFAULT_PAGE } from '../../../../domain/models/paged-result.model';
import { Sale } from '../../../../domain/models/sale.model';
import { inclusiveEnd, monthToDate } from '../../../../domain/value-objects/date-range';
import { ListSalesUseCase } from '../../../../application/use-cases/list-sales.use-case';
import { MoneyPipe } from '../../../shared/ui/money.pipe';

@Component({
  selector: 'app-sale-list-page',
  standalone: true,
  imports: [DatePipe, MoneyPipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <div class="page-header">
        <div class="page-header__text">
          <h1 class="page-title">Ventas</h1>
          <!-- The bounds are calendar days built in UTC, so they are read back in UTC; the
               instant each sale happened is not, and is left to the reader's own timezone. -->
          <p class="page-subtitle">
            Del {{ range.from | date: 'longDate' : 'UTC' }} al
            {{ lastDay | date: 'longDate' : 'UTC' }}
          </p>
        </div>
        <div class="page-header__actions">
          <a class="btn btn--primary" routerLink="/ventas/nueva">Nueva venta</a>
        </div>
      </div>

      @if (loading()) {
        <p class="loading"><span class="spinner"></span> Cargando las ventas...</p>
      } @else if (error(); as message) {
        <p class="alert alert--error" role="alert">{{ message }}</p>
      } @else if (sales().length === 0) {
        <div class="empty-state">
          <p class="empty-state__title">Sin ventas en el rango</p>
          <p class="empty-state__text">
            Este mes todavía no se ha registrado ninguna venta.
          </p>
          <a class="btn btn--primary" routerLink="/ventas/nueva">Registrar la primera</a>
        </div>
      } @else {
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Vendedor</th>
                <th class="table__num">Ítems</th>
                <th class="table__num">Total</th>
              </tr>
            </thead>
            <tbody>
              @for (sale of sales(); track sale.id) {
                <tr>
                  <td class="table__name">{{ sale.soldAt | date: 'short' }}</td>
                  <td>{{ sale.soldBy }}</td>
                  <td class="table__num">
                    <span class="badge badge--accent">{{ sale.items.length }}</span>
                  </td>
                  <td class="table__num">{{ sale.total | money }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
})
export class SaleListPage implements OnInit {
  private readonly listSales = inject(ListSalesUseCase);

  // D-C2: the upper bound is exclusive, so covering today means asking up to tomorrow.
  protected readonly range = monthToDate(new Date());
  protected readonly lastDay = inclusiveEnd(this.range.to);

  protected readonly sales = signal<readonly Sale[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    try {
      const result = await this.listSales.execute(this.range, DEFAULT_PAGE);
      this.sales.set(result.items);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No se pudieron cargar las ventas.');
    } finally {
      this.loading.set(false);
    }
  }
}
