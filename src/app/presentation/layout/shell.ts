import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CartStore } from '../../application/state/cart.store';
import { SessionStore } from '../../application/state/session.store';
import { Role } from '../../domain/models/session.model';
import { environment } from '../../../environments/environment';

const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrador',
  seller: 'Vendedor',
};

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <header class="app-header">
      <div class="app-brand">
        <span class="app-brand__mark" aria-hidden="true">SSF</span>
        <span class="app-brand__name">Simple Stock Flow</span>
      </div>

      <nav class="app-nav" aria-label="Navegación principal">
        <a class="app-nav__link" routerLink="/productos" routerLinkActive="is-active">Productos</a>
        <a class="app-nav__link" routerLink="/ventas/nueva" routerLinkActive="is-active">
          Nueva venta
        </a>
        <!-- Without exact matching /ventas/nueva would also light up "Ventas". -->
        <a
          class="app-nav__link"
          routerLink="/ventas"
          routerLinkActive="is-active"
          [routerLinkActiveOptions]="{ exact: true }"
        >
          Ventas
        </a>
        <a class="app-nav__link" routerLink="/reportes" routerLinkActive="is-active">Reportes</a>
        @if (session.hasRole('admin')) {
          <a class="app-nav__link" routerLink="/vendedores/nuevo" routerLinkActive="is-active">
            Nuevo vendedor
          </a>
        }

        <a
          class="app-nav__link app-nav__link--external"
          [href]="projectPageUrl"
          target="_blank"
          rel="noopener noreferrer"
        >
          Página del proyecto
          <span class="visually-hidden">(se abre en una pestaña nueva)</span>
          <span class="app-nav__external-mark" aria-hidden="true">↗</span>
        </a>

        <!-- A plain anchor and not a routerLink: /swagger is not an Angular route, it is the
             service's own page, reached through the portal's proxy. And a new tab because the
             cart lives in memory: leaving the application would empty it in the middle of a sale. -->
        <a
          class="app-nav__link app-nav__link--external"
          href="/swagger"
          target="_blank"
          rel="noopener noreferrer"
        >
          Documentación de la API
          <span class="visually-hidden">(se abre en una pestaña nueva)</span>
          <span class="app-nav__external-mark" aria-hidden="true">↗</span>
        </a>
      </nav>

      <div class="app-session">
        <span class="app-cart" [class.is-filled]="cart.count() > 0">
          <span class="app-cart__label">Carrito</span>
          <span
            class="badge badge--count"
            [class.badge--accent]="cart.count() > 0"
            [attr.aria-label]="cart.count() + ' líneas en el carrito'"
          >
            {{ cart.count() }}
          </span>
        </span>

        <span class="app-user">
          <span class="app-user__name">{{ session.username() }}</span>
          <span class="app-user__role">{{ roleLabel() }}</span>
        </span>

        <button type="button" class="btn btn--secondary btn--sm" (click)="logout()">Salir</button>
      </div>
    </header>

    <main class="app-main">
      <router-outlet />
    </main>
  `,
  styles: `
    :host {
      display: block;
    }
    .app-header {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--space-4) var(--space-6);
      min-height: var(--header-height);
      /* Keeps the brand aligned with the content column instead of hugging the window edge. */
      padding: var(--space-3) max(var(--space-6), calc((100% - var(--layout-max)) / 2));
      background: var(--color-surface-elevated);
      border-bottom: 1px solid var(--color-border);
      box-shadow: var(--shadow-sm);
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .app-brand {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      font-weight: var(--weight-semibold);
    }
    .app-brand__mark {
      display: grid;
      place-items: center;
      width: 1.75rem;
      height: 1.75rem;
      border-radius: var(--radius-md);
      background: var(--color-accent);
      color: #fff;
      font-size: var(--text-xs);
      letter-spacing: 0.02em;
    }
    .app-nav {
      display: flex;
      align-items: center;
      gap: var(--space-1);
      flex: 1 1 auto;
      overflow-x: auto;
      scrollbar-width: none;
    }
    .app-nav::-webkit-scrollbar {
      display: none;
    }
    .app-nav__link {
      padding: var(--space-2) var(--space-4);
      border-radius: var(--radius-md);
      color: var(--color-text-muted);
      font-size: var(--text-sm);
      font-weight: var(--weight-medium);
      white-space: nowrap;
      transition:
        background var(--transition-fast),
        color var(--transition-fast);
    }
    .app-nav__link:hover {
      background: var(--color-surface-sunken);
      color: var(--color-text);
      text-decoration: none;
    }
    .app-nav__link.is-active {
      background: var(--color-accent-soft);
      color: var(--color-accent-text);
      font-weight: var(--weight-semibold);
    }
    /* The rule separates the one destination outside the portal from the routes, so it is not
       read as another page of the application. The containing block is its own: .visually-hidden
       is absolutely positioned and would otherwise resolve against the sticky header. */
    .app-nav__link--external {
      position: relative;
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      margin-left: var(--space-2);
      padding-left: var(--space-5);
      border-left: 1px solid var(--color-border);
      font-weight: var(--weight-regular);
    }
    .app-nav__external-mark {
      font-size: var(--text-xs);
      line-height: 1;
    }
    .app-session {
      display: flex;
      align-items: center;
      gap: var(--space-4);
      margin-left: auto;
    }
    .app-cart {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-2) var(--space-3);
      border: 1px solid transparent;
      border-radius: var(--radius-md);
      color: var(--color-text-muted);
      font-size: var(--text-sm);
    }
    .app-cart.is-filled {
      border-color: var(--color-accent);
      background: var(--color-accent-soft);
      color: var(--color-accent-text);
      font-weight: var(--weight-medium);
    }
    .app-user {
      display: grid;
      line-height: var(--leading-tight);
      padding-left: var(--space-4);
      border-left: 1px solid var(--color-border);
    }
    .app-user__name {
      font-size: var(--text-sm);
      font-weight: var(--weight-semibold);
    }
    .app-user__role {
      color: var(--color-text-muted);
      font-size: var(--text-xs);
    }
    /* A table wider than the phone screen scrolls inside the content area instead of dragging
       the whole document, which would take the header with it. */
    .app-main {
      padding: var(--space-7) max(var(--space-6), calc((100% - var(--layout-max)) / 2))
        var(--space-8);
      overflow-x: auto;
    }
    @media (max-width: 52rem) {
      .app-header {
        padding-inline: var(--space-4);
      }
      .app-nav {
        order: 3;
        width: 100%;
        flex-basis: 100%;
      }
      .app-session {
        gap: var(--space-3);
      }
      .app-cart__label {
        display: none;
      }
      .app-main {
        padding: var(--space-5) var(--space-4) var(--space-7);
      }
    }
  `,
})
export class Shell {
  protected readonly session = inject(SessionStore);
  protected readonly cart = inject(CartStore);
  protected readonly projectPageUrl = environment.projectPageUrl;
  private readonly router = inject(Router);

  protected readonly roleLabel = computed(() => {
    const role = this.session.session()?.role;
    return role ? ROLE_LABELS[role] : '';
  });

  protected logout(): void {
    this.session.clear();
    this.cart.clear();
    void this.router.navigate(['/login']);
  }
}
