import { Routes } from '@angular/router';
import { adminGuard } from './presentation/guards/admin.guard';
import { authGuard } from './presentation/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./presentation/features/auth/pages/login.page').then((m) => m.LoginPage),
  },
  /**
   * Outside the shell and outside authGuard on purpose: the project page is public, and a
   * visitor who types this address should not be asked to sign in first.
   */
  {
    path: 'pagina-del-proyecto',
    loadComponent: () =>
      import('./presentation/features/project-page/pages/project-page-redirect.page').then(
        (m) => m.ProjectPageRedirectPage,
      ),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./presentation/layout/shell').then((m) => m.Shell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'productos' },
      {
        path: 'productos',
        loadComponent: () =>
          import('./presentation/features/products/pages/product-list.page').then(
            (m) => m.ProductListPage,
          ),
      },
      {
        path: 'productos/nuevo',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./presentation/features/products/pages/product-form.page').then(
            (m) => m.ProductFormPage,
          ),
      },
      {
        path: 'productos/:id',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./presentation/features/products/pages/product-form.page').then(
            (m) => m.ProductFormPage,
          ),
      },
      {
        path: 'ventas/nueva',
        loadComponent: () =>
          import('./presentation/features/sales/pages/new-sale.page').then((m) => m.NewSalePage),
      },
      {
        path: 'ventas',
        loadComponent: () =>
          import('./presentation/features/sales/pages/sale-list.page').then((m) => m.SaleListPage),
      },
      {
        path: 'reportes',
        loadComponent: () =>
          import('./presentation/features/reports/pages/sales-report.page').then(
            (m) => m.SalesReportPage,
          ),
      },
      {
        path: 'vendedores/nuevo',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./presentation/features/sellers/pages/seller-form.page').then(
            (m) => m.SellerFormPage,
          ),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
