import { DOCUMENT, inject, Injectable } from '@angular/core';
import { ProjectPageNavigatorPort } from '../../application/ports/project-page-navigator.port';

/**
 * The location comes from DOCUMENT and not from the global window: only an injected one can be
 * stood in for, and a spec that reached the real one would navigate the test runner away from
 * its own page.
 */
@Injectable()
export class DocumentProjectPageNavigator extends ProjectPageNavigatorPort {
  private readonly document = inject(DOCUMENT);

  override replaceCurrentPage(url: string): void {
    this.document.location.replace(url);
  }
}
