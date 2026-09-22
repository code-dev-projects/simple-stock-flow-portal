import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DEFAULT_PAGE } from '../../../../domain/models/paged-result.model';
import { isLowStock, isOutOfStock } from '../../../../domain/policies/stock.policy';
import { ProductsStore } from '../../../../application/state/products.store';
import { SessionStore } from '../../../../application/state/session.store';
import { MoneyPipe } from '../../../shared/ui/money.pipe';
import { Paginator } from '../../../shared/ui/paginator';

@Component({
  selector: 'app-product-list-page',
  standalone: true,
  imports: [RouterLink, MoneyPipe, Paginator],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <div class="page-header">
        <div class="page-header__text">
          <h1 class="page-title">Productos</h1>
          @if (!store.loading()) {
            <p class="page-subtitle">
              {{ store.total() }} {{ store.total() === 1 ? 'producto' : 'productos' }} en el
              catálogo
            </p>
          }
        </div>
        @if (session.hasRole('admin')) {
          <div class="page-header__actions">
            <a class="btn btn--primary" routerLink="/productos/nuevo">Nuevo producto</a>
          </div>
        }
      </div>

      @if (store.loading()) {
        <p class="loading"><span class="spinner"></span> Cargando el catálogo...</p>
      } @else if (store.error(); as message) {
        <p class="alert alert--error" role="alert">{{ message }}</p>
      } @else if (store.items().length === 0) {
        <div class="empty-state">
          <p class="empty-state__title">Todavía no hay productos</p>
          <p class="empty-state__text">
            El catálogo está vacío. Crea el primer producto para poder venderlo.
          </p>
          @if (session.hasRole('admin')) {
            <a class="btn btn--primary" routerLink="/productos/nuevo">Nuevo producto</a>
          }
        </div>
      } @else {
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th class="cell-thumb"><span class="visually-hidden">Imagen</span></th>
                <th>Nombre</th>
                <th>Categoría</th>
                <th class="table__num">Precio</th>
                <th class="table__num">Stock</th>
                @if (session.hasRole('admin')) {
                  <th class="table__actions">Acciones</th>
                }
              </tr>
            </thead>
            <tbody>
              @for (product of store.items(); track product.id) {
                <tr>
                  <td class="cell-thumb">
                    @if (drawable(product.imageUrl); as url) {
                      <img
                        class="thumb"
                        [src]="url"
                        [alt]="'Imagen de ' + product.name"
                        loading="lazy"
                        width="44"
                        height="44"
                        (error)="giveUpOn(url)"
                      />
                    } @else {
                      <span class="thumb thumb--empty">
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path
                            d="M4 5h16v14H4z M4 16l4.5-5 3.5 4 3-2.5L20 17"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="1.6"
                            stroke-linejoin="round"
                          />
                        </svg>
                        <span class="visually-hidden">Sin imagen</span>
                      </span>
                    }
                  </td>
                  <td class="table__name">{{ product.name }}</td>
                  <td><span class="badge badge--neutral">{{ product.categoryName }}</span></td>
                  <td class="table__num">{{ product.price | money }}</td>
                  <td class="table__num stock">
                    <span
                      class="badge"
                      [class.badge--danger]="out(product)"
                      [class.badge--warning]="low(product)"
                      [class.badge--success]="!low(product) && !out(product)"
                      >{{ product.stock }}</span
                    >
                    @if (out(product)) {
                      <span class="visually-hidden">Agotado</span>
                    } @else if (low(product)) {
                      <span class="visually-hidden">Stock bajo</span>
                    }
                  </td>
                  @if (session.hasRole('admin')) {
                    <td class="table__actions">
                      <a
                        class="btn btn--secondary btn--sm"
                        [routerLink]="['/productos', product.id]"
                        [attr.aria-label]="'Editar ' + product.name"
                        >Editar</a
                      >
                    </td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>

        <app-paginator
          [page]="store.page().page"
          [totalPages]="store.totalPages()"
          (go)="changePage($event)"
        />
      }
    </div>
  `,
  styles: `
    /* .visually-hidden is absolutely positioned: without a containing block of its own it
       resolves against the page and drags the document's scroll width out to where the wide
       table put it, which is a horizontal scrollbar on the phone. */
    .stock,
    .thumb {
      position: relative;
    }
    .cell-thumb {
      width: 1%;
      padding-right: 0;
    }
    .thumb {
      display: grid;
      place-items: center;
      width: 2.75rem;
      height: 2.75rem;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background: var(--color-surface-sunken);
      object-fit: cover;
    }
    .thumb--empty {
      border-style: dashed;
      color: var(--color-text-muted);
    }
    .thumb--empty svg {
      width: 1.25rem;
      height: 1.25rem;
    }
  `,
})
export class ProductListPage implements OnInit {
  protected readonly store = inject(ProductsStore);
  protected readonly session = inject(SessionStore);

  protected readonly low = isLowStock;
  protected readonly out = isOutOfStock;

  private readonly unreachable = signal<ReadonlySet<string>>(new Set());

  /**
   * CA-03.2 promises the address is either absent or good, and a picture the browser cannot
   * decode arrives as neither: the placeholder says «no image» far better than a broken glyph.
   */
  protected drawable(imageUrl: string | null): string | null {
    return imageUrl !== null && !this.unreachable().has(imageUrl) ? imageUrl : null;
  }

  protected giveUpOn(imageUrl: string): void {
    this.unreachable.update((known) => new Set(known).add(imageUrl));
  }

  ngOnInit(): void {
    void this.store.load({}, DEFAULT_PAGE);
  }

  protected changePage(page: number): void {
    void this.store.load(undefined, { ...this.store.page(), page });
  }
}
