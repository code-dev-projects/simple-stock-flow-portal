import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { ProjectPageNavigatorPort } from '../../../../application/ports/project-page-navigator.port';

/**
 * A page and not a guard that cancels: the browser keeps showing this document until the
 * external page answers, and a cancelled navigation renders nothing, so a visitor whose
 * network or whose project page is down would be left on an empty portal with nothing to
 * click. Being activated also gives the redirect a history entry of its own to spend, which
 * is what keeps the page the visitor came from reachable with the back button.
 */
@Component({
  selector: 'app-project-page-redirect',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="leaving">
      <div class="leaving__card card">
        <div class="card__body">
          <h1 class="page-title">Te estamos llevando a la página del proyecto</h1>
          <p class="page-subtitle">
            Si no se abre en unos segundos, puede que la página no esté disponible o que no
            haya conexión.
          </p>

          <div class="leaving__actions">
            <a class="leaving__link btn btn--primary" [href]="projectPageUrl">
              Abrir la página del proyecto
            </a>
            <a class="leaving__back btn btn--ghost" routerLink="/">Volver al portal</a>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    .leaving {
      display: grid;
      place-items: center;
      min-height: 100vh;
      min-height: 100dvh;
      padding: var(--space-6) var(--space-5);
      background: var(--color-surface);
    }

    .leaving__card {
      width: min(34rem, 100%);
    }

    .leaving__actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-3);
    }
  `,
})
export class ProjectPageRedirectPage implements OnInit {
  private readonly navigator = inject(ProjectPageNavigatorPort);

  protected readonly projectPageUrl = environment.projectPageUrl;

  ngOnInit(): void {
    this.navigator.replaceCurrentPage(this.projectPageUrl);
  }
}
