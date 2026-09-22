import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DEFAULT_PAGE } from '../../../../domain/models/paged-result.model';
import { lineSubtotal } from '../../../../domain/policies/cart.policy';
import { CartStore } from '../../../../application/state/cart.store';
import { ProductsStore } from '../../../../application/state/products.store';
import { PlaceSaleUseCase } from '../../../../application/use-cases/place-sale.use-case';
import { MoneyPipe } from '../../../shared/ui/money.pipe';

@Component({
  selector: 'app-new-sale-page',
  standalone: true,
  imports: [MoneyPipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <div class="page-header">
        <div class="page-header__text">
          <h1 class="page-title">Nueva venta</h1>
          <p class="page-subtitle">
            Agrega productos del catálogo, ajusta las cantidades y confirma.
          </p>
        </div>
        <div class="page-header__actions">
          <a class="btn btn--secondary" routerLink="/ventas">Ver ventas</a>
        </div>
      </div>

      <div class="sale">
        <section class="card">
          <div class="card__header">
            <h2 class="card__title">Catálogo</h2>
            <span class="badge badge--neutral">{{ products.items().length }} productos</span>
          </div>

          @if (products.loading()) {
            <p class="loading"><span class="spinner"></span> Cargando el catálogo...</p>
          } @else if (products.error(); as message) {
            <div class="card__body">
              <p class="alert alert--error" role="alert">{{ message }}</p>
            </div>
          } @else {
            <div class="table-wrap table-wrap--scroll">
              <table class="table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th class="table__num">Precio</th>
                    <th class="table__num">Stock</th>
                    <th class="table__actions"><span class="visually-hidden">Agregar</span></th>
                  </tr>
                </thead>
                <tbody>
                  @for (product of products.items(); track product.id) {
                    <tr>
                      <td class="table__name">{{ product.name }}</td>
                      <td class="table__num">{{ product.price | money }}</td>
                      <td class="table__num">
                        <span
                          class="badge"
                          [class.badge--danger]="product.stock <= 0"
                          [class.badge--success]="product.stock > 0"
                          >{{ product.stock }}</span
                        >
                      </td>
                      <td class="table__actions">
                        <button
                          class="btn btn--secondary btn--sm"
                          type="button"
                          [disabled]="product.stock <= 0"
                          [attr.aria-label]="'Agregar ' + product.name + ' al carrito'"
                          (click)="add(product.id)"
                        >
                          Agregar
                        </button>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td class="table__empty" colspan="4">No hay productos para vender.</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </section>

        <section class="card">
          <div class="card__header">
            <h2 class="card__title">Carrito</h2>
            <span class="badge badge--count" [class.badge--accent]="cart.count() > 0">
              {{ cart.count() }}
            </span>
          </div>

          <div class="card__body">
            @if (cart.lines().length === 0) {
              <div class="empty-state">
                <p class="empty-state__title">El carrito está vacío</p>
                <p class="empty-state__text">
                  Agrega productos del catálogo para poder confirmar la venta.
                </p>
              </div>
            } @else {
              <div class="table-wrap">
                <table class="table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th class="table__num">Cantidad</th>
                      <th class="table__num">Subtotal</th>
                      <th class="table__actions"><span class="visually-hidden">Quitar</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (line of cart.lines(); track line.productId) {
                      <tr>
                        <td class="table__name">{{ line.productName }}</td>
                        <td class="table__num">
                          <input
                            class="quantity"
                            type="number"
                            min="1"
                            [max]="line.availableStock"
                            [value]="line.quantity"
                            [attr.aria-label]="'Cantidad de ' + line.productName"
                            (change)="changeQuantity(line.productId, $event)"
                          />
                          @if (line.quantity > line.availableStock) {
                            <span class="field__error">
                              Solo quedan {{ line.availableStock }}.
                            </span>
                          }
                        </td>
                        <td class="table__num">{{ subtotal(line) | money }}</td>
                        <td class="table__actions">
                          <button
                            class="btn btn--ghost btn--sm"
                            type="button"
                            [attr.aria-label]="'Quitar ' + line.productName + ' del carrito'"
                            (click)="cart.remove(line.productId)"
                          >
                            Quitar
                          </button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }

            @if (error(); as message) {
              <p class="alert alert--error" role="alert">{{ message }}</p>
            }
          </div>

          <div class="card__footer">
            <div class="cluster">
              <span class="muted">Total</span>
              <span class="strong num">{{ cart.total() | money }}</span>
              <span class="spacer"></span>
              <button
                class="btn btn--primary"
                type="button"
                [disabled]="!cart.confirmable() || saving()"
                (click)="confirm()"
              >
                {{ saving() ? 'Registrando...' : 'Confirmar venta' }}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  `,
  styles: `
    .sale {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      align-items: start;
      gap: var(--space-6);
    }
    @media (min-width: 62rem) {
      .sale {
        grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
      }
    }
    .quantity {
      width: 5.5rem;
      margin-left: auto;
      text-align: right;
    }
  `,
})
export class NewSalePage implements OnInit {
  protected readonly products = inject(ProductsStore);
  protected readonly cart = inject(CartStore);
  private readonly placeSale = inject(PlaceSaleUseCase);
  private readonly router = inject(Router);

  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly subtotal = lineSubtotal;

  ngOnInit(): void {
    void this.products.load({}, DEFAULT_PAGE);
  }

  protected add(productId: string): void {
    const product = this.products.items().find((candidate) => candidate.id === productId);
    if (product) {
      this.cart.add(product, 1);
    }
  }

  protected changeQuantity(productId: string, event: Event): void {
    this.cart.changeQuantity(productId, Number((event.target as HTMLInputElement).value));
  }

  protected async confirm(): Promise<void> {
    this.saving.set(true);
    this.error.set(null);

    try {
      await this.placeSale.execute(this.cart.lines());
      this.cart.clear();
      await this.router.navigate(['/ventas']);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No se pudo registrar la venta.');
    } finally {
      this.saving.set(false);
    }
  }
}
