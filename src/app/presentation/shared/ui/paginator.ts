import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'app-paginator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="paginator" aria-label="Paginación">
      <button
        class="btn btn--secondary btn--sm"
        type="button"
        [disabled]="page() <= 1"
        (click)="go.emit(page() - 1)"
      >
        Anterior
      </button>
      <span class="paginator__status">Página {{ page() }} de {{ safeTotalPages() }}</span>
      <button
        class="btn btn--secondary btn--sm"
        type="button"
        [disabled]="page() >= safeTotalPages()"
        (click)="go.emit(page() + 1)"
      >
        Siguiente
      </button>
    </nav>
  `,
})
export class Paginator {
  readonly page = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly go = output<number>();

  protected readonly safeTotalPages = computed(() => Math.max(1, this.totalPages()));
}
