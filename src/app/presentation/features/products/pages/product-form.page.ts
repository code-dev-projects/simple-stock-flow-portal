import { ChangeDetectionStrategy, Component, inject, input, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SaveProductUseCase } from '../../../../application/use-cases/save-product.use-case';
import { GetProductUseCase } from '../../../../application/use-cases/get-product.use-case';
import { ListCategoriesUseCase } from '../../../../application/use-cases/list-categories.use-case';

@Component({
  selector: 'app-product-form-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page page--narrow">
      <div class="page-header">
        <div class="page-header__text">
          <h1 class="page-title">{{ id() ? 'Editar producto' : 'Nuevo producto' }}</h1>
          <p class="page-subtitle">
            {{
              id()
                ? 'Cambia los datos y guarda; la imagen solo se reemplaza si eliges una nueva.'
                : 'El precio va en pesos colombianos y el stock en unidades enteras.'
            }}
          </p>
        </div>
      </div>

      <form class="card" [formGroup]="form" (ngSubmit)="submit()">
        <div class="card__body">
          <label class="field" [class.field--invalid]="showsError('name')">
            <span class="field__label">Nombre</span>
            <input type="text" formControlName="name" autocomplete="off" />
            @if (showsError('name')) {
              <span class="field__error">El nombre es obligatorio.</span>
            }
          </label>

          <div class="form-grid">
            <label class="field" [class.field--invalid]="showsError('price')">
              <span class="field__label">Precio</span>
              <input type="number" formControlName="price" min="1" step="0.01" />
              @if (showsError('price')) {
                <span class="field__error">El precio debe ser mayor que cero.</span>
              } @else {
                <span class="field__hint">En pesos colombianos.</span>
              }
            </label>

            <label class="field" [class.field--invalid]="showsError('stock')">
              <span class="field__label">Stock</span>
              <input type="number" formControlName="stock" min="0" step="1" />
              @if (showsError('stock')) {
                <span class="field__error">El stock no puede ser negativo.</span>
              } @else {
                <span class="field__hint">Unidades disponibles para vender.</span>
              }
            </label>

            <label class="field" [class.field--invalid]="showsError('categoryId')">
              <span class="field__label">Categoría</span>
              <select formControlName="categoryId">
                <option value="" disabled>Selecciona una categoría</option>
                @for (category of categories(); track category.id) {
                  <option [value]="category.id">{{ category.name }}</option>
                }
              </select>
              @if (showsError('categoryId')) {
                <span class="field__error">Elige una categoría.</span>
              } @else {
                <span class="field__hint">
                  Las categorías son fijas en esta versión: el catálogo de categorías se define en
                  el despliegue, no desde el portal.
                </span>
              }
            </label>
          </div>

          <div class="field">
            <span class="field__label">Imagen</span>
            <div class="picture">
              @if (imageUrl(); as url) {
                <img
                  class="picture__current"
                  [src]="url"
                  [alt]="'Imagen actual de ' + (form.controls.name.value || 'el producto')"
                  loading="lazy"
                  (error)="imageUrl.set(null)"
                />
              } @else {
                <span class="picture__current picture__current--empty">Sin imagen</span>
              }
              <div class="picture__control">
                <!-- The native control writes "Choose File" in the browser's language, which is
                     not the reader's: the input is hidden and its label does the talking. -->
                <input
                  id="product-image"
                  class="visually-hidden"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  (change)="pickImage($event)"
                />
                <label class="btn btn--secondary btn--sm" for="product-image">
                  {{ pickedName() ? 'Cambiar imagen' : 'Elegir imagen' }}
                </label>
                <span class="field__hint">
                  {{ pickedName() ?? 'JPEG, PNG o WebP, hasta 5 MB.' }}
                </span>
              </div>
            </div>
          </div>

          @if (error(); as message) {
            <p class="alert alert--error" role="alert">{{ message }}</p>
          }
        </div>

        <div class="card__footer">
          <div class="form-actions">
            <button class="btn btn--primary" type="submit" [disabled]="form.invalid || saving()">
              {{ saving() ? 'Guardando...' : 'Guardar' }}
            </button>
            <a class="btn btn--ghost" routerLink="/productos">Cancelar</a>
          </div>
        </div>
      </form>
    </div>
  `,
  styles: `
    .picture {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--space-5);
    }
    .picture__current {
      display: grid;
      place-items: center;
      width: 6rem;
      height: 6rem;
      flex: none;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background: var(--color-surface-sunken);
      object-fit: cover;
    }
    .picture__current--empty {
      border-style: dashed;
      color: var(--color-text-muted);
      font-size: var(--text-xs);
    }
    .picture__control {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      justify-items: start;
      gap: var(--space-2);
      flex: 1 1 14rem;
    }
    .picture__control .field__hint {
      overflow-wrap: anywhere;
    }
    /* The input is off-screen, so the ring it would draw has to move to what stands in for it. */
    .picture__control input:focus-visible + label {
      outline: 2px solid var(--color-focus);
      outline-offset: 2px;
    }
  `,
})
export class ProductFormPage implements OnInit {
  /** Bound by withComponentInputBinding from the productos/:id route. */
  readonly id = input<string | undefined>();

  private readonly saveProduct = inject(SaveProductUseCase);
  private readonly getProduct = inject(GetProductUseCase);
  private readonly listCategories = inject(ListCategoriesUseCase);
  private readonly router = inject(Router);

  protected readonly categories = signal<readonly { id: string; name: string }[]>([]);
  protected readonly imageUrl = signal<string | null>(null);
  protected readonly pickedName = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  private image?: File;

  protected readonly form = inject(FormBuilder).nonNullable.group({
    name: ['', Validators.required],
    price: [0, [Validators.required, Validators.min(0.01)]],
    stock: [0, [Validators.required, Validators.min(0)]],
    categoryId: ['', Validators.required],
  });

  async ngOnInit(): Promise<void> {
    try {
      this.categories.set(await this.listCategories.execute());

      const id = this.id();
      if (!id) return;

      const product = await this.getProduct.execute(id);
      if (product) {
        this.form.patchValue({
          name: product.name,
          price: product.price.amount,
          stock: product.stock,
          categoryId: product.categoryId,
        });
        this.imageUrl.set(product.imageUrl);
      }
    } catch (error) {
      // Without categories the selector is empty and nothing can be saved: an empty form that
      // fails on submit hides the real cause.
      this.error.set(
        error instanceof Error ? error.message : 'No se pudieron cargar los datos del formulario.',
      );
    }
  }

  /** A message only earns its place once the person has had a chance to get the field right. */
  protected showsError(name: 'name' | 'price' | 'stock' | 'categoryId'): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || control.dirty);
  }

  protected pickImage(event: Event): void {
    this.image = (event.target as HTMLInputElement).files?.[0];
    this.pickedName.set(this.image?.name ?? null);
  }

  protected async submit(): Promise<void> {
    if (this.form.invalid) return;

    this.saving.set(true);
    this.error.set(null);

    try {
      await this.saveProduct.execute(this.form.getRawValue(), this.id(), this.image);
      await this.router.navigate(['/productos']);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No se pudo guardar.');
    } finally {
      this.saving.set(false);
    }
  }
}
