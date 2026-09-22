export interface PagedResult<T> {
  readonly items: readonly T[];
  readonly page: number;
  readonly size: number;
  readonly total: number;
  readonly totalPages: number;
}

export interface PageRequest {
  readonly page: number;
  readonly size: number;
}

export const DEFAULT_PAGE: PageRequest = { page: 1, size: 20 };
