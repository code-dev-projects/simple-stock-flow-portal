import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { RegisterSellerUseCase } from '../../../../application/use-cases/register-seller.use-case';

@Component({
  selector: 'app-seller-form-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page page--narrow">
      <div class="page-header">
        <div class="page-header__text">
          <h1 class="page-title">Nuevo vendedor</h1>
          <p class="page-subtitle">
            Da acceso a quien va a registrar ventas y consultar el catálogo.
          </p>
        </div>
      </div>

      <form class="card" [formGroup]="form" (ngSubmit)="submit()">
        <div class="card__body">
          <p class="alert alert--info">
            Toda cuenta creada aquí es de vendedor. El rol de administrador no se da de alta desde
            el portal: lo siembra el despliegue.
          </p>

          <label class="field" [class.field--invalid]="showsError('username')">
            <span class="field__label">Nombre de usuario</span>
            <input type="text" formControlName="username" autocomplete="off" />
            @if (showsError('username')) {
              <span class="field__error">El nombre de usuario es obligatorio.</span>
            } @else {
              <span class="field__hint">Con este nombre iniciará sesión en el portal.</span>
            }
          </label>

          <label class="field" [class.field--invalid]="showsError('password')">
            <span class="field__label">Clave</span>
            <input type="password" formControlName="password" autocomplete="new-password" />
            @if (showsError('password')) {
              <span class="field__error">La clave es obligatoria.</span>
            } @else {
              <span class="field__hint">
                Entrégasela por un canal aparte: el portal no vuelve a mostrarla.
              </span>
            }
          </label>

          @if (created(); as username) {
            <p class="alert alert--success" role="status">
              Se creó el vendedor «{{ username }}». Ya puedes dar de alta a otro.
            </p>
          }

          @if (error(); as message) {
            <p class="alert alert--error" role="alert">{{ message }}</p>
          }
        </div>

        <div class="card__footer">
          <div class="form-actions">
            <button class="btn btn--primary" type="submit" [disabled]="form.invalid || saving()">
              {{ saving() ? 'Creando...' : 'Crear vendedor' }}
            </button>
            <a class="btn btn--ghost" routerLink="/productos">Volver al catálogo</a>
          </div>
        </div>
      </form>
    </div>
  `,
})
export class SellerFormPage {
  private readonly registerSeller = inject(RegisterSellerUseCase);

  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly created = signal<string | null>(null);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  /** A message only earns its place once the person has had a chance to get the field right. */
  protected showsError(name: 'username' | 'password'): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || control.dirty);
  }

  protected async submit(): Promise<void> {
    if (this.form.invalid) return;

    const credentials = this.form.getRawValue();
    this.saving.set(true);
    this.error.set(null);
    this.created.set(null);

    try {
      await this.registerSeller.execute(credentials);
      this.created.set(credentials.username);
      this.form.reset();
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No se pudo crear el vendedor.');
    } finally {
      this.saving.set(false);
    }
  }
}
