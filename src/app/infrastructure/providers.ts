import { Provider } from '@angular/core';
import { AuthRepositoryPort, SessionStoragePort } from '../application/ports/auth-repository.port';
import { ProductRepositoryPort } from '../application/ports/product-repository.port';
import { ProjectPageNavigatorPort } from '../application/ports/project-page-navigator.port';
import { ReportRepositoryPort } from '../application/ports/report-repository.port';
import { SaleRepositoryPort } from '../application/ports/sale-repository.port';
import { DocumentProjectPageNavigator } from './browser/document-project-page.navigator';
import { HttpAuthRepository } from './http/http-auth.repository';
import { HttpProductRepository } from './http/http-product.repository';
import { HttpReportRepository } from './http/http-report.repository';
import { HttpSaleRepository } from './http/http-sale.repository';
import { LocalSessionStorage } from './http/local-session.storage';

/**
 * THE composition root of the front end: the only file where a port meets its adapter.
 * Swapping the backend for mocks means changing this array and nothing else.
 */
export const infrastructureProviders: Provider[] = [
  { provide: ProductRepositoryPort, useClass: HttpProductRepository },
  { provide: SaleRepositoryPort, useClass: HttpSaleRepository },
  { provide: ReportRepositoryPort, useClass: HttpReportRepository },
  { provide: AuthRepositoryPort, useClass: HttpAuthRepository },
  { provide: SessionStoragePort, useClass: LocalSessionStorage },
  { provide: ProjectPageNavigatorPort, useClass: DocumentProjectPageNavigator },
];
